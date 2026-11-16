#!/usr/bin/env bash
# Regenerates the PWA icons in static/icons from src/lib/assets/logo*.svg.
# Needs rsvg-convert (brew install librsvg). Run after changing the logo.
set -euo pipefail
cd "$(dirname "$0")/.."
cp src/lib/assets/logo.svg static/icons/icon.svg
rsvg-convert -w 192 -h 192 src/lib/assets/logo.svg -o static/icons/icon-192.png
rsvg-convert -w 512 -h 512 src/lib/assets/logo.svg -o static/icons/icon-512.png
rsvg-convert -w 512 -h 512 src/lib/assets/logo-maskable.svg -o static/icons/icon-maskable-512.png
rsvg-convert -w 180 -h 180 src/lib/assets/logo-maskable.svg -o static/icons/apple-touch-icon.png
echo "icons written to static/icons/"
