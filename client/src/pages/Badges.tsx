import { Lock, Trophy } from "lucide-react";
import { Link } from "wouter";
import { getDailySignIn, getLimitedTitles, getPlayerData, getRareMonsterDefeats, readStoredJson } from "@/utils/storage";
import { loadRpgState } from "@/game/rpgStorage";
import { WEEKLY_BOSS_STORAGE_KEY } from "@/game/dailyCamp";
import "./Badges.css";

interface BadgeDef {
  id: string;
  icon: string;
  title: string;
  description: string;
  earned: boolean;
  /** 未解鎖時給孩子的下一步指引：文案與目的地。 */
  hint?: { label: string; href: string };
}

const PRACTICE_HINT = { label: "去課綱練習", href: "/practice" };
const CAMP_HINT = { label: "去每日營地", href: "/camp" };
const BATTLE_HINT = { label: "去答題戰鬥", href: "/battle" };
const GUARDIAN_HINT = { label: "去守護者遠征", href: "/guardian" };

export default function Badges() {
  const player = getPlayerData();
  const rpg = loadRpgState();
  const signIn = getDailySignIn();
  const rareDefeats = getRareMonsterDefeats();
  const rareCount = Object.keys(rareDefeats).reduce((sum, id) => sum + (rareDefeats[id] > 0 ? 1 : 0), 0);
  const titles = getLimitedTitles();
  const bossVictories = rpg.academyProgress
    ? Object.keys(rpg.academyProgress).reduce(
        (sum, key) => sum + (rpg.academyProgress?.[key as keyof typeof rpg.academyProgress]?.bossVictories ?? 0),
        0,
      )
    : 0;
  const weeklyBossEver = readStoredJson<{ claimed?: boolean }>(WEEKLY_BOSS_STORAGE_KEY, {}).claimed === true;
  const companionCount = rpg.companions?.length ?? 0;
  const correctCount = rpg.correctAnswerCount ?? 0;

  const badges: BadgeDef[] = [
    {
      id: "first-answer",
      icon: "🌊",
      title: "初試身手",
      description: "完成第 1 題作答",
      earned: player.totalAnswers >= 1,
      hint: PRACTICE_HINT,
    },
    {
      id: "answers-50",
      icon: "📚",
      title: "勤學小水手",
      description: "累計完成 50 題作答",
      earned: player.totalAnswers >= 50,
      hint: PRACTICE_HINT,
    },
    {
      id: "answers-200",
      icon: "🏅",
      title: "答題航海王",
      description: "累計完成 200 題作答",
      earned: player.totalAnswers >= 200,
      hint: PRACTICE_HINT,
    },
    {
      id: "correct-100",
      icon: "🎯",
      title: "百題達人",
      description: "累計答對 100 題",
      earned: correctCount >= 100,
      hint: PRACTICE_HINT,
    },
    {
      id: "streak-3",
      icon: "📅",
      title: "穩定出航",
      description: "連續簽到 3 天",
      earned: signIn.streak >= 3,
      hint: CAMP_HINT,
    },
    {
      id: "streak-7",
      icon: "🔥",
      title: "一週探險家",
      description: "連續簽到 7 天",
      earned: signIn.streak >= 7 || titles.indexOf("一週探險家") >= 0,
      hint: CAMP_HINT,
    },
    {
      id: "boss-1",
      icon: "⚔️",
      title: "首領挑戰者",
      description: "擊敗 1 隻區域守護者",
      earned: bossVictories >= 1,
      hint: GUARDIAN_HINT,
    },
    {
      id: "boss-4",
      icon: "👑",
      title: "四海征服者",
      description: "擊敗 4 隻區域守護者",
      earned: bossVictories >= 4,
      hint: GUARDIAN_HINT,
    },
    {
      id: "rare-monster",
      icon: "🦄",
      title: "稀有生物收藏家",
      description: "在戰鬥中擊退稀有生物",
      earned: rareCount >= 1,
      hint: BATTLE_HINT,
    },
    {
      id: "weekly-champion",
      icon: "🐙",
      title: "每週王征服者",
      description: "擊敗一次每週風暴海怪",
      earned: weeklyBossEver,
      hint: { label: "去挑戰每週王", href: "/camp" },
    },
    {
      id: "companions-3",
      icon: "🧸",
      title: "夥伴收藏家",
      description: "擁有 3 位航海夥伴",
      earned: companionCount >= 3,
      hint: BATTLE_HINT,
    },
    {
      id: "titled",
      icon: "🏷️",
      title: "稱號收集者",
      description: "獲得任何限定稱號",
      earned: titles.length >= 1,
      hint: { label: "連續簽到拿稱號", href: "/camp" },
    },
  ];

  const earnedCount = badges.filter((badge) => badge.earned).length;

  return (
    <main className="badges-wall" aria-label="徽章牆">
      <header className="badges-header">
        <p className="badges-eyebrow">BADGE WALL</p>
        <h1><Trophy size={26} aria-hidden="true" /> 徽章牆</h1>
        <p>每一枚徽章都是探險足跡。持續練習、簽到與挑戰，把整面牆點亮！</p>
        <p className="badges-progress" aria-label={`已獲得 ${earnedCount} / ${badges.length} 枚徽章`}>
          已獲得 <strong>{earnedCount}</strong> / {badges.length} 枚
        </p>
      </header>

      <ul className="badges-grid">
        {badges.map((badge) => (
          <li key={badge.id} className={`badge-card${badge.earned ? " is-earned" : " is-locked"}`}>
            <span className="badge-icon" aria-hidden="true">
              {badge.earned ? badge.icon : <Lock size={22} />}
            </span>
            <strong>{badge.title}</strong>
            <p>{badge.description}</p>
            {badge.earned ? (
              <small>已獲得</small>
            ) : (
              <>
                <small>尚未獲得</small>
                {badge.hint ? (
                  <Link className="badge-hint-link" href={badge.hint.href}>
                    {badge.hint.label}
                  </Link>
                ) : null}
              </>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
