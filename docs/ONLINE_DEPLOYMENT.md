# Quản lý kho E · Online deployment

## GitHub Pages PWA

The `Deploy PWA` workflow builds the offline-first SPA from
`feature/online-sync` and deploys `native-www` to GitHub Pages. Repository
Actions variables required by both Android and PWA builds:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

In repository Settings → Pages, select **GitHub Actions** as the source. The
expected URL is `https://lekhaccong.github.io/Congviechangngay/`.

On iPhone, open that URL in Safari, use Share → Add to Home Screen, then launch
the installed icon once while online. IndexedDB and the service worker preserve
offline operation; Supabase sync resumes when connectivity returns.

## Stable Android signing

Generate one release keystore once and keep an offline backup. Never commit it
to the repository. Example on a trusted computer with Java installed:

```sh
keytool -genkeypair -v \
  -keystore quan-ly-kho-e.jks \
  -alias quan-ly-kho-e \
  -keyalg RSA -keysize 2048 -validity 10000

base64 -w 0 quan-ly-kho-e.jks > quan-ly-kho-e.jks.base64
```

Create these repository Actions secrets:

- `ANDROID_KEYSTORE_BASE64`: contents of `quan-ly-kho-e.jks.base64`
- `ANDROID_KEYSTORE_PASSWORD`: keystore password
- `ANDROID_KEY_ALIAS`: `quan-ly-kho-e`
- `ANDROID_KEY_PASSWORD`: key password

The build workflow produces a signed release when all four secrets exist and
verifies its certificate before upload. If any secret is missing, it clearly
warns and produces the old rotating debug build as a fallback.

The first release-signed APK cannot update an already installed debug-signed
APK. Back up app data, uninstall the debug build once, install the signed build,
and restore. Every later build signed with the same keystore installs in place.
