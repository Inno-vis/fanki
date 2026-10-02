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
| `home.allDone` | Klaar voor vandaag! | Fini pour aujourd’hui ! |
| `status.offline` | Geen internet | Pas d’internet |
| `sync.button` | Synchroniseren | Synchroniser (télécharger les cartes et envoyer tes réponses) |
| `sync.running` | Synchroniseren… | Synchronisation en cours… |
| `sync.error` | Geen verbinding. Probeer het opnieuw. | La synchronisation n’a pas marché. Réessaie plus tard. |
| `sync.last` | Laatst gesynchroniseerd: {ago} | Dernière synchronisation : {ago} |
| `sync.never` | Nog niet gesynchroniseerd | Pas encore synchronisé |
| `sync.pending` | {n} antwoorden nog niet gesynchroniseerd | {n} réponses pas encore envoyées (elles partiront à la prochaine connexion) |
| `review.back` | Terug | Retour |
| `review.progress` | {done} van {target} kaarten | {done} cartes sur {target} dans cette séance |
| `review.show` | Antwoord tonen | Montrer la réponse |
| `review.done` | Klaar voor vandaag! | Fini pour aujourd’hui ! |
| `review.count` | {n} kaarten herhaald | {n} cartes révisées |
| `session.offer` | Sessie voltooid! Wil je doorgaan? | Séance terminée ! Tu veux continuer ? |
| `session.more` | Nog {n} kaarten, graag! | Encore {n} cartes, s’il te plaît ! |
| `session.stop` | Stoppen | Arrêter |
| `home.resume` | Doorgaan ({done} van {target} kaarten) | Continuer ta séance ({done} cartes sur {target}) |
| `session.cooldown` | Volgende sessie over {n} minuten | Prochaine séance dans {n} minutes |
| `session.cooldown1` | Volgende sessie over 1 minuut | Prochaine séance dans 1 minute |
| `tags.title` | Kies een onderwerp | Choisis un ou plusieurs thèmes |
| `tags.all` | Alle onderwerpen | Tous les thèmes |
| `tags.done` | Klaar | Terminé |
| `tags.locked` | nog dicht | pas encore ouvert : il s’ouvre quand le thème précédent est bien su |
| `home.topicAll` | Onderwerp: alle | Thème : tous |
| `home.topic` | Onderwerp: {list} | Thème : {list} |
| `break.title` | Sessie voltooid! | Séance terminée ! |
| `break.ok` | OK | OK |
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
| `mark.shareTitle` | Fanki: gemarkeerde kaarten | Fanki : cartes marquées |
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

| screen | fr (shown in the panel) |
|---|---|
| home | Cet écran montre combien de cartes tu dois revoir aujourd’hui (« te herhalen ») et combien de nouvelles cartes t’attendent (« nieuw vandaag »). Touche « Starten » pour commencer. L’appli fonctionne aussi sans internet : tes réponses sont gardées sur le téléphone et envoyées à la prochaine connexion. « Synchroniseren » télécharge les nouvelles cartes quand tu as internet. Après une séance, une pause est prévue : « Volgende sessie over 42 minuten » = prochaine séance dans 42 minutes. Si tu reviens en arrière pendant une séance, « Doorgaan » te permet de la continuer. |
| marked | Ici, les cartes que tu as marquées avec 🚩 pendant les révisions, les plus récentes en haut. « Opgelost » = résolu : la carte passe dans la liste « Opgelost » (rien n’est effacé). « Delen » = partager la liste (Messages, e-mail…) avec ton prof ou quelqu’un d’autre : c’est toi qui l’envoies, rien ne part tout seul. |
| topics | Choisis un ou plusieurs thèmes : les prochaines séances ne montrent que les cartes de ces thèmes (révisions et nouvelles cartes). « Alle onderwerpen » = tous les thèmes. 🔒 « nog dicht » = pas encore ouvert : ce thème s’ouvrira quand le précédent sera bien su. Touche « Klaar » pour revenir. |
| break | C’est la pause ! Fais ce petit exercice en néerlandais, loin de l’écran : pas besoin de répondre dans l’appli. Touche « OK » pour fermer. La prochaine séance sera possible après la pause. |
| review | Lis la carte et essaie de te souvenir de la réponse. Touche « Antwoord tonen » pour la voir, puis dis honnêtement comment ça s’est passé : ❌ Opnieuw = je ne savais pas, 😅 Moeilijk = j’ai hésité, ✅ Goed = bien, 😎 Makkelijk = très facile. Sous chaque bouton : quand la carte reviendra (min = minutes, u = heures, d = jours, wk = semaines, mnd = mois, jr = ans). Les noms montrent toujours « de » ou « het ». Badge « valse vriend » = faux ami. La barre en haut montre ta séance (« 9 van 15 kaarten » = 9 cartes sur 15). À la fin, « Nog 10 kaarten, graag! » = encore 10 cartes, « Stoppen » = arrêter. « Terug » = retour. 🚩 en haut de la carte = marquer une carte qui te pose question (appui long ou « + notitie » pour ajouter une note). |
