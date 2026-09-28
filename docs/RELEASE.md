# Releasing: DEV → PROD

| | branch | Pages URL | Apps Script | Sheet |
|---|---|---|---|---|
| DEV  | `main`    | https://inno-vis.github.io/fanki/dev/ | "Dutch DEV"  | "Dutch DEV"  |
| PROD | `release` | https://inno-vis.github.io/fanki/     | "Dutch PROD" | "Dutch PROD" |

Every push to `main` or `release` rebuilds **both** apps into one Pages artifact
(`.github/workflows/deploy.yml`).

## 1. Promote the web app

```bash
git checkout release
git merge --ff-only main
git push
git checkout main
```

If `--ff-only` fails, someone committed to `release` directly: merge `release` back into `main`
first, then retry. The learner sees "Nouvelle version disponible" the next time she opens the app.

## 2. Promote the Apps Script (only if `apps-script/` changed)

From the same commit that is on `release`:

```bash
npm run gas:deploy:prod
npm run smoke:prod
```

`gas:deploy:prod` pushes the code and moves the **existing** deployment to a new version, so the
`/exec` URL never changes. It refuses to run if `apps-script/Secrets.gs` is not blank.

If a change adds a new tab, column or setting, also run setup on PROD:

```bash
npm run admin -- prod setup
```

## Rollback

- Web app: `git checkout release && git reset --hard <previous-sha> && git push --force-with-lease`.
- Apps Script: `clasp -P .clasp.prod.json deployments` to see versions, then
  `clasp -P .clasp.prod.json redeploy <deploymentId> -V <older version>`.

Reviews are never lost on rollback: they wait in the phone's queue and the server de-duplicates
by `event_id`.
