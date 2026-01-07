#!/usr/bin/env bash
set -euo pipefail

# Deploy privacy policy using Vercel CLI
# Requirements: npm i -g vercel && vercel login

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI not found. Install: npm i -g vercel" >&2
  exit 1
fi

# Deploy current directory; follow prompts (scope, project name) on first run
vercel --prod --confirm
