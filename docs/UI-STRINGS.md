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
| `review.left` | nog {n} | encore {n} cartes dans cette séance |
| `review.show` | Antwoord tonen | Montrer la réponse |
| `review.done` | Klaar voor vandaag! | Fini pour aujourd’hui ! |
| `review.count` | {n} kaarten herhaald | {n} cartes révisées |
| `flag.false-friend` | valse vriend | faux ami : ressemble à un mot français, mais le sens est différent |
| `flag.separable` | scheidbaar | verbe séparable : le préfixe va à la fin de la phrase |
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
| home | Cet écran montre combien de cartes tu dois revoir aujourd’hui (« te herhalen ») et combien de nouvelles cartes t’attendent (« nieuw vandaag »). Touche « Starten » pour commencer. L’appli fonctionne aussi sans internet : tes réponses sont gardées sur le téléphone et envoyées à la prochaine connexion. « Synchroniseren » télécharge les nouvelles cartes quand tu as internet. |
| review | Lis la carte et essaie de te souvenir de la réponse. Touche « Antwoord tonen » pour la voir, puis dis honnêtement comment ça s’est passé : ❌ Opnieuw = je ne savais pas, 😅 Moeilijk = j’ai hésité, ✅ Goed = bien, 😎 Makkelijk = très facile. Sous chaque bouton : quand la carte reviendra (min = minutes, u = heures, d = jours, wk = semaines, mnd = mois, jr = ans). Les noms montrent toujours « de » ou « het ». Badges : « valse vriend » = faux ami, « scheidbaar » = verbe séparable. « nog 5 » = encore 5 cartes. « Terug » = retour. |
