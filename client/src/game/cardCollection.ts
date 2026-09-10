import { readStoredJson, writeStoredJson } from "@/utils/storage";
import { ALL_CARDS, getRandomUnownedCard, type CardDef, type CardTheme } from "./trumpCardData";

export type CardCollection = {
  ownedCardIds: string[];
  wins: number;
  losses: number;
  draws: number;
  packsOpened: number;
  totalRounds: number;
};

export const CARD_COLLECTION_KEY = "xue-card-collection-v1";

const EMPTY_COLLECTION: CardCollection = {
  ownedCardIds: [],
  wins: 0,
  losses: 0,
  draws: 0,
  packsOpened: 0,
  totalRounds: 0,
};

export function getCardCollection(): CardCollection {
  const raw = readStoredJson<Partial<CardCollection> | null>(CARD_COLLECTION_KEY, null);
  return { ...EMPTY_COLLECTION, ...(raw ?? {}) };
}

function saveCollection(collection: CardCollection): void {
  writeStoredJson(CARD_COLLECTION_KEY, collection);
}

export function addCardToCollection(cardId: string): CardCollection {
  const current = getCardCollection();
  if (current.ownedCardIds.includes(cardId)) return current;
  const next = { ...current, ownedCardIds: [...current.ownedCardIds, cardId] };
  saveCollection(next);
  return next;
}

export function recordCardDuelResult(result: "victory" | "defeat" | "draw"): CardCollection {
  const current = getCardCollection();
  const next = {
    ...current,
    wins: current.wins + (result === "victory" ? 1 : 0),
    losses: current.losses + (result === "defeat" ? 1 : 0),
    draws: current.draws + (result === "draw" ? 1 : 0),
    totalRounds: current.totalRounds + 1,
  };
  saveCollection(next);
  return next;
}

export function openCardPack(random: () => number = Math.random): CardDef[] {
  const cards: CardDef[] = [];
  const used = new Set<string>();
  while (cards.length < 3) {
    const pool = ALL_CARDS.filter((card) => !used.has(card.id));
    if (pool.length === 0) break;
    const pick = pool[Math.floor(random() * pool.length)];
    if (pick) {
      cards.push(pick);
      used.add(pick.id);
    }
  }
  cards.forEach((card) => addCardToCollection(card.id));
  const current = getCardCollection();
  saveCollection({ ...current, packsOpened: current.packsOpened + 1 });
  return cards;
}

export function hasAllThemeCards(theme: CardTheme): boolean {
  const owned = new Set(getCardCollection().ownedCardIds);
  return ALL_CARDS.filter((card) => card.theme === theme).every((card) => owned.has(card.id));
}

export function maybeDropUnownedCard(random: () => number = Math.random): CardDef | null {
  const owned = getCardCollection().ownedCardIds;
  const card = getRandomUnownedCard(owned, random);
  if (card) addCardToCollection(card.id);
  return card;
}
