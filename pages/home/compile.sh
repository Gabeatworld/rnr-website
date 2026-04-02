#!/bin/bash
# ============================================================
# RNR Compile — Reads manifest.json → outputs a single
# <style> + <script> block ready for Webflow page body code.
# ============================================================

set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
MANIFEST="$DIR/manifest.json"

if [ ! -f "$MANIFEST" ]; then
  echo "❌ manifest.json not found in $DIR" >&2
  exit 1
fi

OUTPUT_FILE="$DIR/$(python3 -c "import json; print(json.load(open('$MANIFEST'))['output'])")"
CORE="$DIR/$(python3 -c "import json; print(json.load(open('$MANIFEST'))['core'])")"

# Read CSS files
CSS_FILES=$(python3 -c "import json; [print(f) for f in json.load(open('$MANIFEST')).get('css', [])]")

# Read module files
MOD_FILES=$(python3 -c "import json; [print(f) for f in json.load(open('$MANIFEST'))['modules']]")

echo "🔨 Compiling → $(basename "$OUTPUT_FILE")"

# Start output
{
  # ── CSS block (only if there are CSS files) ────
  if [ -n "$CSS_FILES" ]; then
    echo "<style>"
    for f in $CSS_FILES; do
      echo ""
      echo "/* ── $(basename "$f") ── */"
      cat "$DIR/$f"
    done
    echo "</style>"
    echo ""
  fi

  # ── JS block ───────────────────────────────────
  echo "<script>"
  echo ""
  echo "/* ── core ── */"
  # Strip the outer <script> tags if present, just get the JS
  cat "$CORE"
  echo ""

  for f in $MOD_FILES; do
    echo ""
    echo "/* ── $(basename "$f") ── */"
    cat "$DIR/$f"
    echo ""
  done

  echo "</script>"
} > "$OUTPUT_FILE"

echo "✅ Done → $OUTPUT_FILE ($(wc -c < "$OUTPUT_FILE" | tr -d ' ') bytes)"

# ── Raw JS output (no <script> tags) for Lantern inject ──
RAW_FILE="${OUTPUT_FILE%.html}.js"
{
  cat "$CORE"
  echo ""

  for f in $MOD_FILES; do
    echo ""
    echo "/* ── $(basename "$f") ── */"
    cat "$DIR/$f"
    echo ""
  done
} > "$RAW_FILE"

echo "✅ Raw  → $(basename "$RAW_FILE") ($(wc -c < "$RAW_FILE" | tr -d ' ') bytes)"
