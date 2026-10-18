# DailyCheck Android app

A [Capacitor](https://capacitorjs.com) wrapper that opens the hosted DailyCheck site
full-screen, with its own icon and splash screen. All data still lives on the server,
so the APK never needs rebuilding when the website changes.

## Requirements

- JDK 21 (`JAVA_HOME`) and the Android SDK (`ANDROID_HOME`, with platform 36)
- `dailycheck-release.jks` and `keystore.properties` in this folder. Both are
  git-ignored: **back them up**. Without them you can't build an update that installs
  over the existing app.

## Build

```bash
npm install
node set-url.mjs https://your-app.vercel.app   # only when the site address changes
npm run apk
```

The APK is written to `android/app/build/outputs/apk/release/app-release.apk`.
Copy it to your phone and open it to install (allow "Install unknown apps" when asked).

To ship an update, raise `versionCode` in `android/app/build.gradle` before building.
