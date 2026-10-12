/** Sheet: dubbel = word (both directions), enkel = oneway (nl → answer), zin = sentence, vraag = question. */
export type CardType = 'word' | 'oneway' | 'sentence' | 'question';

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
  flags: string[];
  answer: string; // back of an enkel (oneway) card; display text only, never checked
  added: string; // yyyy-mm-dd
  active: boolean;
  order?: number; // position in the sheet (tie-break for `added`)
};

export type Tag = { tag: string; label_nl: string; label_fr: string; subject_nl?: string };

export type Settings = {
  new_per_day: number; // read only through getNewPerDay() (src/today.ts)
  desired_retention: number;
  unlock_prod_stability_days: number;
  known_stability_days: number; // a card is "bekend" from this stability (curriculum rule bekend, Voortgang)
  known_min_reviews: number; // … and at least this many reviews
  show_french_help: boolean;
  max_learning_backlog: number;
  due_window_minutes: number; // a card whose own step is SHORTER than this stays in the round (inRound, src/today.ts)
  max_reviews_per_day: number; // silent cap on the due part of today's work; overflow rolls to tomorrow
  lapse_queue_threshold: number; // above this many remaining due cards, a failed review card is retried later in the run
  lapse_requeue_min: number; // … between this many
  lapse_requeue_max: number; // … and this many cards later
  lapse_max_retries: number; // … at most this many times per card per run
  listen_share: number; // share of word-recognition reviews done as listening cards (0 = off)
};

/**
 * One row of the Curriculum tab. rule: 'always' | 'date' | 'known' | 'closed' (sheet: altijd | datum | bekend |
 * dicht); any other text is kept as is and fails validation. date = YYYY-MM-DD or ''.
 */
export type CurriculumRow = {
  order: number;
  tag: string;
  rule: string;
  date: string;
  percentage: number | null;
  from_tags: string[];
};

export const DEFAULT_SETTINGS: Settings = {
  new_per_day: 10,
  desired_retention: 0.9,
  unlock_prod_stability_days: 3,
  known_stability_days: 7,
  known_min_reviews: 2,
  show_french_help: true,
  max_learning_backlog: 3,
  due_window_minutes: 10,
  max_reviews_per_day: 100,
  lapse_queue_threshold: 20,
  lapse_requeue_min: 5,
  lapse_requeue_max: 10,
  lapse_max_retries: 2,
  listen_share: 0.3
};

export type CardsResponse = {
  env: string;
  serverTime: string;
  cards: Card[];
  settings: Partial<Settings>;
  tags: Tag[];
  curriculum?: CurriculumRow[];
};
