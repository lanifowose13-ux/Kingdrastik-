# Crown Rush 👑

A fast tap-to-dodge phone game starring **King Drastik**. Built with Expo / React Native, so it runs on iPhone and Android.

## How to play
- Tap the **left** or **right** half of the screen to move the king between 3 lanes.
- Catch 🪙 coins (+1) and 👑 crowns (+5).
- Dodge 💣 bombs. You have 3 lives, and ❤️ hearts give one back (max 5).
- Catch 10 treasures in a row to raise your combo multiplier. If you miss a treasure, the combo resets.
- The game gets faster as your score climbs. Your best score is saved on your phone.

## Play it on your phone (quickest way)
1. Install **Expo Go** from the App Store or Google Play.
2. On a computer with Node.js 20+:
   ```bash
   git clone <this repo>
   cd Kingdrastik-
   npm install
   npx expo start
   ```
3. Scan the QR code in the terminal: with the Camera app on iPhone, or with Expo Go on Android.
   Your phone and computer must be on the same Wi-Fi. If they aren't, run `npx expo start --tunnel`.

## Install it as a real app (no computer needed to play)
Use EAS Build to make an installable app:
```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build -p android --profile preview   # gives you an .apk download link
npx eas-cli@latest build -p ios                         # needs an Apple Developer account
```

## Project layout
- `App.js`: the whole game (game loop, screens, styles)
- `app.json`: app name, icon and bundle IDs (`com.kingdrastik.crownrush`)
