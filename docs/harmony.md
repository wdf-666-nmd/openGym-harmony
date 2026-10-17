# openGym on HarmonyOS

The HarmonyOS port rides on capacitor-harmony:
the same React web bundle the Android/iOS apps ship runs inside an ArkWeb
WebView, with native features bridged to ArkTS plugins.

## Build

```bash
# from frontend/, on an ASCII-only path (hvigor rejects non-ASCII cwd)
node scripts/build-harmony.mjs
```

The chain: `VITE_MOBILE=1 vite build` → stage catalogue media →
`cap sync harmony` → `check-mobile-bundle` → `hvigor assembleHap` (debug).
Output: `harmony/entry/build/default/outputs/default/entry-default-unsigned.hap`.

Requirements:

- Node.js ≥ 20.12 on PATH (the web toolchain needs `util.styleText`)
- DevEco Studio (`DEVECO_HOME`, default `C:/Program Files/Huawei/DevEco Studio`)
  for its SDK (HarmonyOS 6.0.0 / API 20), hvigor and its bundled node 18
- `@ohos/hvigor-ohos-plugin` 6.20.0 vendored at
  `harmony/node_modules/@ohos/` (it is not on npm or ohpm; a fresh clone gets
  it from `~/.hvigor/project_caches/*/workspace` after one DevEco GUI build,
  or copy it from another machine — see the commit that added it)

Environment quirks this setup works around (all Windows-specific):

- `hvigorw.bat` and `ohpm.bat` misbehave under some shells; the build script
  calls `hvigorw.js` directly with DevEco's node
- the npm-script `VITE_MOBILE=1 …` prefix is POSIX-only; the script passes
  the env explicitly
- hvigor needs `~/.npmrc` to exist (any registry line works)

## What is bridged

| Web capability | HarmonyOS implementation |
|---|---|
| `@capacitor/filesystem` | built-in plugin (app sandbox dirs) |
| `@capacitor/app` (state, back button) | built-in plugin |
| `Share.share({ title, url })` | `systemShare` sheet on the `Filesystem.getUri` result |
| `LocalNotifications.schedule/cancel/permissions` | `reminderAgentManager` calendars, one per future date, `notificationId` = Capacitor id |
| `Print.printHtml({ html, name })` | HTML written to cacheDir + share sheet (no public print API; the sheet's save/print abilities cover it) |
| Android-only plugins (RestAlert, HealthConnect, SystemBars, Install, in-app APK update) | stay off — `isAndroid()` is false on HarmonyOS, and Settings hides the update row |

Not bridged (graceful degradation, no crash paths): `CapacitorHttp` (the
Coach's provider fetches — the Coach panel reports the failure), MLKit
barcode scanning, secure-storage (in-memory fallback already in the app).

## Signing & sideloading

The build produces an **unsigned** HAP. To install on a device:

1. Open `frontend/harmony` in DevEco Studio → File → Project Structure →
   Signing Configs → tick "Automatically generate signature" (needs a Huawei
   developer account logged in) — this fills `build-profile.json5`'s
   `signingConfigs` locally; **never commit that file with real keys**.
2. Rebuild (GUI, or the same hvigor command) — the output becomes
   `entry-default-signed.hap`.
3. Sideload: `hdc install <path-to-signed.hap>` over USB, or copy the file to
   the phone and open it (the system installer needs "install from unknown
   sources" allowed for your file manager).

Publishing to AppGallery is out of scope here; that path needs a proper
release certificate and review.

## License note (AGPL-3.0)

openGym is AGPL-3.0. Anyone you give the HAP to must also get the source:
point them at your fork (the repo that built it) alongside the binary. The
HarmonyOS plugins added here inherit the same license.
