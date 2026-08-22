import type { ArenaHabitatKey, Companion, Encounter } from "./rpgTypes";

export type BattlePortrait = {
  className: string;
  description: string;
  glyph: string;
  imageUrl: string;
};

const HABITAT_BACKGROUNDS: Record<ArenaHabitatKey, string | undefined> = {
  "tidal-grove": "/manus-storage/academy-tidal-grove-arena_0e369947.png",
  "cloud-shelf": "/manus-storage/uncolored_peaks_e2e91e65.png",
  "star-current": "/manus-storage/sky_f4784c05.png",
  "coral-shallows": "/manus-storage/colored_talltrees_2d7cadc5.png",
};

const COMPANION_PORTRAITS: Record<string, BattlePortrait> = {
  "tide-scout": {
    className: "avatar-tide-scout",
    description: "原創潮芽獸戰鬥頭像",
    glyph: "◈",
    imageUrl: "/manus-storage/academy-tide-scout_c101b8a9.png",
  },
  "ember-guard": {
    className: "avatar-ember-guard",
    description: "原創焰甲衛戰鬥頭像",
    glyph: "▲",
    imageUrl: "/manus-storage/academy-ember-guard_736a716e.png",
  },
  "star-runner": {
    className: "avatar-star-runner",
    description: "原創星浪行者戰鬥頭像",
    glyph: "✧",
    imageUrl: "/manus-storage/academy-star-runner_c223a85e.png",
  },
  "milk-dragonling": {
    className: "avatar-milk-dragonling",
    description: "原創奶泡龍崽戰鬥頭像",
    glyph: "❋",
    imageUrl: "/manus-storage/academy-milk-dragonling_cd5c04e0.png",
  },
};

const ENCOUNTER_PORTRAITS: Record<string, BattlePortrait> = {
  "moss-mote": { className: "avatar-moss-mote", description: "原創苔光小靈戰鬥頭像", glyph: "✿", imageUrl: "/manus-storage/academy-moss-mote_7311eab0.png" },
  "tide-wisp": { className: "avatar-tide-wisp", description: "原創潮影靈戰鬥頭像", glyph: "◉", imageUrl: "/manus-storage/academy-tide-wisp_83939292.png" },
  "cloud-shell": { className: "avatar-cloud-shell", description: "原創雲殼獸戰鬥頭像", glyph: "◒", imageUrl: "/manus-storage/academy-cloud-shell_8a772abd.png" },
  "ember-ibis": { className: "avatar-ember-ibis", description: "原創焰羽鷺戰鬥頭像", glyph: "△", imageUrl: "/manus-storage/academy-ember-ibis_b653837d.png" },
  "star-fin": { className: "avatar-star-fin", description: "原創星鰭魚戰鬥頭像", glyph: "✦", imageUrl: "/manus-storage/academy-star-fin_bd723341.png" },
  "orbit-koi": { className: "avatar-orbit-koi", description: "原創環軌錦鯉戰鬥頭像", glyph: "◎", imageUrl: "/manus-storage/academy-orbit-koi_92acb4e8.png" },
  "coral-sprout": { className: "avatar-coral-sprout", description: "原創珊芽獸戰鬥頭像", glyph: "✽", imageUrl: "/manus-storage/academy-coral-sprout_8aab3a7e.png" },
  "reef-warden": { className: "avatar-reef-warden", description: "原創礁語守望者戰鬥頭像", glyph: "⬟", imageUrl: "/manus-storage/academy-reef-warden_cabe30a5.png" },
};

export function battleBackgroundForHabitat(habitatId: ArenaHabitatKey) {
  return HABITAT_BACKGROUNDS[habitatId];
}

export function battlePortraitForCompanion(companion?: Pick<Companion, "id">) {
  return companion ? COMPANION_PORTRAITS[companion.id] : undefined;
}

export function battlePortraitForEncounter(_encounter?: Pick<Encounter, "id">): BattlePortrait | undefined {
  return _encounter ? ENCOUNTER_PORTRAITS[_encounter.id] : undefined;
}
