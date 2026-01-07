#!/usr/bin/env bash
set -euo pipefail

# Deploy privacy policy using Netlify CLI
# Requirements: npm i -g netlify-cli && netlify login

if ! command -v netlify >/dev/null 2>&1; then
  echo "Netlify CLI not found. Install: npm i -g netlify-cli" >&2
  exit 1
fi

# Build step is not needed for a static single file; publish current dir
netlify deploy --prod --dir . --message "HabitChain Privacy Policy"
