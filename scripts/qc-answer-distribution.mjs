#!/usr/bin/env node
// QC 题库答案位置分布检查脚本
//
// 目的：作为 CI 闸门，防止题库答案过度集中在某一选项（如「全选 A 就能答对 44-62%」）。
// 读取学生实际加载的三个题库来源，按「学段(小學/國中) × 科目」维度统计四选一选择题
// 答案落在 0/1/2/3 的占比，偏离 25% 超过 8 个百分点（任一选项 >33% 或 <17%）且样本数 >= 30
// 即判定不合格。
//
// 用法：
//   node scripts/qc-answer-distribution.mjs          # 人类可读表格
//   node scripts/qc-answer-distribution.mjs --json   # 机器可读 JSON
//
// 退出码：有不合格组 -> 1；全部合格 -> 0；无可用数据 -> 0（仅警告，不误杀）。
//
// 仅依赖 node:fs / node:url / node:path，无外部依赖。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
// 脚本位于 <root>/scripts/，题库位于 <root>/data/，故项目根为 scripts 的父目录。
const ROOT = path.resolve(SCRIPT_DIR, '..');

// 三个题库来源。defaultSeg 用于题目未携带有效 grade 时回退判定学段。
const SOURCES = [
  { file: 'data/runtime_bank_elementary.json', defaultSeg: '小學', label: 'runtime_bank_elementary' },
  { file: 'data/runtime_bank_junior.json', defaultSeg: '國中', label: 'runtime_bank_junior' },
  { file: 'data/taiwan_english_seed.json', defaultSeg: '小學', label: 'taiwan_english_seed' },
];

const MIN_N = 30; // 判定不合格所需的最小样本数
const LOW = 17; // 占比低于此值视为「不足」
const HIGH = 33; // 占比高于此值视为「过度集中」

const OPT_LABELS = ['A', 'B', 'C', 'D'];

function segFromGrade(g) {
  if (Number.isInteger(g)) {
    if (g >= 1 && g <= 6) return '小學';
    if (g >= 7 && g <= 9) return '國中';
  }
  return null;
}

// 筛选四选一选择题（与任务约束一致）
function isFourChoice(q) {
  if (q == null) return false;
  if (q.questionType === '是非題') return false;
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) return false;
  return true;
}

// 读取单个来源，文件不存在或解析失败均不抛异常
function loadQuestions(src) {
  const p = path.resolve(ROOT, src.file);
  try {
    const raw = fs.readFileSync(p, 'utf8');
    const data = JSON.parse(raw);
    const qs = Array.isArray(data) ? data : Array.isArray(data.questions) ? data.questions : null;
    if (!qs) {
      return { ok: false, path: p, error: '未找到 questions 数组' };
    }
    return { ok: true, path: p, questions: qs };
  } catch (e) {
    const reason = e && e.code === 'ENOENT' ? '文件不存在' : `读取失败: ${e.message}`;
    return { ok: false, path: p, error: reason };
  }
}

// 按「学段 × 科目」聚合（跨文件合并同一维度；记录贡献文件）
function buildGroups() {
  const groups = new Map(); // key: `${seg}|${subject}` -> {seg, subject, counts:[4], n, files:Set}

  for (const src of SOURCES) {
    const res = loadQuestions(src);
    if (!res.ok) {
      // 文件缺失或无效：跳过，不中断
      process.stderr.write(`⚠ 跳过来源 ${src.file}（${res.error}）\n`);
      continue;
    }
    for (const q of res.questions) {
      if (!isFourChoice(q)) continue;
      const seg = segFromGrade(q.grade) || src.defaultSeg;
      const subject = typeof q.subject === 'string' && q.subject.trim() ? q.subject.trim() : '(未知科目)';
      const key = `${seg}|${subject}`;
      let g = groups.get(key);
      if (!g) {
        g = { seg, subject, counts: [0, 0, 0, 0], n: 0, files: new Set() };
        groups.set(key, g);
      }
      g.counts[q.answer]++;
      g.n++;
      g.files.add(src.file);
    }
  }
  return groups;
}

// 判定单组是否合格，返回 { pass, reason }
function classify(g) {
  const pcts = g.counts.map((c) => (g.n > 0 ? (100 * c) / g.n : 0));
  const reasons = [];
  for (let i = 0; i < 4; i++) {
    if (pcts[i] > HIGH) reasons.push(`${OPT_LABELS[i]} 過度集中`);
    else if (pcts[i] < LOW) reasons.push(`${OPT_LABELS[i]} 不足`);
  }
  // 仅当样本数达到 MIN_N 且存在越界时才判定不合格
  const fail = g.n >= MIN_N && reasons.length > 0;
  return { pass: !fail, reason: reasons.join('，') };
}

function fmtPct(v) {
  return `${v.toFixed(1)}%`;
}

function renderHuman(groups) {
  const list = [...groups.values()].sort((a, b) => {
    if (a.seg !== b.seg) return a.seg === '小學' ? -1 : 1;
    return a.subject.localeCompare(b.subject, 'zh-Hant');
  });

  const lines = [];
  lines.push('=== 答案位置分布检查 ===');
  let failCount = 0;
  for (const g of list) {
    const { pass, reason } = classify(g);
    if (!pass) failCount++;
    const dist = OPT_LABELS.map((o, i) => `${o}: ${fmtPct(g.n > 0 ? (100 * g.counts[i]) / g.n : 0)}`).join(' ');
    const nField = `n=${String(g.n).padStart(4)}`;
    const verdict = pass ? '✅' : `❌ ${reason}`;
    lines.push(`[${g.seg}部] ${g.subject}  ${nField}  ${dist}  ${verdict}`);
  }

  const total = list.length;
  if (total === 0) {
    lines.push('（无可用题库数据，未执行任何检查）');
  } else if (failCount > 0) {
    lines.push(`❌ ${failCount} 組不合格 / 共檢查 ${total} 組`);
  } else {
    lines.push(`✅ 全部 ${total} 組合格`);
  }
  return { text: lines.join('\n'), total, failCount };
}

function renderJson(groups) {
  const list = [...groups.values()].sort((a, b) => {
    if (a.seg !== b.seg) return a.seg === '小學' ? -1 : 1;
    return a.subject.localeCompare(b.subject, 'zh-Hant');
  });

  const out = {
    summary: { totalGroups: list.length, failCount: 0, pass: true, exitCode: 0 },
    groups: [],
  };
  for (const g of list) {
    const { pass, reason } = classify(g);
    if (!pass) out.summary.failCount++;
    const pcts = g.counts.map((c) => (g.n > 0 ? Number(((100 * c) / g.n).toFixed(2)) : 0));
    out.groups.push({
      segment: g.seg,
      subject: g.subject,
      n: g.n,
      counts: { A: g.counts[0], B: g.counts[1], C: g.counts[2], D: g.counts[3] },
      percentages: { A: pcts[0], B: pcts[1], C: pcts[2], D: pcts[3] },
      pass,
      reason: pass ? null : reason,
      sources: [...g.files],
    });
  }
  out.summary.pass = out.summary.failCount === 0;
  out.summary.exitCode = out.summary.pass ? 0 : 1;
  return out;
}

function main() {
  const useJson = process.argv.slice(2).includes('--json');
  const groups = buildGroups();

  if (useJson) {
    const out = renderJson(groups);
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
    process.exit(out.summary.exitCode);
  } else {
    const { text, failCount } = renderHuman(groups);
    process.stdout.write(text + '\n');
    process.exit(failCount > 0 ? 1 : 0);
  }
}

main();
