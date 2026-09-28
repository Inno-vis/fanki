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
  mature_stability_days: number;
  show_french_help: boolean;
  session_max_cards: number;
  session_max_minutes: number;
  session_extra_cards: number;
  cooldown_minutes: number;
  min_reviews_to_count: number;
  max_learning_backlog: number;
};

/** One row of the Curriculum tab (sorted by order). max_wait_days null = no cap. */
export type CurriculumRow = {
  order: number;
  tag: string;
  unlock_threshold: number;
  min_reviews: number;
  max_wait_days: number | null;
  active: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  new_per_day: 8,
  desired_retention: 0.9,
  compliments_enabled: true,
  unlock_prod_stability_days: 3,
  mature_stability_days: 21,
  show_french_help: true,
  session_max_cards: 15,
  session_max_minutes: 8,
  session_extra_cards: 10,
  cooldown_minutes: 60,
  min_reviews_to_count: 3,
  max_learning_backlog: 3
};

export type CardsResponse = {
  env: string;
  serverTime: string;
  cards: Card[];
  settings: Partial<Settings>;
  tags: Tag[];
  compliments: string[];
  curriculum?: CurriculumRow[];
  breaks?: string[];
};
