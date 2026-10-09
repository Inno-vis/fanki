// ALL learner-facing text lives here. Components must not hard-code UI strings.
//   nl — what she sees (A1 Dutch: short sentences, present tense, common words, no idioms)
//   fr — hidden help text, shown only in the "Hulp" panel or the one-time rating overlay
// `{name}` placeholders are filled by t()/tFr(). Review list: docs/UI-STRINGS.md (npm run ui-strings).
// Keep this file free of TS-only runtime syntax (no enums): scripts run it with plain Node.

export type Str = { nl: string; fr: string };

export const UI = {
  // Home
  'home.due': { nl: 'te herhalen', fr: 'cartes à revoir' },
  'home.newToday': { nl: 'nieuw vandaag', fr: 'nouvelles cartes aujourd’hui' },
  'home.start': { nl: 'Starten', fr: 'Commencer' },
  'home.cards': { nl: '{n} kaarten', fr: '{n} cartes en tout' },
  'home.empty': { nl: 'Nog geen kaarten. Tik op Synchroniseren.', fr: 'Pas encore de cartes. Touche « Synchroniseren ».' },
  'home.emptyOffline': { nl: 'Nog geen kaarten. Zet het internet aan.', fr: 'Pas encore de cartes. Connecte-toi à internet.' },
  'home.allDone': { nl: 'Klaar voor nu!', fr: 'Fini pour le moment !' },
  'home.later': { nl: 'Volgende kaarten: {list}', fr: 'Prochaines cartes aujourd’hui : {list}' },
  'home.laterMin': { nl: '{n} over ± {m} min', fr: '{n} dans environ {m} minutes' },
  'home.laterHour': { nl: '{n} over ± {h} uur', fr: '{n} dans environ {h} heure(s)' },
  'today.label': { nl: 'Vandaag', fr: 'Aujourd’hui' },
  'today.left': { nl: 'Nog {n} kaarten', fr: 'Encore {n} cartes aujourd’hui' },
  'today.left1': { nl: 'Nog 1 kaart', fr: 'Encore 1 carte aujourd’hui' },

  'db.blocked': {
    nl: 'SpeesRep is nog open in een ander venster. Sluit het en open de app opnieuw.',
    fr: 'Une autre fenêtre de SpeesRep (ancienne version) est encore ouverte : ferme-la, puis rouvre l’appli.'
  },

  // Status + sync
  'status.offline': { nl: 'Geen internet', fr: 'Pas d’internet' },
  'sync.button': { nl: 'Synchroniseren', fr: 'Synchroniser (télécharger les cartes et envoyer tes réponses)' },
  'sync.running': { nl: 'Synchroniseren…', fr: 'Synchronisation en cours…' },
  'sync.error': { nl: 'Geen verbinding. Probeer het opnieuw.', fr: 'La synchronisation n’a pas marché. Réessaie plus tard.' },
  'sync.last': { nl: 'Laatst gesynchroniseerd: {ago}', fr: 'Dernière synchronisation : {ago}' },
  'sync.never': { nl: 'Nog niet gesynchroniseerd', fr: 'Pas encore synchronisé' },
  'sync.pending': { nl: '{n} antwoorden nog niet gesynchroniseerd', fr: '{n} réponses pas encore envoyées (elles partiront à la prochaine connexion)' },

  // Review
  'review.back': { nl: 'Terug', fr: 'Retour' },
  'review.show': { nl: 'Antwoord tonen', fr: 'Montrer la réponse' },

  // Topics (tag filter)
  'tags.title': { nl: 'Kies een onderwerp', fr: 'Choisis un ou plusieurs thèmes' },
  'tags.all': { nl: 'Alle onderwerpen', fr: 'Tous les thèmes' },
  'tags.done': { nl: 'Klaar', fr: 'Terminé' },
  'tags.locked': { nl: 'nog dicht', fr: 'pas encore ouvert : il s’ouvre quand le thème précédent est bien su' },
  'home.topicAll': { nl: 'Onderwerp: alle', fr: 'Thème : tous' },
  'home.topic': { nl: 'Onderwerp: {list}', fr: 'Thème : {list}' },

  // Menu (tap "SpeesRep")
  'menu.open': { nl: 'Menu openen', fr: 'Ouvrir le menu (progression, cartes marquées, réglages, à propos, synchronisation)' },
  'menu.title': { nl: 'Menu', fr: 'Menu' },

  // Voortgang (progress overview)
  'progress.title': { nl: 'Voortgang', fr: 'Ma progression' },

  // Over SpeesRep
  'about.title': { nl: 'Over SpeesRep', fr: 'À propos de SpeesRep' },
  'about.intro': {
    nl: 'SpeesRep helpt je om Nederlandse woorden te leren. Je oefent elke dag een beetje.',
    fr: 'SpeesRep t’aide à apprendre des mots néerlandais. Tu t’exerces un peu chaque jour.'
  },
  'about.privacy': {
    nl: 'Je antwoorden gaan naar je leraar. Je leraar kan zien wat je oefent. SpeesRep heeft geen account nodig en vraagt niet om je naam of e-mailadres.',
    fr: 'Tes réponses sont envoyées à ton professeur, qui voit ce que tu travailles. SpeesRep n’a pas besoin de compte et ne demande ni ton nom ni ton e-mail.'
  },
  'about.imagesTitle': { nl: 'Plaatjes', fr: 'Images' },
  'about.images': {
    nl: 'Alle plaatjes zijn gemaakt door OpenMoji (https://openmoji.org/), het open-source emoji- en iconenproject. De plaatjes zijn niet aangepast.',
    fr: 'Toutes les images viennent d’OpenMoji (https://openmoji.org/), un projet libre d’emojis et d’icônes. Elles ne sont pas modifiées.'
  },
  'about.license': {
    nl: 'Licentie: CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/)',
    fr: 'Licence : CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/)'
  },
  'about.imagesEn': {
    nl: 'All emojis designed by OpenMoji – the open-source emoji and icon project. License: CC BY-SA 4.0',
    fr: 'All emojis designed by OpenMoji – the open-source emoji and icon project. License: CC BY-SA 4.0'
  },

  // Instellingen (phone only)
  'settings.title': { nl: 'Instellingen', fr: 'Réglages' },
  'settings.newPerDay': { nl: 'Max. aantal nieuwe woorden per dag', fr: 'Nombre maximum de nouveaux mots par jour' },
  'settings.default': { nl: 'Standaard ({n})', fr: 'Par défaut ({n})' },
  'settings.listening': { nl: 'Luisteroefeningen', fr: 'Exercices d’écoute' },
  'settings.readAnswer': { nl: 'Antwoord voorlezen', fr: 'Lire la réponse à voix haute' },
  'settings.on': { nl: 'Aan', fr: 'Activé' },
  'settings.off': { nl: 'Uit', fr: 'Désactivé' },
  'settings.noVoice': { nl: 'Geen Nederlandse stem op dit toestel.', fr: 'Pas de voix néerlandaise sur cet appareil.' },
  'backup.title': { nl: 'Back-up', fr: 'Sauvegarde' },
  'backup.save': { nl: 'Back-up opslaan', fr: 'Enregistrer une sauvegarde (fichier)' },
  'backup.load': { nl: 'Back-up terugzetten', fr: 'Restaurer une sauvegarde (fichier)' },
  'backup.done': { nl: 'Back-up teruggezet.', fr: 'Sauvegarde restaurée.' },
  'backup.bad': { nl: 'Dit is geen SpeesRep-back-up.', fr: 'Ce fichier n’est pas une sauvegarde SpeesRep.' },
  'backup.otherApp': { nl: 'Deze back-up is van een andere versie van de app.', fr: 'Cette sauvegarde vient d’une autre version de l’appli (DEV/PROD).' },
  'progress.learned': { nl: 'kaarten geoefend (van {n})', fr: 'cartes déjà travaillées (sur {n} en tout)' },
  'progress.known': { nl: 'kaarten bekend', fr: 'cartes bien sues (elles reviennent dans 3 semaines ou plus)' },
  'progress.week': { nl: 'herhalingen deze week', fr: 'révisions ces 7 derniers jours' },
  'progress.streak': { nl: 'dagen op rij', fr: 'jours de suite avec au moins une révision' },
  'progress.dueToday': { nl: 'vandaag', fr: 'cartes à revoir aujourd’hui' },
  'progress.dueTomorrow': { nl: 'morgen', fr: 'cartes à revoir demain' },
  'progress.due7': { nl: 'deze week', fr: 'cartes à revoir dans les 7 prochains jours' },

  // Audio
  'audio.listen': { nl: 'Luister', fr: 'Écouter' },
  'audio.play': { nl: 'Luisteren', fr: 'Écouter le mot en néerlandais' },
  'audio.question': { nl: 'Wat hoor je?', fr: 'Qu’est-ce que tu entends ? Essaie de comprendre le mot, puis montre la réponse.' },
  'audio.noVoice': {
    nl: 'Geen Nederlandse stem op deze telefoon.',
    fr:
      'Pas de voix néerlandaise sur ce téléphone. iPhone : Réglages › Accessibilité › Contenu énoncé › Voix › ' +
      'Néerlandais (télécharger). Android : Paramètres › Synthèse vocale (Google) › Installer les données vocales › Néerlandais.'
  },

  // 🚩 Student flags ("Gemarkeerd", local only). NOT the sheet's Cards.flags (see 'flag.*' below).
  'mark.button': { nl: 'Kaart markeren', fr: 'Marquer cette carte (pour en parler plus tard)' },
  'mark.done': { nl: 'Gemarkeerd', fr: 'Carte marquée' },
  'mark.addNote': { nl: '+ notitie', fr: '+ ajouter une note' },
  'mark.notePlaceholder': { nl: 'Notitie (mag leeg)', fr: 'Note (facultative), par ex. « pourquoi pas het ? »' },
  'mark.save': { nl: 'Opslaan', fr: 'Enregistrer' },
  'mark.title': { nl: 'Gemarkeerd', fr: 'Cartes marquées' },
  'mark.badge': { nl: '🚩 {n}', fr: '🚩 {n} cartes marquées' },
  'mark.empty': { nl: 'Nog niets gemarkeerd.', fr: 'Aucune carte marquée pour l’instant.' },
  'mark.resolve': { nl: 'Opgelost', fr: 'Résolu' },
  'mark.resolvedSection': { nl: 'Opgelost ({n})', fr: 'Résolus ({n})' },
  'mark.share': { nl: 'Delen', fr: 'Partager (Messages, e-mail…)' },
  'mark.copy': { nl: 'Kopieer naar klembord', fr: 'Copier dans le presse-papiers' },
  'mark.copied': { nl: 'Gekopieerd', fr: 'Copié' },
  'mark.shareTitle': { nl: 'SpeesRep: gemarkeerde kaarten', fr: 'SpeesRep : cartes marquées' },

  // Card flags (key = value in the Cards.flags column)
  'flag.abbreviation': { nl: 'afkorting', fr: 'abréviation : forme courte d’un mot (min = minuten)' },
  'flag.false-friend': { nl: 'valse vriend', fr: 'faux ami : ressemble à un mot français, mais le sens est différent' },

  // Relative time
  'time.justNow': { nl: 'zojuist', fr: 'à l’instant' },
  'time.minuteAgo': { nl: '1 minuut geleden', fr: 'il y a 1 minute' },
  'time.minutesAgo': { nl: '{n} minuten geleden', fr: 'il y a {n} minutes' },
  'time.hourAgo': { nl: '1 uur geleden', fr: 'il y a 1 heure' },
  'time.hoursAgo': { nl: '{n} uur geleden', fr: 'il y a {n} heures' },
  'time.dayAgo': { nl: '1 dag geleden', fr: 'il y a 1 jour' },
  'time.daysAgo': { nl: '{n} dagen geleden', fr: 'il y a {n} jours' },
  'time.weekAgo': { nl: '1 week geleden', fr: 'il y a 1 semaine' },
  'time.weeksAgo': { nl: '{n} weken geleden', fr: 'il y a {n} semaines' },

  // Install hint (Safari, not yet on the Home Screen). {share}/{add} are the iOS icons.
  'install.hint': {
    nl: 'Zet de app op je scherm: tik op {share} en dan op {add}.',
    fr: 'Ajoute l’appli à ton écran d’accueil : touche {share} (Partager), puis {add} (Sur l’écran d’accueil).'
  },
  'install.close': { nl: 'Sluiten', fr: 'Fermer' },
  'install.android': { nl: 'App installeren', fr: 'Installer l’appli sur ton téléphone (écran d’accueil)' },

  // Update banner
  'update.available': { nl: 'Er is een nieuwe versie.', fr: 'Une nouvelle version est disponible.' },
  'update.open': { nl: 'Openen', fr: 'Ouvrir la nouvelle version' },

  // Help
  'help.button': { nl: 'Hulp', fr: 'Aide' },
  'help.title': { nl: 'Hulp', fr: 'Aide' },
  'help.close': { nl: 'Sluiten', fr: 'Fermer' },
  'help.updated': { nl: 'nieuw', fr: 'l’aide de cet écran a changé : touche « Hulp » pour la relire' },

  // Rating buttons (labels + meanings live in RATINGS below)
  'rating.aria': { nl: '{label}, {interval}', fr: '{label}, {interval}' },
  'rating.helpTitle': { nl: 'De vier knoppen', fr: 'Les quatre boutons' },
  'rating.helpOk': { nl: 'Klaar', fr: 'Compris' },
  'rating.helpReopen': { nl: 'Uitleg van de knoppen', fr: 'Explication des boutons' }
} as const satisfies Record<string, Str>;

export type UIKey = keyof typeof UI;


/** Rating buttons, left to right. rating = ts-fsrs Rating (1..4). fr = meaning shown in the help overlay. */
export const RATINGS = [
  { key: 'again', rating: 1, emoji: '❌', nl: 'Opnieuw', fr: 'je ne savais pas' },
  { key: 'hard', rating: 2, emoji: '😅', nl: 'Moeilijk', fr: 'j’ai hésité' },
  { key: 'good', rating: 3, emoji: '✅', nl: 'Goed', fr: 'bien' },
  { key: 'easy', rating: 4, emoji: '😎', nl: 'Makkelijk', fr: 'très facile' }
] as const;

export type RatingKey = (typeof RATINGS)[number]['key'];

/** Interval units on the rating buttons ("10 min", "2 u", "3 d", "3 wk", "4 mnd", "1 jr"). */
export const INTERVAL_UNITS = {
  minute: 'min',
  hour: 'u',
  day: 'd',
  week: 'wk',
  month: 'mnd',
  year: 'jr'
} as const;

// ---------- Hulp pages: structured French help per screen ----------
// One idea per item (fr ≤ 110 characters), at most 7 items per section. `ui` (a UIKey) is preferred over a literal
// `nl` so the Dutch chip follows UI-text changes. Rendered by components/Help.tsx; checked by src/help.test.ts.

export type HelpItem = {
  /** Dutch label exactly as on screen (preferred: follows UI changes). */
  ui?: UIKey;
  vars?: Record<string, string | number>;
  /** Literal Dutch label when there is no UI key (e.g. "de / het"). */
  nl?: string;
  /** Emoji before the label (aria-hidden). */
  icon?: string;
  /** Rating key: the chip gets that rating button's colour. */
  rating?: string;
  /** French explanation, one line, ≤ 110 characters. */
  fr: string;
};

export type HelpSection = {
  /** French heading, ≤ 30 characters. */
  title: string;
  /** 'steps' = numbered list; 'chips' = compact grid of label + meaning; default 'list'. */
  kind?: 'list' | 'steps' | 'chips';
  /** Inside a closed <details>. */
  collapsed?: boolean;
  items: HelpItem[];
};

export type HelpPage = {
  /** The Dutch one-liner at the top. */
  nl: string;
  sections: HelpSection[];
  /** One French line at the bottom (💡). */
  tip?: string;
};

export const HELP: Record<'home' | 'review' | 'settings' | 'progress' | 'marked' | 'topics' | 'about', HelpPage> = {
  home: {
    nl: 'Hier zie je je kaarten voor vandaag. Tik op Starten.',
    sections: [
      {
        title: 'Cet écran',
        items: [
          { ui: 'home.due', fr: 'cartes à revoir aujourd’hui' },
          { ui: 'home.newToday', fr: 'nouvelles cartes qui t’attendent' },
          { ui: 'today.label', fr: 'ton travail du jour. « Nog 5 kaarten » = encore 5 cartes' },
          { ui: 'home.start', fr: 'commencer. Tu peux t’arrêter quand tu veux, tout est gardé' },
          { ui: 'home.allDone', fr: 'fini pour le moment' },
          // composite label (home.later + home.laterMin): literal on purpose
          { nl: 'Volgende kaarten: 5 over ± 30 min', fr: '5 cartes reviennent dans environ 30 minutes' }
        ]
      },
      {
        title: 'Menu (touche « SpeesRep » en haut)',
        items: [
          { ui: 'progress.title', icon: '📈', fr: 'ta progression' },
          { ui: 'mark.title', icon: '🚩', fr: 'les cartes que tu as marquées' },
          { ui: 'settings.title', icon: '⚙️', fr: 'tes réglages' },
          { ui: 'sync.button', fr: 'télécharge les nouvelles cartes et envoie tes réponses' }
        ]
      },
      {
        title: 'Aide',
        items: [{ ui: 'help.button', fr: 'chaque écran a sa propre aide : touche « Hulp » là où tu es' }]
      }
    ],
    tip: 'Pas d’internet ? Tes réponses sont gardées et envoyées à la prochaine connexion.'
  },
  review: {
    nl: 'Lees de kaart. Tik op Antwoord tonen. Kies dan een knop.',
    sections: [
      {
        title: 'Comment faire',
        kind: 'steps',
        items: [
          { fr: 'Lis la carte et cherche la réponse dans ta tête.' },
          { ui: 'review.show', fr: 'touche ce bouton pour voir la réponse' },
          { fr: 'Choisis honnêtement un des quatre boutons.' }
        ]
      },
      {
        title: 'Les boutons',
        items: RATINGS.map((r) => ({ nl: r.nl, icon: r.emoji, rating: r.key, fr: r.fr }))
      },
      {
        title: 'Sous les boutons',
        kind: 'chips',
        items: [
          { nl: INTERVAL_UNITS.minute, fr: 'minutes' },
          { nl: INTERVAL_UNITS.hour, fr: 'heures' },
          { nl: INTERVAL_UNITS.day, fr: 'jours' },
          { nl: INTERVAL_UNITS.week, fr: 'semaines' },
          { nl: INTERVAL_UNITS.month, fr: 'mois' },
          { nl: INTERVAL_UNITS.year, fr: 'ans' }
        ]
      },
      {
        title: 'Sur la carte',
        items: [
          { icon: '🔊', fr: 'écouter le mot en néerlandais' },
          { ui: 'audio.question', fr: 'écoute, devine, puis touche « Antwoord tonen »' },
          { nl: 'de / het', fr: 'l’article, toujours montré avec les noms' },
          { ui: 'flag.false-friend', fr: 'faux ami' },
          { ui: 'flag.abbreviation', fr: 'abréviation' }
        ]
      },
      {
        title: 'Marquer et arrêter',
        items: [
          { icon: '🚩', fr: 'marquer une carte qui te pose question' },
          { ui: 'mark.addNote', fr: 'ajouter une note (ou appui long sur 🚩)' },
          { ui: 'review.back', fr: 'retour à l’accueil, tout est gardé' }
        ]
      },
      {
        title: 'Pas de voix néerlandaise ?',
        kind: 'steps',
        collapsed: true,
        items: [
          { fr: 'iPhone : Réglages › Accessibilité › Contenu énoncé › Voix › Néerlandais' },
          { fr: 'Android : Paramètres › Synthèse vocale › Installer les données vocales › Néerlandais' }
        ]
      }
    ]
  },
  settings: {
    nl: 'Hier kies je je instellingen.',
    sections: [
      {
        title: 'Réglages',
        items: [
          { ui: 'settings.newPerDay', fr: 'maximum de nouveaux mots par jour' },
          { nl: 'Standaard', fr: 'le choix de ton professeur' },
          { ui: 'settings.listening', fr: 'parfois la carte commence par le son. « Uit » = jamais' },
          { ui: 'settings.readAnswer', fr: 'le téléphone lit la réponse néerlandaise à voix haute' }
        ]
      },
      {
        title: 'Sauvegarde',
        collapsed: true,
        items: [
          { ui: 'backup.save', fr: 'enregistre ta progression dans un fichier' },
          { ui: 'backup.load', fr: 'remet ta progression depuis ce fichier (nouveau téléphone)' }
        ]
      }
    ],
    tip: 'Ces réglages restent sur ton téléphone et comptent tout de suite, dès la prochaine carte.'
  },
  progress: {
    nl: 'Hier zie je je voortgang.',
    sections: [
      {
        title: 'Les chiffres',
        items: [
          { nl: 'kaarten geoefend', fr: 'cartes déjà travaillées' },
          { ui: 'progress.known', fr: 'cartes bien sues' },
          { ui: 'progress.week', fr: 'révisions des 7 derniers jours' },
          { ui: 'progress.streak', fr: 'jours de suite' }
        ]
      },
      {
        title: 'En bas : les cartes qui reviennent',
        kind: 'chips',
        items: [
          { ui: 'progress.dueToday', fr: 'aujourd’hui' },
          { ui: 'progress.dueTomorrow', fr: 'demain' },
          { ui: 'progress.due7', fr: 'cette semaine' }
        ]
      }
    ]
  },
  marked: {
    nl: 'Hier zie je je gemarkeerde kaarten.',
    sections: [
      {
        title: 'Cet écran',
        items: [
          { icon: '🚩', fr: 'les cartes que tu as marquées, les plus récentes en haut' },
          { ui: 'mark.resolve', fr: 'résolu : la carte passe dans la liste « Opgelost ». Rien n’est effacé.' },
          { ui: 'mark.share', fr: 'envoyer la liste à ton professeur (Messages, e-mail…)' }
        ]
      }
    ],
    tip: 'Rien ne part tout seul : c’est toi qui envoies.'
  },
  topics: {
    nl: 'Kies een of meer onderwerpen. Tik dan op Klaar.',
    sections: [
      {
        title: 'Cet écran',
        items: [
          { ui: 'tags.all', fr: 'tous les thèmes' },
          { ui: 'tags.locked', icon: '🔒', fr: 'pas encore ouvert : s’ouvre plus tard (une date, ou d’autres thèmes bien sus)' },
          { ui: 'tags.done', fr: 'revenir' }
        ]
      }
    ],
    tip: '« Starten » montre seulement les cartes des thèmes choisis.'
  },
  about: {
    nl: 'Hier lees je over SpeesRep.',
    sections: [
      {
        title: 'Cette page',
        items: [
          { icon: '📱', fr: 'À quoi sert l’appli.' },
          { icon: '👤', fr: 'Pas de compte, pas de nom, pas d’e-mail.' },
          { icon: '📤', fr: 'Tes réponses sont envoyées à ton professeur, qui voit ce que tu travailles.' },
          { icon: '🖼️', fr: 'Images : OpenMoji, licence CC BY-SA 4.0.' }
        ]
      }
    ]
  }
};

export type HelpScreen = keyof typeof HELP;

/** The Dutch label of a help item ('' when it has none). */
export function helpLabel(item: HelpItem): string {
  return item.ui ? t(item.ui, item.vars) : item.nl ?? '';
}

function fill(s: string, vars?: Record<string, string | number>): string {
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;
}

/** Dutch UI text. */
export function t(key: UIKey, vars?: Record<string, string | number>): string {
  return fill(UI[key].nl, vars);
}

/** French help text (only for the Hulp panel and the rating overlay). */
export function tFr(key: UIKey, vars?: Record<string, string | number>): string {
  return fill(UI[key].fr, vars);
}
