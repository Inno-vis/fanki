// Sheet schema — keep in sync with docs/SHEET.md.

var CARD_COLS = ['id', 'type', 'nl', 'article', 'pos', 'fr', 'example_nl', 'example_fr',
  'tags', 'tags_source', 'flags', 'added', 'active'];

var SCHEMA = {
  Cards: CARD_COLS,
  Progress: ['card_id', 'track', 'state', 'due', 'stability', 'difficulty', 'reps', 'lapses', 'last_review'],
  Log: ['event_id', 'card_id', 'track', 'ts', 'rating', 'mode', 'duration_ms', 'snapshot'],
  Tags: ['tag', 'label_nl', 'label_fr', 'description'],
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
  ['show_french_help', true, 'Bouton « Hulp » et aide en français (décocher quand elle est prête)'],
  ['unlock_prod_stability_days', 3, 'Stabilité (jours) de la reconnaissance avant d\'écrire le mot en néerlandais']
];

// tag | label_nl (shown to the learner) | label_fr (teacher) | description
var TAGS_SEED = [
  ['household', 'huishouden', 'la maison', 'Objets et pièces de la maison'],
  ['school', 'school', 'l\'école', 'École, classe, matériel'],
  ['wiskunde', 'wiskunde', 'les maths', 'Vocabulaire des mathématiques'],
  ['family', 'familie', 'la famille', 'Membres de la famille'],
  ['travel', 'reizen', 'les voyages', 'Transports, gare, vacances'],
  ['food', 'eten', 'la nourriture', 'Repas, aliments, cuisine'],
  ['work', 'werk', 'le travail', 'Métiers, bureau'],
  ['health', 'gezondheid', 'la santé', 'Corps, médecin, maladie'],
  ['shopping', 'winkelen', 'les courses', 'Magasins, argent, acheter'],
  ['time', 'tijd', 'le temps', 'Heures, jours, calendrier'],
  ['app', 'app', 'l\'appli', 'Les mots de l\'interface de Fanki']
];

var COMPLIMENTS_SEED = [
  'Goed zo!',
  'Prima!',
  'Top!',
  'Heel goed!',
  'Mooi gedaan!',
  'Je wordt steeds beter!',
  'Uitstekend!',
  'Fantastisch!',
  'Ga zo door!',
  'Geweldig!',
  'Ik ben trots op je!',
  'Perfect!',
  'Sterk!'
];

// The first (French) compliments seed: setup() replaces it with the Dutch one if untouched.
var OLD_COMPLIMENTS_FR = ['Bravo !', 'Super, continue comme ça !', 'Excellent travail !', 'Tu progresses vraiment bien.',
  'Parfait !', 'Très bien, tu t\'améliores !', 'Impressionnant !', 'Ça se voit que tu as révisé.', 'Génial !',
  'Trots op jou ! (Fier de toi !)', 'Goed gedaan ! (Bien joué !)', 'Prima ! (Parfait !)'];

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
  'question|Hoe heet je?||question|Demande son prénom à quelqu\'un (tutoiement).|||||'
];

// Interface vocabulary: seeded into Cards in BOTH DEV and PROD (added 2026-09-27, before everything else).
// scripts/check-ui-vocab.mjs reads this list. Format as SEED_CARDS.
var APP_SEED_ADDED = '2026-09-27';
var APP_SEED_CARDS = [
  'word|app|de|noun|l\'appli|Ik open de app.|J\'ouvre l\'appli.|app|manual|',
  'word|scherm|het|noun|l\'écran|Het scherm is groot.|L\'écran est grand.|app|manual|',
  'word|woord|het|noun|le mot|Dit woord ken ik niet.|Je ne connais pas ce mot.|app|manual|',
  'word|kaart|de|noun|la carte (de révision)|Ik zie een kaart.|Je vois une carte.|app|manual|',
  'word|zin|de|noun|la phrase|Lees de zin.|Lis la phrase.|app|manual|',
  'word|vraag|de|noun|la question|Ik heb een vraag.|J\'ai une question.|app|manual|',
  'word|antwoord|het|noun|la réponse|Mijn antwoord is goed.|Ma réponse est bonne.|app|manual|',
  'word|onderwerp|het|noun|le sujet, le thème|Kies een onderwerp.|Choisis un thème.|app|manual|',
  'word|instellingen|de|noun (plural)|les réglages|Ik open de instellingen.|J\'ouvre les réglages.|app|manual|',
  'word|hulp|de|noun|l\'aide|Ik heb hulp nodig.|J\'ai besoin d\'aide.|app|manual|',
  'word|voortgang|de|noun|la progression|Mijn voortgang is goed.|Ma progression est bonne.|app|manual|',
  'word|verbinding|de|noun|la connexion|Er is geen verbinding.|Il n\'y a pas de connexion.|app|manual|',
  'word|internet|het|noun|internet|Ik heb internet nodig.|J\'ai besoin d\'internet.|app|manual|',
  'word|geluid|het|noun|le son|Het geluid is te zacht.|Le son est trop faible.|app|manual|',
  'word|versie|de|noun|la version|Er is een nieuwe versie.|Il y a une nouvelle version.|app|manual|',
  'word|dag|de|noun|le jour|Een dag heeft vierentwintig uur.|Un jour a vingt-quatre heures.|app|manual|',
  'word|week|de|noun|la semaine|Een week heeft zeven dagen.|Une semaine a sept jours.|app|manual|',
  'word|maand|de|noun|le mois|Een maand heeft dertig dagen.|Un mois a trente jours.|app|manual|',
  'word|jaar|het|noun|l\'an, l\'année|Een jaar heeft twaalf maanden.|Une année a douze mois.|app|manual|',
  'word|uur|het|noun|l\'heure (durée)|Het duurt een uur.|Ça dure une heure.|app|manual|',
  'word|minuut|de|noun|la minute|Wacht een minuut.|Attends une minute.|app|manual|',
  'word|starten||verb|commencer, démarrer|Ik start de les.|Je commence la leçon.|app|manual|',
  'word|oefenen||verb|s\'exercer, pratiquer|Ik oefen elke dag.|Je m\'exerce tous les jours.|app|manual|',
  'word|herhalen||verb|répéter, réviser|We herhalen de woorden.|Nous révisons les mots.|app|manual|',
  'word|kiezen||verb|choisir|Ik kies een woord.|Je choisis un mot.|app|manual|',
  'word|luisteren||verb|écouter|Luister goed.|Écoute bien.|app|manual|',
  'word|typen||verb|taper|Typ het antwoord.|Tape la réponse.|app|manual|',
  'word|controleren||verb|vérifier|Ik controleer mijn antwoord.|Je vérifie ma réponse.|app|manual|',
  'word|tonen||verb|montrer, afficher|Ik toon het antwoord.|Je montre la réponse.|app|manual|',
  'word|openen||verb|ouvrir|Ik open het boek.|J\'ouvre le livre.|app|manual|',
  'word|sluiten||verb|fermer|Sluit de app.|Ferme l\'appli.|app|manual|',
  'word|synchroniseren||verb|synchroniser|Ik synchroniseer de app met wifi.|Je synchronise l\'appli avec le wifi.|app|manual|',
  'word|opslaan||verb (separable)|enregistrer, sauvegarder|Ik sla mijn voortgang op.|J\'enregistre ma progression.|app|manual|separable',
  'word|aanzetten||verb (separable)|allumer, activer|Ik zet het licht aan.|J\'allume la lumière.|app|manual|separable',
  'word|uitzetten||verb (separable)|éteindre, désactiver|Ik zet het geluid uit.|Je coupe le son.|app|manual|separable',
  'word|klaar||adj|fini, prêt|Ik ben klaar.|J\'ai fini. / Je suis prêt.|app|manual|',
  'word|nieuw||adj|nouveau|Dit is een nieuw woord.|C\'est un nouveau mot.|app|manual|',
  'word|goed||adj|bon, bien|Dat is goed.|C\'est bien.|app|manual|',
  'word|fout||adj|faux, incorrect|Dit antwoord is fout.|Cette réponse est fausse.|app|manual|',
  'word|juist||adj|correct, exact|Dat is juist.|C\'est exact.|app|manual|',
  'word|moeilijk||adj|difficile|Dit woord is moeilijk.|Ce mot est difficile.|app|manual|',
  'word|makkelijk||adj|facile|Deze zin is makkelijk.|Cette phrase est facile.|app|manual|',
  'word|volgende||adj|suivant, prochain|De volgende kaart.|La carte suivante.|app|manual|',
  'word|beschikbaar||adj|disponible|De app is beschikbaar.|L\'appli est disponible.|app|manual|',
  'word|opnieuw||adv|de nouveau|Probeer het opnieuw.|Réessaie.|app|manual|',
  'word|terug||adv|en arrière, retour|Ga terug.|Reviens en arrière.|app|manual|',
  'word|vandaag||adv|aujourd\'hui|Vandaag oefen ik tien woorden.|Aujourd\'hui je m\'exerce sur dix mots.|app|manual|',
  'word|geen||det|aucun, pas de|Ik heb geen tijd.|Je n\'ai pas le temps.|app|manual|',
  'word|nog eens||phrase|encore une fois|Zeg het nog eens.|Dis-le encore une fois.|app|manual|',
  'word|bedankt||phrase|merci|Bedankt voor je hulp.|Merci pour ton aide.|app|manual|'
];
