# APK Analysis Testing

This document describes the testing infrastructure for the APK analysis functionality.

## Overview

The APK analysis script (`scripts/analyze_apk.sh`) is a comprehensive tool for analyzing Android APK files. This testing suite validates that the script functions correctly and provides the expected analysis features.

## Test Suite

The test suite is located in `test/apk-analysis.test.js` and includes the following test categories:

### 1. Script Validation
- Verifies the script file exists
- Checks that the script is executable
- Validates proper shebang (`#!/bin/bash`)

### 2. Script Execution
- Tests error handling when no APK file is provided
- Tests error handling for non-existent APK files
- Validates usage message display

### 3. Mock APK Analysis
- Creates a mock APK file structure for testing
- Validates complete analysis workflow
- Checks file hash generation (MD5 and SHA256)
- Verifies APK content extraction and structure analysis
- Tests security recommendations

### 4. Script Features
- Validates error handling patterns (`set -e`, `trap`, etc.)
- Checks colored output support
- Verifies tool availability checking

## Running the Tests

```bash
# Run only APK analysis tests
npm test -- test/apk-analysis.test.js

# Run all tests including APK tests
npm test

# Run legacy tests (TokioAI module)
npm run test:legacy
```

## Test Coverage

The test suite covers:
- ✅ Script execution and error handling
- ✅ File extraction and structure analysis
- ✅ Hash generation (MD5, SHA256)
- ✅ Certificate information extraction (with graceful fallback)
- ✅ Security checks and recommendations
- ✅ Tool availability checking (aapt, unzip, openssl)

## Mock APK Structure

The test suite creates a mock APK with the following structure:

```
mock-app.apk (ZIP file)
├── AndroidManifest.xml
├── META-INF/
│   ├── MANIFEST.MF
│   └── CERT.RSA
├── classes.dex
├── res/
│   └── values/
├── assets/
└── lib/
    └── armeabi-v7a/
        └── libmock.so
```

## Script Features Tested

### File Analysis
- File size and basic information
- MD5 and SHA256 hash generation
- ZIP structure extraction

### APK Components
- AndroidManifest.xml detection
- DEX files identification
- Native libraries (`.so` files)
- Resources and assets directories
- Certificate and signing information

### Security Checks
- Debuggable flag detection (requires aapt)
- Certificate validation (with OpenSSL)
- Large file detection
- Basic security recommendations

### Tool Dependencies
The script checks for the following tools and provides helpful warnings if they're missing:
- `aapt` (Android Asset Packaging Tool) - for detailed APK analysis
- `unzip` - for extracting APK contents
- `openssl` - for certificate analysis
- `md5sum` - for file hashing
- `sha256sum` - for file hashing

## Notes

- The test suite uses a mock APK file created with the `archiver` package
- Certificate parsing errors are handled gracefully (non-blocking)
- The script continues analysis even when optional tools like `aapt` are not available
- Test APK files are generated in `test-apks/` directory (excluded from git)

## Recent Improvements

- Fixed certificate parsing to handle invalid certificates gracefully
- Certificate parsing errors no longer cause script to exit prematurely
- Added comprehensive test coverage for all script features
- Improved error message validation in tests
