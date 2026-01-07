# HabitChain Privacy Policy Hosting

This folder includes a public `privacy-policy.html` and simple deploy configs for Netlify and Vercel so you can publish a URL for Google Play Console.

## Files
- `privacy-policy.html`: The static privacy policy page.
- `netlify.toml`: Netlify configuration (publishes current directory).
- `vercel.json`: Vercel configuration.
- `scripts/deploy_netlify.sh`: One-command Netlify deploy (requires Netlify CLI).
- `scripts/deploy_vercel.sh`: One-command Vercel deploy (requires Vercel CLI).

## Option A: Netlify
1. Install CLI and login:
   ```bash
   npm i -g netlify-cli
   netlify login
   ```
2. Deploy:
   ```bash
   bash scripts/deploy_netlify.sh
   ```
3. Copy the `Live Draft URL` or production URL printed by the CLI and paste it into Play Console's Privacy Policy URL field.

## Option B: Vercel
1. Install CLI and login:
   ```bash
   npm i -g vercel
   vercel login
   ```
2. Deploy (first run will ask project details; subsequent runs are automatic):
   ```bash
   bash scripts/deploy_vercel.sh
   ```
3. Copy the production URL printed by the CLI and paste it into Play Console.

## Option C: GitHub Pages (manual)
1. Create a public GitHub repository and add `privacy-policy.html` at the repo root.
2. In repo Settings → Pages, select `Deploy from a branch` and choose the default branch root.
3. Use the generated Pages URL in Play Console.

## Maintenance
- To update the policy, edit `privacy-policy.html` and redeploy using the same command.
- Keep the effective date current when making changes.
