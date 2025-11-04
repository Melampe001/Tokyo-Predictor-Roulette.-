#!/bin/bash
#
# APK Analysis Script
# Analyzes Android APK files for Tokyo Predictor Roulette
#
# Usage: ./scripts/analyze_apk.sh <path-to-apk>
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/../output/apk-analysis"

# Print banner
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Tokyo Predictor APK Analysis Tool${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if APK path is provided
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: No APK file specified${NC}"
    echo "Usage: $0 <path-to-apk>"
    exit 1
fi

APK_PATH="$1"

# Check if APK file exists
if [ ! -f "$APK_PATH" ]; then
    echo -e "${RED}Error: APK file not found: ${APK_PATH}${NC}"
    exit 1
fi

echo -e "${GREEN}✓ APK file found: ${APK_PATH}${NC}"

# Create output directory
mkdir -p "$OUTPUT_DIR"
echo -e "${GREEN}✓ Output directory: ${OUTPUT_DIR}${NC}"

# Get APK filename
APK_NAME=$(basename "$APK_PATH")
APK_BASE="${APK_NAME%.apk}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ANALYSIS_FILE="${OUTPUT_DIR}/${APK_BASE}_analysis_${TIMESTAMP}.txt"

# Start analysis
echo ""
echo -e "${YELLOW}Starting analysis...${NC}"
echo ""

# Create analysis report
cat > "$ANALYSIS_FILE" <<EOF
========================================
Tokyo Predictor APK Analysis Report
========================================
Generated: $(date)
APK File: $APK_NAME
APK Path: $APK_PATH

EOF

# 1. Basic APK Information
echo -e "${BLUE}[1/6] Extracting basic information...${NC}"
echo "1. BASIC INFORMATION" >> "$ANALYSIS_FILE"
echo "--------------------" >> "$ANALYSIS_FILE"

if command -v aapt &> /dev/null; then
    aapt dump badging "$APK_PATH" >> "$ANALYSIS_FILE" 2>&1 || echo "Could not extract APK info" >> "$ANALYSIS_FILE"
elif command -v apktool &> /dev/null; then
    apktool d -f -o "${OUTPUT_DIR}/${APK_BASE}_extracted" "$APK_PATH" >> "$ANALYSIS_FILE" 2>&1 || echo "Could not extract APK" >> "$ANALYSIS_FILE"
else
    echo "aapt or apktool not found - skipping detailed analysis" >> "$ANALYSIS_FILE"
    echo -e "${YELLOW}⚠ aapt/apktool not found - limited analysis${NC}"
fi

echo "" >> "$ANALYSIS_FILE"

# 2. File size and structure
echo -e "${BLUE}[2/6] Analyzing file structure...${NC}"
echo "2. FILE INFORMATION" >> "$ANALYSIS_FILE"
echo "-------------------" >> "$ANALYSIS_FILE"

FILE_SIZE=$(ls -lh "$APK_PATH" | awk '{print $5}')
echo "File size: $FILE_SIZE" >> "$ANALYSIS_FILE"

if command -v unzip &> /dev/null; then
    echo "" >> "$ANALYSIS_FILE"
    echo "APK Contents:" >> "$ANALYSIS_FILE"
    unzip -l "$APK_PATH" | head -50 >> "$ANALYSIS_FILE"
fi

echo "" >> "$ANALYSIS_FILE"

# 3. Permissions
echo -e "${BLUE}[3/6] Extracting permissions...${NC}"
echo "3. PERMISSIONS" >> "$ANALYSIS_FILE"
echo "--------------" >> "$ANALYSIS_FILE"

if command -v aapt &> /dev/null; then
    aapt dump permissions "$APK_PATH" >> "$ANALYSIS_FILE" 2>&1 || echo "Could not extract permissions" >> "$ANALYSIS_FILE"
else
    echo "aapt not found - skipping permissions analysis" >> "$ANALYSIS_FILE"
fi

echo "" >> "$ANALYSIS_FILE"

# 4. Certificate information
echo -e "${BLUE}[4/6] Checking certificate...${NC}"
echo "4. CERTIFICATE INFORMATION" >> "$ANALYSIS_FILE"
echo "-------------------------" >> "$ANALYSIS_FILE"

if command -v keytool &> /dev/null; then
    # Extract certificate
    unzip -p "$APK_PATH" META-INF/*.RSA 2>/dev/null | keytool -printcert >> "$ANALYSIS_FILE" 2>&1 || echo "Could not extract certificate" >> "$ANALYSIS_FILE"
else
    echo "keytool not found - skipping certificate analysis" >> "$ANALYSIS_FILE"
fi

echo "" >> "$ANALYSIS_FILE"

# 5. Security analysis
echo -e "${BLUE}[5/6] Security analysis...${NC}"
echo "5. SECURITY ANALYSIS" >> "$ANALYSIS_FILE"
echo "--------------------" >> "$ANALYSIS_FILE"

echo "Signature verification:" >> "$ANALYSIS_FILE"
if command -v jarsigner &> /dev/null; then
    jarsigner -verify -verbose -certs "$APK_PATH" >> "$ANALYSIS_FILE" 2>&1 || echo "Signature verification failed" >> "$ANALYSIS_FILE"
else
    echo "jarsigner not found - skipping signature verification" >> "$ANALYSIS_FILE"
fi

echo "" >> "$ANALYSIS_FILE"

# 6. Checksums
echo -e "${BLUE}[6/6] Calculating checksums...${NC}"
echo "6. CHECKSUMS" >> "$ANALYSIS_FILE"
echo "------------" >> "$ANALYSIS_FILE"

if command -v md5sum &> /dev/null; then
    echo -n "MD5: " >> "$ANALYSIS_FILE"
    md5sum "$APK_PATH" | awk '{print $1}' >> "$ANALYSIS_FILE"
fi

if command -v sha256sum &> /dev/null; then
    echo -n "SHA256: " >> "$ANALYSIS_FILE"
    sha256sum "$APK_PATH" | awk '{print $1}' >> "$ANALYSIS_FILE"
fi

# Footer
echo "" >> "$ANALYSIS_FILE"
echo "========================================" >> "$ANALYSIS_FILE"
echo "Analysis completed: $(date)" >> "$ANALYSIS_FILE"
echo "========================================" >> "$ANALYSIS_FILE"

# Complete
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Analysis complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Report saved to: ${BLUE}${ANALYSIS_FILE}${NC}"
echo ""

# Print summary
echo -e "${YELLOW}Summary:${NC}"
echo "  APK: $APK_NAME"
echo "  Size: $FILE_SIZE"
echo "  Report: $ANALYSIS_FILE"
echo ""

# Offer to view report
read -p "View report now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    less "$ANALYSIS_FILE"
fi

exit 0
