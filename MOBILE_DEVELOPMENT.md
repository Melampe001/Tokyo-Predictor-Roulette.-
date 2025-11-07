# Mobile Development Setup Guide

This guide covers setup instructions for developing and testing the Tokyo Predictor on mobile devices.

## Table of Contents
- [React Native Development](#react-native-development)
- [Termux Setup (Android)](#termux-setup-android)
- [Flutter Development](#flutter-development)
- [APK Analysis](#apk-analysis)

## React Native Development

### Prerequisites
- Node.js 18+ 
- npm 9+
- Java Development Kit (JDK) 17
- Android SDK
- Android Studio (recommended) or Android command-line tools

### Local Development

#### Run on Android Device/Emulator
```bash
# Install dependencies
npm install

# Start Metro bundler
npx react-native start

# In another terminal, run on Android
npx react-native run-android
```

#### Build Release APK
```bash
# Navigate to android directory
cd android

# Build release APK
./gradlew assembleRelease

# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

### CI/CD Build
The GitHub Actions workflow `.github/workflows/react-native-android.yml` automatically builds release APKs on push to main or pull requests.

## Termux Setup (Android)

[Termux](https://termux.dev/) allows you to run a Linux environment directly on Android devices, perfect for mobile development and testing.

### Installation

1. Install Termux from [F-Droid](https://f-droid.org/packages/com.termux/) (recommended) or Google Play Store

2. Update packages:
```bash
pkg update && pkg upgrade
```

3. Install essential tools:
```bash
# Install Termux API for system integration
pkg install termux-api

# Install development tools
pkg install nodejs git openssh

# Install build tools (optional, for building native modules)
pkg install clang make python
```

### SSH Key Setup

Generate and copy your SSH key for GitHub authentication:

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key to clipboard (requires termux-api installed earlier)
termux-clipboard-set "$(cat ~/.ssh/id_ed25519.pub)"

# Or display it to copy manually
cat ~/.ssh/id_ed25519.pub
```

Then add the public key to your GitHub account:
1. Go to GitHub → Settings → SSH and GPG keys
2. Click "New SSH key"
3. Paste the key from clipboard
4. Save

### Clone and Setup Project

```bash
# Clone repository
git clone git@github.com:Melampe001/Tokyo-Predictor-Roulette.-.git
cd Tokyo-Predictor-Roulette.-

# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test
```

### Useful Termux Commands

```bash
# Access device storage
termux-setup-storage

# View clipboard content
termux-clipboard-get

# Set clipboard content
termux-clipboard-set "text to copy"

# Get device info
termux-info

# Access files in shared storage
cd ~/storage/shared
```

## Flutter Development

### Prerequisites
- Flutter SDK 3.24.0+
- Android SDK
- Dart SDK (included with Flutter)

### Commands

```bash
# Install dependencies
flutter pub get

# Run on connected device
flutter run

# Build release APK
flutter build apk --release

# APK will be at: build/app/outputs/flutter-apk/app-release.apk
```

## APK Analysis

The repository includes a comprehensive APK analysis script:

```bash
# Make script executable
chmod +x scripts/analyze_apk.sh

# Analyze an APK
./scripts/analyze_apk.sh path/to/app.apk
```

The script provides:
- Package information and metadata
- Permissions analysis
- Activities and services listing
- File structure and size analysis
- Certificate verification
- Security checks

### Testing APK Analysis

```bash
# Run APK analysis tests
npm run test:apk
```

## Troubleshooting

### Termux Issues

**Permission denied when running scripts:**
```bash
chmod +x script-name.sh
```

**Storage access issues:**
```bash
termux-setup-storage
# Grant storage permission when prompted
```

**Network issues:**
```bash
# Reset DNS
pkg install dnsutils
```

### React Native Issues

**Metro bundler issues:**
```bash
# Clear cache
npx react-native start --reset-cache
```

**Build failures:**
```bash
# Clean Gradle cache
cd android
./gradlew clean
cd ..
```

### Flutter Issues

**Dependency issues:**
```bash
flutter clean
flutter pub get
```

**Build cache issues:**
```bash
flutter clean
rm -rf build/
flutter build apk
```

## Additional Resources

- [Termux Wiki](https://wiki.termux.com/)
- [React Native Documentation](https://reactnative.dev/docs/environment-setup)
- [Flutter Documentation](https://docs.flutter.dev/)
- [Android Developer Guide](https://developer.android.com/)

## Contributing

When developing on mobile, ensure:
- All tests pass before committing
- APK builds successfully
- No security vulnerabilities introduced
- Code follows project style guidelines

For mobile-specific changes, test on both physical devices and emulators when possible.
