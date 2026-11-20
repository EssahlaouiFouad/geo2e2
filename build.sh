#!/usr/bin/env bash
# ==========================================================================
# GEO2E2 — Source unique de vérité pour le versionnage des ressources.
#
#   ./build.sh              -> horodatage du jour (YYYYMMDD)
#   ./build.sh 20261124     -> version explicite
#
# Réécrit les suffixes ?v=......... de toutes les pages HTML. Plus aucune
# occurrence tapée à la main dans les fichiers.
# ==========================================================================
set -euo pipefail
cd "$(dirname "$0")"

VERSION="${1:-$(date +%Y%m%d)}"

if [[ ! "$VERSION" =~ ^[0-9]{8}$ ]]; then
  echo "Version invalide : $VERSION (attendu YYYYMMDD)" >&2
  exit 1
fi

FICHIERS=$(find . -name '*.html' -not -path './_*' -print)

# perl -pi fonctionne identiquement sur macOS (BSD) et Linux (GNU).
while IFS= read -r f; do
  perl -pi -e "s/\bv=[0-9]{8}\b/v=${VERSION}/g" "$f"
done <<< "$FICHIERS"

echo "Version ${VERSION} appliquée à $(printf '%s\n' "$FICHIERS" | wc -l | tr -d ' ') pages."

echo "Contrôle :"
grep -rho 'v=[0-9]\{8\}' --include='*.html' . | sort | uniq -c
