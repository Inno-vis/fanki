# UI strings

Generated from `src/i18n.ts` by `npm run ui-strings` — edit the source, not this file.
She sees **nl**. **fr** is hidden help: shown only in the "Hulp" panel and the one-time rating overlay
(both hidden when Settings `show_french_help` is FALSE).

## Interface strings

| key | nl (shown) | fr (help) |
|---|---|---|
| `home.due` | te herhalen | cartes à revoir |
| `home.newToday` | nieuw vandaag | nouvelles cartes aujourd’hui |
| `home.start` | Starten | Commencer |
| `home.cards` | {n} kaarten | {n} cartes en tout |
| `home.empty` | Nog geen kaarten. Tik op Synchroniseren. | Pas encore de cartes. Touche « Synchroniseren ». |
| `home.emptyOffline` | Nog geen kaarten. Zet het internet aan. | Pas encore de cartes. Connecte-toi à internet. |
| `home.allDone` | Klaar voor nu! | Fini pour le moment ! |
| `home.later` | Volgende kaarten: {list} | Prochaines cartes aujourd’hui : {list} |
| `home.laterMin` | {n} over ± {m} min | {n} dans environ {m} minutes |
| `home.laterHour` | {n} over ± {h} uur | {n} dans environ {h} heure(s) |
| `today.label` | Vandaag | Aujourd’hui |
| `today.left` | Nog {n} kaarten | Encore {n} cartes aujourd’hui |
| `today.left1` | Nog 1 kaart | Encore 1 carte aujourd’hui |
| `db.blocked` | SpeesRep is nog open in een ander venster. Sluit het en open de app opnieuw. | Une autre fenêtre de SpeesRep (ancienne version) est encore ouverte : ferme-la, puis rouvre l’appli. |
| `status.offline` | Geen internet | Pas d’internet |
| `sync.button` | Synchroniseren | Synchroniser (télécharger les cartes et envoyer tes réponses) |
| `sync.running` | Synchroniseren… | Synchronisation en cours… |
| `sync.error` | Geen verbinding. Probeer het opnieuw. | La synchronisation n’a pas marché. Réessaie plus tard. |
| `sync.last` | Laatst gesynchroniseerd: {ago} | Dernière synchronisation : {ago} |
| `sync.never` | Nog niet gesynchroniseerd | Pas encore synchronisé |
| `sync.pending` | {n} antwoorden nog niet gesynchroniseerd | {n} réponses pas encore envoyées (elles partiront à la prochaine connexion) |
| `review.back` | Terug | Retour |
| `review.show` | Antwoord tonen | Montrer la réponse |
| `tags.title` | Kies een onderwerp | Choisis un ou plusieurs thèmes |
| `tags.all` | Alle onderwerpen | Tous les thèmes |
| `tags.done` | Klaar | Terminé |
| `tags.locked` | nog dicht | pas encore ouvert : il s’ouvre quand le thème précédent est bien su |
| `home.topicAll` | Onderwerp: alle | Thème : tous |
| `home.topic` | Onderwerp: {list} | Thème : {list} |
| `menu.open` | Menu openen | Ouvrir le menu (progression, cartes marquées, réglages, à propos, synchronisation) |
| `menu.title` | Menu | Menu |
| `progress.title` | Voortgang | Ma progression |
| `about.title` | Over SpeesRep | À propos de SpeesRep |
| `about.intro` | SpeesRep helpt je om Nederlandse woorden te leren. Je oefent elke dag een beetje. | SpeesRep t’aide à apprendre des mots néerlandais. Tu t’exerces un peu chaque jour. |
| `about.privacy` | Je antwoorden gaan naar je leraar. Je leraar kan zien wat je oefent. SpeesRep heeft geen account nodig en vraagt niet om je naam of e-mailadres. | Tes réponses sont envoyées à ton professeur, qui voit ce que tu travailles. SpeesRep n’a pas besoin de compte et ne demande ni ton nom ni ton e-mail. |
| `about.imagesTitle` | Plaatjes | Images |
| `about.images` | Alle plaatjes zijn gemaakt door OpenMoji (https://openmoji.org/), het open-source emoji- en iconenproject. De plaatjes zijn niet aangepast. | Toutes les images viennent d’OpenMoji (https://openmoji.org/), un projet libre d’emojis et d’icônes. Elles ne sont pas modifiées. |
| `about.license` | Licentie: CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/) | Licence : CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/) |
| `about.imagesEn` | All emojis designed by OpenMoji – the open-source emoji and icon project. License: CC BY-SA 4.0 | All emojis designed by OpenMoji – the open-source emoji and icon project. License: CC BY-SA 4.0 |
| `settings.title` | Instellingen | Réglages |
| `settings.newPerDay` | Max. aantal nieuwe woorden per dag | Nombre maximum de nouveaux mots par jour |
| `settings.default` | Standaard ({n}) | Par défaut ({n}) |
| `settings.listening` | Luisteroefeningen | Exercices d’écoute |
| `settings.readAnswer` | Antwoord voorlezen | Lire la réponse à voix haute |
| `settings.on` | Aan | Activé |
| `settings.off` | Uit | Désactivé |
| `settings.noVoice` | Geen Nederlandse stem op dit toestel. | Pas de voix néerlandaise sur cet appareil. |
| `backup.title` | Back-up | Sauvegarde |
| `backup.save` | Back-up opslaan | Enregistrer une sauvegarde (fichier) |
| `backup.load` | Back-up terugzetten | Restaurer une sauvegarde (fichier) |
| `backup.done` | Back-up teruggezet. | Sauvegarde restaurée. |
| `backup.bad` | Dit is geen SpeesRep-back-up. | Ce fichier n’est pas une sauvegarde SpeesRep. |
| `backup.otherApp` | Deze back-up is van een andere versie van de app. | Cette sauvegarde vient d’une autre version de l’appli (DEV/PROD). |
| `progress.learned` | kaarten geoefend (van {n}) | cartes déjà travaillées (sur {n} en tout) |
| `progress.known` | kaarten bekend | cartes bien sues (elles reviennent dans 3 semaines ou plus) |
| `progress.week` | herhalingen deze week | révisions ces 7 derniers jours |
| `progress.streak` | dagen op rij | jours de suite avec au moins une révision |
| `progress.dueToday` | vandaag | cartes à revoir aujourd’hui |
| `progress.dueTomorrow` | morgen | cartes à revoir demain |
| `progress.due7` | deze week | cartes à revoir dans les 7 prochains jours |
| `audio.listen` | Luister | Écouter |
| `audio.play` | Luisteren | Écouter le mot en néerlandais |
| `audio.question` | Wat hoor je? | Qu’est-ce que tu entends ? Essaie de comprendre le mot, puis montre la réponse. |
| `audio.noVoice` | Geen Nederlandse stem op deze telefoon. | Pas de voix néerlandaise sur ce téléphone. iPhone : Réglages › Accessibilité › Contenu énoncé › Voix › Néerlandais (télécharger). Android : Paramètres › Synthèse vocale (Google) › Installer les données vocales › Néerlandais. |
| `mark.button` | Kaart markeren | Marquer cette carte (pour en parler plus tard) |
| `mark.done` | Gemarkeerd | Carte marquée |
| `mark.addNote` | + notitie | + ajouter une note |
| `mark.notePlaceholder` | Notitie (mag leeg) | Note (facultative), par ex. « pourquoi pas het ? » |
| `mark.save` | Opslaan | Enregistrer |
| `mark.title` | Gemarkeerd | Cartes marquées |
| `mark.badge` | 🚩 {n} | 🚩 {n} cartes marquées |
| `mark.empty` | Nog niets gemarkeerd. | Aucune carte marquée pour l’instant. |
| `mark.resolve` | Opgelost | Résolu |
| `mark.resolvedSection` | Opgelost ({n}) | Résolus ({n}) |
| `mark.share` | Delen | Partager (Messages, e-mail…) |
| `mark.copy` | Kopieer naar klembord | Copier dans le presse-papiers |
| `mark.copied` | Gekopieerd | Copié |
| `mark.shareTitle` | SpeesRep: gemarkeerde kaarten | SpeesRep : cartes marquées |
| `flag.abbreviation` | afkorting | abréviation : forme courte d’un mot (min = minuten) |
| `flag.false-friend` | valse vriend | faux ami : ressemble à un mot français, mais le sens est différent |
| `time.justNow` | zojuist | à l’instant |
| `time.minuteAgo` | 1 minuut geleden | il y a 1 minute |
| `time.minutesAgo` | {n} minuten geleden | il y a {n} minutes |
| `time.hourAgo` | 1 uur geleden | il y a 1 heure |
| `time.hoursAgo` | {n} uur geleden | il y a {n} heures |
| `time.dayAgo` | 1 dag geleden | il y a 1 jour |
| `time.daysAgo` | {n} dagen geleden | il y a {n} jours |
| `time.weekAgo` | 1 week geleden | il y a 1 semaine |
| `time.weeksAgo` | {n} weken geleden | il y a {n} semaines |
| `install.hint` | Zet de app op je scherm: tik op {share} en dan op {add}. | Ajoute l’appli à ton écran d’accueil : touche {share} (Partager), puis {add} (Sur l’écran d’accueil). |
| `install.close` | Sluiten | Fermer |
| `install.android` | App installeren | Installer l’appli sur ton téléphone (écran d’accueil) |
| `update.available` | Er is een nieuwe versie. | Une nouvelle version est disponible. |
| `update.open` | Openen | Ouvrir la nouvelle version |
| `help.button` | Hulp | Aide |
| `help.title` | Hulp | Aide |
| `help.close` | Sluiten | Fermer |
| `help.updated` | nieuw | l’aide de cet écran a changé : touche « Hulp » pour la relire |
| `rating.aria` | {label}, {interval} | {label}, {interval} |
| `rating.helpTitle` | De vier knoppen | Les quatre boutons |
| `rating.helpOk` | Klaar | Compris |
| `rating.helpReopen` | Uitleg van de knoppen | Explication des boutons |

## Rating buttons (left to right)

| emoji | nl (shown) | fr meaning (overlay) | FSRS rating |
|---|---|---|---|
| ❌ | Opnieuw | je ne savais pas | 1 |
| 😅 | Moeilijk | j’ai hésité | 2 |
| ✅ | Goed | bien | 3 |
| 😎 | Makkelijk | très facile | 4 |

## Interval units

| unit | shown |
|---|---|
| minute | min |
| hour | u |
| day | d |
| week | wk |
| month | mnd |
| year | jr |

## Hulp panel (per screen)

Structured help (`HelpPage` in src/i18n.ts): one idea per row; the Dutch label is shown as a chip.

### home

Hier zie je je kaarten voor vandaag. Tik op Starten.

| section | label (nl) | fr |
|---|---|---|
| Cet écran | te herhalen | cartes à revoir aujourd’hui |
| Cet écran | nieuw vandaag | nouvelles cartes qui t’attendent |
| Cet écran | Vandaag | ton travail du jour. « Nog 5 kaarten » = encore 5 cartes |
| Cet écran | Starten | commencer. Tu peux t’arrêter quand tu veux, tout est gardé |
| Cet écran | Klaar voor nu! | fini pour le moment |
| Cet écran | Volgende kaarten: 5 over ± 30 min | 5 cartes reviennent dans environ 30 minutes |
| Menu (touche « SpeesRep » en haut) | 📈 Voortgang | ta progression |
| Menu (touche « SpeesRep » en haut) | 🚩 Gemarkeerd | les cartes que tu as marquées |
| Menu (touche « SpeesRep » en haut) | ⚙️ Instellingen | tes réglages |
| Menu (touche « SpeesRep » en haut) | Synchroniseren | télécharge les nouvelles cartes et envoie tes réponses |
| Aide | Hulp | chaque écran a sa propre aide : touche « Hulp » là où tu es |
| 💡 tip |  | Pas d’internet ? Tes réponses sont gardées et envoyées à la prochaine connexion. |

### review

Lees de kaart. Tik op Antwoord tonen. Kies dan een knop.

| section | label (nl) | fr |
|---|---|---|
| Comment faire (stappen) |  | Lis la carte et cherche la réponse dans ta tête. |
| Comment faire (stappen) | Antwoord tonen | touche ce bouton pour voir la réponse |
| Comment faire (stappen) |  | Choisis honnêtement un des quatre boutons. |
| Les boutons | ❌ Opnieuw | je ne savais pas |
| Les boutons | 😅 Moeilijk | j’ai hésité |
| Les boutons | ✅ Goed | bien |
| Les boutons | 😎 Makkelijk | très facile |
| Sous les boutons | min | minutes |
| Sous les boutons | u | heures |
| Sous les boutons | d | jours |
| Sous les boutons | wk | semaines |
| Sous les boutons | mnd | mois |
| Sous les boutons | jr | ans |
| Sur la carte | 🔊 | écouter le mot en néerlandais |
| Sur la carte | Wat hoor je? | écoute, devine, puis touche « Antwoord tonen » |
| Sur la carte | de / het | l’article, toujours montré avec les noms |
| Sur la carte | valse vriend | faux ami |
| Sur la carte | afkorting | abréviation |
| Marquer et arrêter | 🚩 | marquer une carte qui te pose question |
| Marquer et arrêter | + notitie | ajouter une note (ou appui long sur 🚩) |
| Marquer et arrêter | Terug | retour à l’accueil, tout est gardé |
| Pas de voix néerlandaise ? (ingeklapt) (stappen) |  | iPhone : Réglages › Accessibilité › Contenu énoncé › Voix › Néerlandais |
| Pas de voix néerlandaise ? (ingeklapt) (stappen) |  | Android : Paramètres › Synthèse vocale › Installer les données vocales › Néerlandais |

### settings

Hier kies je je instellingen.

| section | label (nl) | fr |
|---|---|---|
| Réglages | Max. aantal nieuwe woorden per dag | maximum de nouveaux mots par jour |
| Réglages | Standaard | le choix de ton professeur |
| Réglages | Luisteroefeningen | parfois la carte commence par le son. « Uit » = jamais |
| Réglages | Antwoord voorlezen | le téléphone lit la réponse néerlandaise à voix haute |
| Sauvegarde (ingeklapt) | Back-up opslaan | enregistre ta progression dans un fichier |
| Sauvegarde (ingeklapt) | Back-up terugzetten | remet ta progression depuis ce fichier (nouveau téléphone) |
| 💡 tip |  | Ces réglages restent sur ton téléphone et comptent tout de suite, dès la prochaine carte. |

### progress

Hier zie je je voortgang.

| section | label (nl) | fr |
|---|---|---|
| Les chiffres | kaarten geoefend | cartes déjà travaillées |
| Les chiffres | kaarten bekend | cartes bien sues |
| Les chiffres | herhalingen deze week | révisions des 7 derniers jours |
| Les chiffres | dagen op rij | jours de suite |
| En bas : les cartes qui reviennent | vandaag | aujourd’hui |
| En bas : les cartes qui reviennent | morgen | demain |
| En bas : les cartes qui reviennent | deze week | cette semaine |

### marked

Hier zie je je gemarkeerde kaarten.

| section | label (nl) | fr |
|---|---|---|
| Cet écran | 🚩 | les cartes que tu as marquées, les plus récentes en haut |
| Cet écran | Opgelost | résolu : la carte passe dans la liste « Opgelost ». Rien n’est effacé. |
| Cet écran | Delen | envoyer la liste à ton professeur (Messages, e-mail…) |
| 💡 tip |  | Rien ne part tout seul : c’est toi qui envoies. |

### topics

Kies een of meer onderwerpen. Tik dan op Klaar.

| section | label (nl) | fr |
|---|---|---|
| Cet écran | Alle onderwerpen | tous les thèmes |
| Cet écran | 🔒 nog dicht | pas encore ouvert : s’ouvre plus tard (une date, ou d’autres thèmes bien sus) |
| Cet écran | Klaar | revenir |
| 💡 tip |  | « Starten » montre seulement les cartes des thèmes choisis. |

### about

Hier lees je over SpeesRep.

| section | label (nl) | fr |
|---|---|---|
| Cette page | 📱 | À quoi sert l’appli. |
| Cette page | 👤 | Pas de compte, pas de nom, pas d’e-mail. |
| Cette page | 📤 | Tes réponses sont envoyées à ton professeur, qui voit ce que tu travailles. |
| Cette page | 🖼️ | Images : OpenMoji, licence CC BY-SA 4.0. |
