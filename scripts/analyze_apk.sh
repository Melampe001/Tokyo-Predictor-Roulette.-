#!/bin/bash
#
# APK Analysis Script for Tokyo Predictor Roulette
# 
# This script analyzes Android APK files for:
# - Package information
# - Permissions
# - Activities and services
# - File structure
# - Basic security checks
#
# Requirements:
# - aapt (Android Asset Packaging Tool) from Android SDK
# - unzip
# - openssl (optional, for certificate analysis)
#
# Usage: ./analyze_apk.sh <path-to-apk>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if APK path is provided
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: No APK file provided${NC}"
    echo "Usage: $0 <path-to-apk>"
    exit 1
fi

APK_FILE="$1"

# Verify APK file exists
if [ ! -f "$APK_FILE" ]; then
    echo -e "${RED}Error: APK file not found: $APK_FILE${NC}"
    exit 1
fi

# Check for required tools
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${YELLOW}Warning: $1 not found. Some features may be limited.${NC}"
        return 1
    fi
    return 0
}

echo -e "${BLUE}=== Tokyo Predictor APK Analysis ===${NC}\n"
echo -e "Analyzing: ${GREEN}$APK_FILE${NC}\n"

# Basic file info
echo -e "${BLUE}--- File Information ---${NC}"
ls -lh "$APK_FILE"
echo ""

# File hash (for integrity verification)
if check_tool md5sum; then
    echo -e "${BLUE}--- File Hash (MD5) ---${NC}"
    md5sum "$APK_FILE"
    echo ""
fi

if check_tool sha256sum; then
    echo -e "${BLUE}--- File Hash (SHA256) ---${NC}"
    sha256sum "$APK_FILE"
    echo ""
fi

# Extract APK to temporary directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo -e "${BLUE}--- Extracting APK ---${NC}"
unzip -q "$APK_FILE" -d "$TEMP_DIR"
echo "Extracted to: $TEMP_DIR"
echo ""

# Directory structure
echo -e "${BLUE}--- APK Structure ---${NC}"
tree -L 2 "$TEMP_DIR" 2>/dev/null || find "$TEMP_DIR" -maxdepth 2 -type d
echo ""

# Package information (using aapt if available)
if check_tool aapt; then
    echo -e "${BLUE}--- Package Information ---${NC}"
    aapt dump badging "$APK_FILE" | grep -E "package:|sdkVersion:|targetSdkVersion:|application-label:"
    echo ""

    echo -e "${BLUE}--- Permissions ---${NC}"
    aapt dump permissions "$APK_FILE"
    echo ""

    echo -e "${BLUE}--- Activities ---${NC}"
    aapt dump badging "$APK_FILE" | grep -E "^launchable-activity:"
    echo ""

    echo -e "${BLUE}--- Services ---${NC}"
    aapt dump badging "$APK_FILE" | grep -E "^service:"
    echo ""
else
    echo -e "${YELLOW}aapt not available. Install Android SDK build-tools for detailed analysis.${NC}"
    echo ""
fi

# Check for AndroidManifest.xml (binary format)
if [ -f "$TEMP_DIR/AndroidManifest.xml" ]; then
    echo -e "${BLUE}--- AndroidManifest.xml Found ---${NC}"
    echo "Note: AndroidManifest.xml is in binary format. Use aapt or apktool to decode."
    echo ""
fi

# Check for native libraries
if [ -d "$TEMP_DIR/lib" ]; then
    echo -e "${BLUE}--- Native Libraries ---${NC}"
    find "$TEMP_DIR/lib" -name "*.so" | head -20
    echo ""
fi

# Check for resources
if [ -d "$TEMP_DIR/res" ]; then
    echo -e "${BLUE}--- Resource Directories ---${NC}"
    ls -1 "$TEMP_DIR/res" | head -20
    echo ""
fi

# Check for assets
if [ -d "$TEMP_DIR/assets" ]; then
    echo -e "${BLUE}--- Assets ---${NC}"
    find "$TEMP_DIR/assets" -type f | head -20
    echo ""
fi

# DEX files analysis
echo -e "${BLUE}--- DEX Files ---${NC}"
find "$TEMP_DIR" -name "*.dex" -exec ls -lh {} \;
echo ""

# Certificate information
if [ -f "$TEMP_DIR/META-INF/CERT.RSA" ] || [ -f "$TEMP_DIR/META-INF/CERT.DSA" ]; then
    if check_tool openssl; then
        echo -e "${BLUE}--- Certificate Information ---${NC}"
        for cert in "$TEMP_DIR/META-INF/CERT."*; do
            if [ -f "$cert" ]; then
                echo "Analyzing: $(basename $cert)"
                openssl pkcs7 -inform DER -in "$cert" -noout -print_certs -text | \
                    grep -E "Subject:|Issuer:|Not Before|Not After |SHA256 Fingerprint"
                echo ""
            fi
        done
    fi
fi

# Security checks
echo -e "${BLUE}--- Basic Security Checks ---${NC}"

# Check for debuggable flag
if check_tool aapt; then
    if aapt dump badging "$APK_FILE" | grep -q "application-debuggable"; then
        echo -e "${RED}⚠ WARNING: App is debuggable${NC}"
    else
        echo -e "${GREEN}✓ App is not debuggable${NC}"
    fi
fi

# Check for common security issues
echo ""
echo -e "${BLUE}--- File Listing (size > 1MB) ---${NC}"
find "$TEMP_DIR" -type f -size +1M -exec ls -lh {} \; | head -10
echo ""

# Summary
echo -e "${BLUE}=== Analysis Complete ===${NC}"
echo -e "${GREEN}APK analysis finished successfully${NC}"
echo ""
echo "For more detailed analysis, consider using:"
echo "  - apktool d $APK_FILE  (decompile APK)"
echo "  - jadx $APK_FILE       (decompile to Java)"
echo "  - MobSF                (comprehensive mobile security analysis)"
