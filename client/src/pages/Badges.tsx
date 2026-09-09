import { Lock, Trophy } from "lucide-react";
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
}

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
    },
    {
      id: "answers-50",
      icon: "📚",
      title: "勤學小水手",
      description: "累計完成 50 題作答",
      earned: player.totalAnswers >= 50,
    },
    {
      id: "answers-200",
      icon: "🏅",
      title: "答題航海王",
      description: "累計完成 200 題作答",
      earned: player.totalAnswers >= 200,
    },
    {
      id: "correct-100",
      icon: "🎯",
      title: "百題達人",
      description: "累計答對 100 題",
      earned: correctCount >= 100,
    },
    {
      id: "streak-3",
      icon: "📅",
      title: "穩定出航",
      description: "連續簽到 3 天",
      earned: signIn.streak >= 3,
    },
    {
      id: "streak-7",
      icon: "🔥",
      title: "一週探險家",
      description: "連續簽到 7 天",
      earned: signIn.streak >= 7 || titles.indexOf("一週探險家") >= 0,
    },
    {
      id: "boss-1",
      icon: "⚔️",
      title: "首領挑戰者",
      description: "擊敗 1 隻區域守護者",
      earned: bossVictories >= 1,
    },
    {
      id: "boss-4",
      icon: "👑",
      title: "四海征服者",
      description: "擊敗 4 隻區域守護者",
      earned: bossVictories >= 4,
    },
    {
      id: "rare-monster",
      icon: "🦄",
      title: "稀有生物收藏家",
      description: "在戰鬥中擊退稀有生物",
      earned: rareCount >= 1,
    },
    {
      id: "weekly-champion",
      icon: "🐙",
      title: "每週王征服者",
      description: "擊敗一次每週風暴海怪",
      earned: weeklyBossEver,
    },
    {
      id: "companions-3",
      icon: "🧸",
      title: "夥伴收藏家",
      description: "擁有 3 位航海夥伴",
      earned: companionCount >= 3,
    },
    {
      id: "titled",
      icon: "🏷️",
      title: "稱號收集者",
      description: "獲得任何限定稱號",
      earned: titles.length >= 1,
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
            <small>{badge.earned ? "已獲得" : "尚未獲得"}</small>
          </li>
        ))}
      </ul>
    </main>
  );
}
