// Sheet schema — keep in sync with docs/SHEET.md.

var CARD_COLS = ['id', 'type', 'nl', 'article', 'pos', 'fr', 'example_nl', 'example_fr',
  'tags', 'tags_source', 'flags', 'added', 'active'];

var SCHEMA = {
  Cards: CARD_COLS,
  Progress: ['card_id', 'track', 'state', 'due', 'stability', 'difficulty', 'reps', 'lapses', 'last_review'],
  Log: ['event_id', 'card_id', 'track', 'ts', 'rating', 'mode', 'duration_ms', 'snapshot'],
  Tags: ['tag', 'label_fr', 'description'],
  Inbox: CARD_COLS.concat(['status']),
  Settings: ['key', 'value', 'description'],
  Compliments: ['text'],
  Dashboard: ['metric', 'value']
};

var CARD_TYPES = ['word', 'sentence', 'question'];
var TRACKS = ['recog', 'prod'];
var MODES = ['nl_fr', 'fr_nl', 'cloze', 'question', 'listen'];

var SETTINGS_DEFAULTS = [
  ['new_per_day', 8, 'Nouvelles cartes par jour'],
  ['desired_retention', 0.9, 'Rétention visée par FSRS (0.7–0.97)'],
  ['compliments_enabled', true, 'Afficher les compliments'],
  ['unlock_prod_stability_days', 3, 'Stabilité (jours) de la reconnaissance avant d\'écrire le mot en néerlandais']
];

var TAGS_SEED = [
  ['household', 'la maison', 'Objets et pièces de la maison'],
  ['school', 'l\'école', 'École, classe, matériel'],
  ['wiskunde', 'les maths', 'Vocabulaire des mathématiques'],
  ['family', 'la famille', 'Membres de la famille'],
  ['travel', 'les voyages', 'Transports, gare, vacances'],
  ['food', 'la nourriture', 'Repas, aliments, cuisine'],
  ['work', 'le travail', 'Métiers, bureau'],
  ['health', 'la santé', 'Corps, médecin, maladie'],
  ['shopping', 'les courses', 'Magasins, argent, acheter'],
  ['time', 'le temps', 'Heures, jours, calendrier']
];

var COMPLIMENTS_SEED = [
  'Bravo !',
  'Super, continue comme ça !',
  'Excellent travail !',
  'Tu progresses vraiment bien.',
  'Parfait !',
  'Très bien, tu t\'améliores !',
  'Impressionnant !',
  'Ça se voit que tu as révisé.',
  'Génial !',
  'Trots op jou ! (Fier de toi !)',
  'Goed gedaan ! (Bien joué !)',
  'Prima ! (Parfait !)'
];

// type|nl|article|pos|fr|example_nl|example_fr|tags|tags_source|flags
var SEED_CARDS = [
  'word|huis|het|noun|la maison|Het huis is groot.|La maison est grande.|household|manual|',
  'word|tafel|de|noun|la table|De tafel staat in de keuken.|La table est dans la cuisine.|household|manual|',
  'word|stoel|de|noun|la chaise|Ik zit op de stoel.|Je suis assis sur la chaise.|household|manual|',
  'word|raam|het|noun|la fenêtre|Het raam is open.|La fenêtre est ouverte.|household|manual|',
  'word|gang|de|noun|le couloir|In de gang staan schoenen.|Il y a des chaussures dans le couloir.|household|manual|false-friend',
  'word|school|de|noun|l\'école|De school begint om acht uur.|L\'école commence à huit heures.|school|manual|',
  'word|leraar|de|noun|le professeur|De leraar legt de les uit.|Le professeur explique la leçon.|school|manual|',
  'word|boek|het|noun|le livre|Ik lees een boek.|Je lis un livre.|school|manual|',
  'word|getal|het|noun|le nombre|Dit getal is te groot.|Ce nombre est trop grand.|school, wiskunde|manual|',
  'word|optellen||verb (separable)|additionner|Ik tel de getallen op.|J\'additionne les nombres.|school, wiskunde|manual|separable',
  'word|moeder|de|noun|la mère|Mijn moeder werkt in een ziekenhuis.|Ma mère travaille dans un hôpital.|family|manual|',
  'word|broer|de|noun|le frère|Mijn broer woont in Brussel.|Mon frère habite à Bruxelles.|family|manual|',
  'word|trein|de|noun|le train|De trein vertrekt om negen uur.|Le train part à neuf heures.|travel|manual|',
  'word|station|het|noun|la gare|Het station is dichtbij.|La gare est proche.|travel|manual|false-friend',
  'word|reis|de|noun|le voyage|De reis duurt drie uur.|Le voyage dure trois heures.|travel|manual|',
  'word|eten||verb|manger|Wat eten we vandaag?|Qu\'est-ce qu\'on mange aujourd\'hui ?|||',
  'word|gaan||verb|aller|Ik ga naar huis.|Je rentre à la maison.|||',
  'word|groot||adj|grand|Mijn broer is heel groot.|Mon frère est très grand.|||',
  'word|alsjeblieft||phrase|s\'il te plaît / voilà|Alsjeblieft, hier is je koffie.|Voilà, voici ton café.|||',
  'word|opstaan||verb (separable)|se lever|Ik sta om zeven uur op.|Je me lève à sept heures.|||separable',
  'sentence|Ik {woon} in een klein huis.||sentence|J\'habite dans une petite maison.|||household|manual|',
  'sentence|Mijn zus {heet} Anna.||sentence|Ma sœur s\'appelle Anna.|||family|manual|',
  'question|Hoe laat vertrekt de trein?||question|Demande à quelle heure part le train.|||travel|manual|',
  'question|Hoe heet je?||question|Demande son prénom à quelqu\'un (tutoiement).||||'
];
