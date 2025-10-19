# Spendify — Forge Multi-Panel (Dashboard / Add Expense / Reports)

This Forge-native app provides three Jira issue panels (Dashboard, Add Expense, Reports).
It uses an in-memory shared store (per runtime instance) so panels share data during a session.
No persistent storage is used (data resets when the runtime restarts).

## Setup

1. Replace the App ID in `manifest.yml` with the App UUID from your Developer Console:
   Example: `ari:cloud:ecosystem::app/0f7b8c47-7fa1-4e1b-8f42-5caa12b33df8`

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Login then deploy & install:
   ```bash
   forge login --token <YOUR_FORGE_TOKEN>
   forge lint
   forge deploy
   forge install
   ```

4. Open a Jira issue in your site and use the **Apps** sidebar to open the three Spendify panels.

## Notes
- This version uses a simple in-memory store `src/store.js` (module-level singleton). Data is shared between panels while the app is running, but will not persist across restarts.
- If you later want persistence, modify storage functions in `src/store.js` to use `@forge/api` storage or an external DB.
- UI uses `@forge/ui` components and text-based visualizations (Forge UI doesn't support browser charting libraries).
