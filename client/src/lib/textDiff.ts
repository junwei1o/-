// 字級差異：比較「正確答案」與「你的答案」，把不同的字標出來。
//
// 中文選項沒有空格可切 token，所以用 LCS（最長共同子序列）找兩字串的
// 共同部分，其餘標為差異。選項文字通常不到 100 字，O(n·m) 完全夠用。
// 答案文字由題庫保證不重複（見 README），diff 結果不會含糊。

export interface DiffSeg {
  text: string;
  /** true = 差異字（需高亮），false = 共同字 */
  diff: boolean;
}

function toSegs(text: string, flags: boolean[]): DiffSeg[] {
  const segs: DiffSeg[] = [];
  let i = 0;
  while (i < text.length) {
    const diff = flags[i];
    let j = i + 1;
    while (j < text.length && flags[j] === diff) j++;
    segs.push({ text: text.slice(i, j), diff });
    i = j;
  }
  return segs;
}

/**
 * 回傳雙方各自的分段。`a` 用於正確答案卡，`b` 用於你的答案卡，
 * 渲染時把 `diff: true` 的段落高亮即可。
 */
export function charDiff(a: string, b: string): { a: DiffSeg[]; b: DiffSeg[] } {
  const m = a.length;
  const n = b.length;
  const width = n + 1;
  const dp = new Uint16Array((m + 1) * width);
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i * width + j] =
        a[i - 1] === b[j - 1] ? dp[(i - 1) * width + (j - 1)] + 1 : Math.max(dp[(i - 1) * width + j], dp[i * width + (j - 1)]);
    }
  }

  // 回溯：相同字同時消耗雙方；不同時優先判為 b 獨有（插入），
  // 讓差異段盡量連續、可讀性最高。
  const aFlags: boolean[] = [];
  const bFlags: boolean[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      aFlags.push(false);
      bFlags.push(false);
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i * width + (j - 1)] >= dp[(i - 1) * width + j])) {
      bFlags.push(true);
      j--;
    } else {
      aFlags.push(true);
      i--;
    }
  }
  aFlags.reverse();
  bFlags.reverse();
  return { a: toSegs(a, aFlags), b: toSegs(b, bFlags) };
}
