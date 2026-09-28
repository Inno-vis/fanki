#!/usr/bin/env bash
# Push apps-script/ and move the EXISTING web-app deployment to a new version,
# so the /exec URL never changes. Usage: scripts/gas-deploy.sh dev|prod
set -euo pipefail
env="${1:?usage: gas-deploy.sh dev|prod}"
cd "$(git rev-parse --show-toplevel)"
dep="$(node -p "require('./deploy.config.json')['$env'].deploymentId")"
[[ -n "$dep" ]] || { echo "No deploymentId for $env in deploy.config.json (first deploy: clasp -P .clasp.$env.json deploy)" >&2; exit 1; }
if grep -Eq "LEARNER_TOKEN: '[^']+'" apps-script/Secrets.gs; then echo "apps-script/Secrets.gs is not blank — refusing" >&2; exit 1; fi
clasp -P ".clasp.$env.json" push -f >/dev/null
desc="$(git rev-parse --short HEAD 2>/dev/null || echo local) $(date -u +%Y-%m-%dT%H:%MZ)"
ver="$(clasp -P ".clasp.$env.json" version "$desc" | grep -Eo '[0-9]+' | tail -1)"
clasp -P ".clasp.$env.json" redeploy "$dep" -V "$ver" -d "$desc" >/dev/null
url="$(clasp -P ".clasp.$env.json" deployments | grep "$dep" | head -1)"
echo "Deployed $env version $ver → $dep"
echo "$url"
