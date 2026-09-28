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
| `home.comingSoon` | De kaarten komen snel. | Les cartes arrivent bientôt. |
| `status.offline` | Geen internet | Pas d’internet |
| `server.checking` | Verbinding controleren… | Vérification de la connexion… |
| `server.ok` | De verbinding is goed. | La connexion fonctionne. |
| `server.error` | Geen verbinding. Probeer het opnieuw. | Pas de connexion. Réessaie plus tard. |
| `sync.last` | Laatst gesynchroniseerd: {ago} | Dernière synchronisation : {ago} |
| `sync.never` | Nog niet gesynchroniseerd | Pas encore synchronisé |
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
| home | Cet écran montre combien de cartes tu dois revoir aujourd’hui (« te herhalen ») et combien de nouvelles cartes t’attendent (« nieuw vandaag »). Touche « Starten » pour commencer. L’appli fonctionne aussi sans internet : tes réponses sont gardées sur le téléphone et envoyées à la prochaine connexion. |
