#!/bin/bash
#
# APK Analysis Script for Tokyo Predictor Roulette
# Analyzes Android APK files for debugging and verification
#
# Usage: ./scripts/analyze_apk.sh <path-to-apk>
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if APK path is provided
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: No APK file specified${NC}"
    echo "Usage: $0 <path-to-apk>"
    exit 1
fi

APK_PATH="$1"

# Check if APK file exists
if [ ! -f "$APK_PATH" ]; then
    echo -e "${RED}Error: APK file not found: $APK_PATH${NC}"
    exit 1
fi

echo -e "${GREEN}=== Tokyo Predictor Roulette - APK Analysis ===${NC}"
echo -e "APK: $APK_PATH"
echo ""

# Create output directory
OUTPUT_DIR="./output/apk-analysis-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUTPUT_DIR"
echo -e "${GREEN}Output directory: $OUTPUT_DIR${NC}"
echo ""

# Check for required tools
check_tool() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${YELLOW}Warning: $1 not found. Some analysis may be skipped.${NC}"
        return 1
    fi
    return 0
}

# Basic APK information
echo -e "${GREEN}[1/6] Basic APK Information${NC}"
if check_tool "unzip"; then
    unzip -l "$APK_PATH" > "$OUTPUT_DIR/contents.txt"
    echo "✓ APK contents extracted"
    
    # Count files
    FILE_COUNT=$(unzip -l "$APK_PATH" | tail -n 1 | awk '{print $2}')
    echo "  Total files: $FILE_COUNT"
else
    echo "✗ Skipped (unzip not available)"
fi
echo ""

# Extract APK metadata
echo -e "${GREEN}[2/6] APK Metadata${NC}"
if check_tool "aapt"; then
    aapt dump badging "$APK_PATH" > "$OUTPUT_DIR/metadata.txt" 2>/dev/null || true
    
    # Extract key information
    PACKAGE=$(aapt dump badging "$APK_PATH" 2>/dev/null | grep "package:" | sed "s/.*name='\([^']*\)'.*/\1/")
    VERSION=$(aapt dump badging "$APK_PATH" 2>/dev/null | grep "versionName" | sed "s/.*versionName='\([^']*\)'.*/\1/")
    
    if [ -n "$PACKAGE" ]; then
        echo "  Package: $PACKAGE"
    fi
    if [ -n "$VERSION" ]; then
        echo "  Version: $VERSION"
    fi
    echo "✓ Metadata extracted"
elif check_tool "apkanalyzer"; then
    apkanalyzer manifest print "$APK_PATH" > "$OUTPUT_DIR/manifest.xml" 2>/dev/null || true
    echo "✓ Manifest extracted"
else
    echo "✗ Skipped (aapt/apkanalyzer not available)"
fi
echo ""

# Verify APK signature
echo -e "${GREEN}[3/6] APK Signature Verification${NC}"
if check_tool "apksigner"; then
    apksigner verify --verbose "$APK_PATH" > "$OUTPUT_DIR/signature.txt" 2>&1
    if [ $? -eq 0 ]; then
        echo "✓ APK signature is valid"
    else
        echo -e "${RED}✗ APK signature verification failed${NC}"
    fi
elif check_tool "jarsigner"; then
    jarsigner -verify -verbose "$APK_PATH" > "$OUTPUT_DIR/signature.txt" 2>&1
    if [ $? -eq 0 ]; then
        echo "✓ APK signature is valid (jarsigner)"
    else
        echo -e "${YELLOW}⚠ Signature verification inconclusive${NC}"
    fi
else
    echo "✗ Skipped (apksigner/jarsigner not available)"
fi
echo ""

# Extract and decompile DEX files
echo -e "${GREEN}[4/6] DEX Analysis${NC}"
if check_tool "unzip"; then
    # Extract DEX files
    unzip -q "$APK_PATH" "*.dex" -d "$OUTPUT_DIR/dex" 2>/dev/null || true
    DEX_COUNT=$(find "$OUTPUT_DIR/dex" -name "*.dex" 2>/dev/null | wc -l)
    echo "  DEX files found: $DEX_COUNT"
    
    if [ "$DEX_COUNT" -gt 0 ]; then
        echo "✓ DEX files extracted"
    fi
else
    echo "✗ Skipped"
fi
echo ""

# Check for native libraries
echo -e "${GREEN}[5/6] Native Libraries${NC}"
if check_tool "unzip"; then
    unzip -l "$APK_PATH" | grep "lib/" > "$OUTPUT_DIR/native-libs.txt" 2>/dev/null || true
    LIB_COUNT=$(unzip -l "$APK_PATH" | grep -c "lib/" || echo "0")
    echo "  Native libraries: $LIB_COUNT"
    
    if [ "$LIB_COUNT" -gt 0 ]; then
        # List architectures
        ARCHS=$(unzip -l "$APK_PATH" | grep "lib/" | awk '{print $4}' | cut -d'/' -f2 | sort -u)
        echo "  Architectures: $(echo $ARCHS | tr '\n' ' ')"
    fi
    echo "✓ Native libraries analyzed"
else
    echo "✗ Skipped"
fi
echo ""

# File size analysis
echo -e "${GREEN}[6/6] Size Analysis${NC}"
APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
echo "  APK size: $APK_SIZE"

if check_tool "unzip"; then
    # Analyze component sizes
    echo "  Component breakdown:" > "$OUTPUT_DIR/size-breakdown.txt"
    unzip -l "$APK_PATH" | grep "\.dex$" | awk '{sum+=$1} END {print "  DEX files: " sum " bytes"}' >> "$OUTPUT_DIR/size-breakdown.txt"
    unzip -l "$APK_PATH" | grep "\.so$" | awk '{sum+=$1} END {print "  Native libs: " sum " bytes"}' >> "$OUTPUT_DIR/size-breakdown.txt"
    unzip -l "$APK_PATH" | grep "resources.arsc" | awk '{print "  Resources: " $1 " bytes"}' >> "$OUTPUT_DIR/size-breakdown.txt"
    
    cat "$OUTPUT_DIR/size-breakdown.txt"
    echo "✓ Size breakdown complete"
else
    echo "✗ Skipped"
fi
echo ""

# Generate summary report
echo -e "${GREEN}=== Analysis Complete ===${NC}"
echo "Results saved to: $OUTPUT_DIR"
echo ""
echo "Generated files:"
ls -1 "$OUTPUT_DIR"
echo ""

# Create summary
SUMMARY_FILE="$OUTPUT_DIR/SUMMARY.txt"
{
    echo "Tokyo Predictor Roulette - APK Analysis Summary"
    echo "================================================"
    echo ""
    echo "APK: $APK_PATH"
    echo "Analysis Date: $(date)"
    echo "APK Size: $APK_SIZE"
    echo ""
    echo "Package: ${PACKAGE:-N/A}"
    echo "Version: ${VERSION:-N/A}"
    echo ""
    echo "Files in APK: ${FILE_COUNT:-N/A}"
    echo "DEX files: ${DEX_COUNT:-N/A}"
    echo "Native libraries: ${LIB_COUNT:-N/A}"
    echo ""
    echo "For detailed analysis, see individual files in this directory."
} > "$SUMMARY_FILE"

echo -e "${GREEN}Summary saved to: $SUMMARY_FILE${NC}"
echo ""
echo -e "${YELLOW}Note: Install Android SDK Build Tools for complete analysis${NC}"
echo "  - aapt: APK metadata extraction"
echo "  - apksigner: Signature verification"
echo "  - apkanalyzer: Advanced analysis"
