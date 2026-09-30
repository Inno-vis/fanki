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
  'home.allDone': { nl: 'Klaar voor vandaag!', fr: 'Fini pour aujourd’hui !' },

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
  'review.progress': { nl: '{done} van {target} kaarten', fr: '{done} cartes sur {target} dans cette séance' },
  'review.show': { nl: 'Antwoord tonen', fr: 'Montrer la réponse' },
  'review.done': { nl: 'Klaar voor vandaag!', fr: 'Fini pour aujourd’hui !' },
  'review.count': { nl: '{n} kaarten herhaald', fr: '{n} cartes révisées' },

  // Sessions + cooldown
  'session.offer': { nl: 'Sessie voltooid! Wil je doorgaan?', fr: 'Séance terminée ! Tu veux continuer ?' },
  'session.more': { nl: 'Nog {n} kaarten, graag!', fr: 'Encore {n} cartes, s’il te plaît !' },
  'session.stop': { nl: 'Stoppen', fr: 'Arrêter' },
  'home.resume': { nl: 'Doorgaan ({done} van {target} kaarten)', fr: 'Continuer ta séance ({done} cartes sur {target})' },
  'session.cooldown': { nl: 'Volgende sessie over {n} minuten', fr: 'Prochaine séance dans {n} minutes' },
  'session.cooldown1': { nl: 'Volgende sessie over 1 minuut', fr: 'Prochaine séance dans 1 minute' },

  // Topics (tag filter)
  'tags.title': { nl: 'Kies een onderwerp', fr: 'Choisis un ou plusieurs thèmes' },
  'tags.all': { nl: 'Alle onderwerpen', fr: 'Tous les thèmes' },
  'tags.done': { nl: 'Klaar', fr: 'Terminé' },
  'tags.locked': { nl: 'nog dicht', fr: 'pas encore ouvert : il s’ouvre quand le thème précédent est bien su' },
  'home.topicAll': { nl: 'Onderwerp: alle', fr: 'Thème : tous' },
  'home.topic': { nl: 'Onderwerp: {list}', fr: 'Thème : {list}' },

  // Break screen (when a pause starts)
  'break.title': { nl: 'Sessie voltooid!', fr: 'Séance terminée !' },
  'break.ok': { nl: 'OK', fr: 'OK' },

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
  'mark.shareTitle': { nl: 'Fanki: gemarkeerde kaarten', fr: 'Fanki : cartes marquées' },

  // Card flags (key = value in the Cards.flags column)
  'flag.false-friend': { nl: 'valse vriend', fr: 'faux ami : ressemble à un mot français, mais le sens est différent' },
  'flag.separable': { nl: 'scheidbaar', fr: 'verbe séparable : le préfixe va à la fin de la phrase' },

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

  // Update banner
  'update.available': { nl: 'Er is een nieuwe versie.', fr: 'Une nouvelle version est disponible.' },
  'update.open': { nl: 'Openen', fr: 'Ouvrir la nouvelle version' },

  // Help
  'help.button': { nl: 'Hulp', fr: 'Aide' },
  'help.title': { nl: 'Hulp', fr: 'Aide' },
  'help.close': { nl: 'Sluiten', fr: 'Fermer' },

  // Rating buttons (labels + meanings live in RATINGS below)
  'rating.aria': { nl: '{label}, {interval}', fr: '{label}, {interval}' },
  'rating.helpTitle': { nl: 'De vier knoppen', fr: 'Les quatre boutons' },
  'rating.helpOk': { nl: 'Klaar', fr: 'Compris' },
  'rating.helpReopen': { nl: 'Uitleg van de knoppen', fr: 'Explication des boutons' }
} as const satisfies Record<string, Str>;

export type UIKey = keyof typeof UI;

/** French instructions per screen, shown only in the Hulp panel. */
export const HELP = {
  home: {
    nl: 'Hier zie je je kaarten voor vandaag. Tik op Starten.',
    fr:
      'Cet écran montre combien de cartes tu dois revoir aujourd’hui (« te herhalen ») et combien de nouvelles ' +
      'cartes t’attendent (« nieuw vandaag »). Touche « Starten » pour commencer. L’appli fonctionne aussi sans ' +
      'internet : tes réponses sont gardées sur le téléphone et envoyées à la prochaine connexion. ' +
      '« Synchroniseren » télécharge les nouvelles cartes quand tu as internet. Après une séance, une pause est ' +
      'prévue : « Volgende sessie over 42 minuten » = prochaine séance dans 42 minutes. Si tu reviens en ' +
      'arrière pendant une séance, « Doorgaan » te permet de la continuer.'
  },
  marked: {
    nl: 'Hier zie je je gemarkeerde kaarten.',
    fr:
      'Ici, les cartes que tu as marquées avec 🚩 pendant les révisions, les plus récentes en haut. ' +
      '« Opgelost » = résolu : la carte passe dans la liste « Opgelost » (rien n’est effacé). « Delen » = ' +
      'partager la liste (Messages, e-mail…) avec ton prof ou quelqu’un d’autre : c’est toi qui l’envoies, ' +
      'rien ne part tout seul.'
  },
  topics: {
    nl: 'Kies een of meer onderwerpen. Tik dan op Klaar.',
    fr:
      'Choisis un ou plusieurs thèmes : les prochaines séances ne montrent que les cartes de ces thèmes ' +
      '(révisions et nouvelles cartes). « Alle onderwerpen » = tous les thèmes. 🔒 « nog dicht » = pas encore ' +
      'ouvert : ce thème s’ouvrira quand le précédent sera bien su. Touche « Klaar » pour revenir.'
  },
  break: {
    nl: 'Pauze. Doe dit even zonder de app.',
    fr:
      'C’est la pause ! Fais ce petit exercice en néerlandais, loin de l’écran : pas besoin de répondre dans ' +
      'l’appli. Touche « OK » pour fermer. La prochaine séance sera possible après la pause.'
  },
  review: {
    nl: 'Lees de kaart. Tik op Antwoord tonen. Kies dan een knop.',
    fr:
      'Lis la carte et essaie de te souvenir de la réponse. Touche « Antwoord tonen » pour la voir, puis dis ' +
      'honnêtement comment ça s’est passé : ❌ Opnieuw = je ne savais pas, 😅 Moeilijk = j’ai hésité, ' +
      '✅ Goed = bien, 😎 Makkelijk = très facile. Sous chaque bouton : quand la carte reviendra ' +
      '(min = minutes, u = heures, d = jours, wk = semaines, mnd = mois, jr = ans). Les noms montrent toujours ' +
      '« de » ou « het ». Badges : « valse vriend » = faux ami, « scheidbaar » = verbe séparable. ' +
      'La barre en haut montre ta séance (« 9 van 15 kaarten » = 9 cartes sur 15). À la fin, ' +
      '« Nog 10 kaarten, graag! » = encore 10 cartes, « Stoppen » = arrêter. « Terug » = retour. ' +
      '🚩 en haut de la carte = marquer une carte qui te pose question (appui long ou « + notitie » pour ' +
      'ajouter une note).'
  }
} as const satisfies Record<string, Str>;

export type HelpScreen = keyof typeof HELP;

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
