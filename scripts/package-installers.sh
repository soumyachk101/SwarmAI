#!/bin/bash
set -e

# Define root and releases directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASES_DIR="$PROJECT_ROOT/releases"

echo "📦 Creating easy release folders in: $RELEASES_DIR"
mkdir -p "$RELEASES_DIR/macOS"
mkdir -p "$RELEASES_DIR/windows"
mkdir -p "$RELEASES_DIR/android"

# 1. Check for macOS DMG
APP_SRC="$PROJECT_ROOT/desktop/src-tauri/target/release/bundle/macos/SwarmAI.app"
DMG_SRC="$PROJECT_ROOT/desktop/src-tauri/target/release/bundle/dmg/SwarmAI_0.1.0_aarch64.dmg"

if [ -d "$APP_SRC" ]; then
    echo "🍎 Packaging macOS DMG from SwarmAI.app..."
    TMP_DMG_DIR=$(mktemp -d)
    cp -R "$APP_SRC" "$TMP_DMG_DIR/"
    ln -s /Applications "$TMP_DMG_DIR/Applications"
    mkdir -p "$(dirname "$DMG_SRC")"
    hdiutil create -volname "SwarmAI" -srcfolder "$TMP_DMG_DIR" -ov -format UDZO "$DMG_SRC"
    rm -rf "$TMP_DMG_DIR"
    cp -f "$DMG_SRC" "$RELEASES_DIR/macOS/SwarmAI.dmg"
    cp -f "$DMG_SRC" "$RELEASES_DIR/macOS/SwarmAI_0.1.0_aarch64.dmg"
    mkdir -p "$PROJECT_ROOT/web/releases/macOS"
    cp -f "$DMG_SRC" "$PROJECT_ROOT/web/releases/macOS/SwarmAI.dmg"
    echo "✅ macOS DMG ready at: releases/macOS/SwarmAI.dmg and web/releases/macOS/SwarmAI.dmg"
elif [ -f "$DMG_SRC" ]; then
    echo "🍎 Copying existing macOS DMG installer..."
    cp -f "$DMG_SRC" "$RELEASES_DIR/macOS/SwarmAI.dmg"
    cp -f "$DMG_SRC" "$RELEASES_DIR/macOS/SwarmAI_0.1.0_aarch64.dmg"
    mkdir -p "$PROJECT_ROOT/web/releases/macOS"
    cp -f "$DMG_SRC" "$PROJECT_ROOT/web/releases/macOS/SwarmAI.dmg"
    echo "✅ macOS DMG ready at: releases/macOS/SwarmAI.dmg and web/releases/macOS/SwarmAI.dmg"
fi

# 2. Check for Windows NSIS / MSI
EXE_SRC=$(find "$PROJECT_ROOT/desktop/src-tauri/target/release/bundle/nsis" -name "*.exe" 2>/dev/null | head -n 1 || true)
MSI_SRC=$(find "$PROJECT_ROOT/desktop/src-tauri/target/release/bundle/msi" -name "*.msi" 2>/dev/null | head -n 1 || true)
if [ -n "$EXE_SRC" ] && [ -f "$EXE_SRC" ]; then
    cp -f "$EXE_SRC" "$RELEASES_DIR/windows/SwarmAI_Setup.exe"
    echo "✅ Windows EXE ready at: releases/windows/SwarmAI_Setup.exe"
fi
if [ -n "$MSI_SRC" ] && [ -f "$MSI_SRC" ]; then
    cp -f "$MSI_SRC" "$RELEASES_DIR/windows/SwarmAI_Setup.msi"
    echo "✅ Windows MSI ready at: releases/windows/SwarmAI_Setup.msi"
fi

# 3. Check for Android APK
APK_SRC=$(find "$PROJECT_ROOT/desktop/src-tauri/gen/android" -name "*release*.apk" -o -name "*app*.apk" 2>/dev/null | head -n 1 || true)
if [ -n "$APK_SRC" ] && [ -f "$APK_SRC" ]; then
    cp -f "$APK_SRC" "$RELEASES_DIR/android/SwarmAI.apk"
    echo "✅ Android APK ready at: releases/android/SwarmAI.apk"
fi

# Create a clean release README
cat << 'EOF' > "$RELEASES_DIR/README.md"
# 📦 SwarmAI Distribution Releases

Direct download folder for ready-to-use SwarmAI installers:

### 🍎 macOS Installer (Apple Silicon & Intel)
- **File**: `releases/macOS/SwarmAI.dmg`
- **Install**: Double-click `SwarmAI.dmg` and drag `SwarmAI` into Applications.

### 🪟 Windows Installer (.exe & .msi)
- **Folder**: `releases/windows/`
- **Cloud Build**: Built automatically on push via GitHub Actions.
- **Install**: Double-click `SwarmAI_Setup.exe`.

### 📱 Android (.apk)
- **Folder**: `releases/android/`
- **Install**: Sideload `SwarmAI.apk` on your Android device.

---
*To re-bundle and update this folder, run `pnpm package` from project root.*
EOF

echo ""
echo "🎉 All release installers organized in: $RELEASES_DIR"
ls -lh "$RELEASES_DIR"
ls -lh "$RELEASES_DIR/macOS"
