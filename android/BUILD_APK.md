# Build Android APK from command line

## Debug APK (no signing setup)

```bash
cd android
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk
```

## Release APK (signed, for distribution)

### 1. Create a keystore (one-time)

From the **project root** (inmaculada-music):

```bash
keytool -genkeypair -v -keystore android/app/release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias inmaculada-music
```

Use a strong password and remember it. You’ll be asked for name/organization; any value is fine.

### 2. Create keystore.properties

From the **project root**:

```bash
cd android
cp keystore.properties.example keystore.properties
```

Edit `keystore.properties` and set your real passwords:

```properties
storeFile=release-key.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=inmaculada-music
keyPassword=YOUR_KEY_PASSWORD
```

(Use the same passwords you set when creating the keystore.)

### 3. Build release APK

From the **project root**:

```bash
npm run build
npm run cap:sync
cd android
./gradlew assembleRelease
```

Signed APK path:

```
android/app/build/outputs/apk/release/app-release.apk
```

### 4. Install on a device

```bash
adb install -r app/build/outputs/apk/release/app-release.apk
```

---

**Note:** Keep `release-key.jks` and `keystore.properties` safe and never commit them. They are already in `.gitignore`.
