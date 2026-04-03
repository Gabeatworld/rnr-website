#!/bin/bash
# ============================================================
# RNR Deploy — Staging & Production workflow
#
# Usage:
#   bash deploy.sh "message"              → push to staging
#   bash deploy.sh --production "message" → promote staging → main (live)
#   bash deploy.sh --status               → show what's on each branch
# ============================================================

set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$DIR/../.." && pwd)"
REPO="Gabeatworld/rnr-website"

# ── Parse flags ────────────────────────────────────────────
PRODUCTION=false
STATUS=false

for arg in "$@"; do
  case "$arg" in
    --production) PRODUCTION=true; shift ;;
    --status) STATUS=true; shift ;;
  esac
done

cd "$REPO_ROOT"

# ── Status command ─────────────────────────────────────────
if $STATUS; then
  echo "📊 Branch status:"
  echo ""
  MAIN_HASH=$(git rev-parse --short origin/main 2>/dev/null || echo "n/a")
  STAGING_HASH=$(git rev-parse --short origin/staging 2>/dev/null || echo "n/a")
  echo "  main (production):  $MAIN_HASH"
  echo "  staging:            $STAGING_HASH"
  echo ""
  if [ "$MAIN_HASH" = "$STAGING_HASH" ]; then
    echo "  ✅ In sync"
  else
    AHEAD=$(git rev-list --count origin/main..origin/staging 2>/dev/null || echo "?")
    echo "  staging is $AHEAD commit(s) ahead of production"
  fi
  echo ""
  echo "  Staging URL:    https://raw.githubusercontent.com/$REPO/staging/pages/home/home.compiled.js"
  echo "  Production URL: https://cdn.jsdelivr.net/gh/$REPO@$MAIN_HASH/pages/home/home.compiled.js"
  exit 0
fi

# ── Ensure staging branch exists ───────────────────────────
if ! git show-ref --verify --quiet refs/heads/staging; then
  echo "📌 Creating staging branch from main..."
  git branch staging main
  git push -u origin staging
fi

# ══════════════════════════════════════════════════════════════
# PRODUCTION: merge staging → main
# ══════════════════════════════════════════════════════════════
if $PRODUCTION; then
  echo "🚀 Promoting staging → production..."
  echo ""

  # Make sure we're up to date
  git fetch origin

  # Check staging is ahead of main
  AHEAD=$(git rev-list --count origin/main..origin/staging)
  if [ "$AHEAD" = "0" ]; then
    echo "⚡ staging and main are identical — nothing to promote."
    exit 0
  fi
  echo "  $AHEAD commit(s) to promote"

  # Fast-forward main to staging
  git checkout main
  git merge --ff-only origin/staging
  git push origin main

  # Get the new commit hash for pinned CDN URL
  HASH=$(git rev-parse --short HEAD)

  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "  ✅ PRODUCTION LIVE"
  echo ""
  echo "  Paste this into Webflow (production site):"
  echo ""
  echo "  https://cdn.jsdelivr.net/gh/$REPO@$HASH/pages/home/home.compiled.js"
  echo ""
  echo "═══════════════════════════════════════════════════════"
  exit 0
fi

# ══════════════════════════════════════════════════════════════
# STAGING: compile → commit → push to staging
# ══════════════════════════════════════════════════════════════

# 1. Compile
echo "🔨 Compiling..."
bash "$DIR/compile.sh"

# 2. Stamp version
HASH=$(git rev-parse --short HEAD)
sed -i '' "s/__GIT_HASH__/$HASH/" "$DIR/home.compiled.html" "$DIR/home.compiled.js"
echo "📌 Version: $HASH"

# 3. Switch to staging
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "staging" ]; then
  git checkout staging
  # Keep staging up to date with main
  git merge main --no-edit 2>/dev/null || true
fi

# 4. Stage + Commit
git add pages/home/home.compiled.html pages/home/home.compiled.js
git add pages/home/modules/ pages/home/manifest.json pages/home/deploy.sh pages/home/compile.sh
git add global/ sections/ .gitignore 2>/dev/null || true

if git diff --cached --quiet; then
  echo "⚡ No changes to commit — skipping push."
  git checkout main 2>/dev/null || true
  exit 0
fi

MSG="${1:-Update homepage modules}"
git commit -m "$MSG

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

# 5. Push staging
echo "🚀 Pushing to staging..."
git push origin staging

HASH=$(git rev-parse --short HEAD)

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ STAGING DEPLOYED"
echo ""
echo "  Preview: https://raw.githubusercontent.com/$REPO/staging/pages/home/home.compiled.js"
echo "  Version: $HASH"
echo ""
echo "  When ready: bash deploy.sh --production"
echo "═══════════════════════════════════════════════════════"

# 6. Switch back to main for development
git checkout main
