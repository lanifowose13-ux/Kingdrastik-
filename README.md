# Paper Trader

A practice stock market with virtual tokens: fictional companies, simulated prices, no real money.
Market, limit and stop orders, world events, a strategy lab, a small business game and twelve lessons.

## The app

Paper Trader installs as an app (a progressive web app). It opens full screen with its own icon and works offline.

**Install it**
- iPhone or iPad: open the app link in Safari, tap Share, then Add to Home Screen.
- Android: open the link in Chrome, then tap Install app (or the menu, then Add to Home screen).
- Desktop Chrome or Edge: click the install icon in the address bar.

Your portfolio is saved on each device. Cross-device sync only runs in the Claude artifact version.

## Files

- `paper-trader.html`: the whole app. The Claude artifact is published from this file.
- `app/`: the app manifest, service worker and icons.
- `scripts/build-app.mjs`: builds `dist/` (the installable app) from the two above. Run `node scripts/build-app.mjs`.
- `.github/workflows/deploy-app.yml`: builds and deploys `dist/` to GitHub Pages on every push to `main`.

## Turning on hosting (once)

In the repository on GitHub: Settings, Pages, then under Build and deployment set Source to **GitHub Actions**.
After the next push to `main`, the app is live at `https://<owner>.github.io/<repo>/`.
