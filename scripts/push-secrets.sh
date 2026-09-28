#!/usr/bin/env bash
# Pushes the Apps Script code WITH real secrets from a temporary copy outside the repo.
# The tracked apps-script/Secrets.gs stays blank. After running setup() in the editor,
# run `npm run gas:push:<env>` to overwrite the remote Secrets.gs with the blank stub.
# Usage: scripts/push-secrets.sh dev|prod
set -euo pipefail
env="${1:?usage: push-secrets.sh dev|prod}"
root="$(git rev-parse --show-toplevel)"
cd "$root"
[[ -f .env.local ]] || { echo ".env.local missing" >&2; exit 1; }
set -a; source .env.local; set +a
ENV_UP="$(tr '[:lower:]' '[:upper:]' <<<"$env")"
learner_var="LEARNER_TOKEN_$ENV_UP"; admin_var="ADMIN_TOKEN_$ENV_UP"
[[ -n "${!learner_var:-}" && -n "${!admin_var:-}" ]] || { echo "tokens for $ENV_UP missing in .env.local" >&2; exit 1; }

tmp="$(cd "$(mktemp -d "${TMPDIR:-/tmp}/fanki-secrets.XXXXXX")" && pwd -P)"
trap 'rm -rf "$tmp"' EXIT
cp apps-script/*.gs apps-script/appsscript.json "$tmp/"
cat > "$tmp/Secrets.gs" <<GS
var SECRETS = { ENV: '$ENV_UP', LEARNER_TOKEN: '${!learner_var}', ADMIN_TOKEN: '${!admin_var}' };
GS
script_id="$(node -p "require('./.clasp.$env.json').scriptId")"
printf '{"scriptId":"%s","rootDir":".","skipSubdirectories":true}\n' "$script_id" > "$tmp/.clasp.json"
(cd "$tmp" && clasp push -f >/dev/null)
echo "Pushed code + secrets for $ENV_UP (temporary copy deleted)."
echo "Next: run setup() in the editor, then: npm run gas:push:$env"
