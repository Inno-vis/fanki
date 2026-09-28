export type CardType = 'word' | 'sentence' | 'question';

export type Card = {
  id: string;
  type: CardType;
  nl: string;
  article: '' | 'de' | 'het';
  pos: string;
  fr: string;
  example_nl: string;
  example_fr: string;
  tags: string[];
  tags_source: string;
  flags: string[];
  added: string; // yyyy-mm-dd
  active: boolean;
  order?: number; // position in the sheet (tie-break for `added`)
};

export type Tag = { tag: string; label_nl: string; label_fr: string };

export type Settings = {
  new_per_day: number;
  desired_retention: number;
  compliments_enabled: boolean;
  unlock_prod_stability_days: number;
  show_french_help: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  new_per_day: 8,
  desired_retention: 0.9,
  compliments_enabled: true,
  unlock_prod_stability_days: 3,
  show_french_help: true
};

export type CardsResponse = {
  env: string;
  serverTime: string;
  cards: Card[];
  settings: Partial<Settings>;
  tags: Tag[];
  compliments: string[];
};
