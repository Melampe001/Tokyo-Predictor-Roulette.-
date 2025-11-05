/**
 * APK Analysis Script Tests
 * 
 * Tests for the scripts/analyze_apk.sh script
 * Validates APK analysis functionality
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import archiver from 'archiver';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRIPT_PATH = path.join(__dirname, '..', 'scripts', 'analyze_apk.sh');
const TEST_DIR = path.join(__dirname, '..', 'test-apks');

describe('APK Analysis Script', () => {
  
  beforeAll(() => {
    // Create test directory if it doesn't exist
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    // Cleanup test directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('Script Validation', () => {
    test('analyze_apk.sh script exists', () => {
      expect(fs.existsSync(SCRIPT_PATH)).toBe(true);
    });

    test('analyze_apk.sh is executable', () => {
      const stats = fs.statSync(SCRIPT_PATH);
      const isExecutable = (stats.mode & 0o111) !== 0;
      expect(isExecutable).toBe(true);
    });

    test('analyze_apk.sh has shebang', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      expect(content.startsWith('#!/bin/bash')).toBe(true);
    });
  });

  describe('Script Execution', () => {
    test('shows usage when no arguments provided', async () => {
      try {
        await execAsync(`bash ${SCRIPT_PATH}`, { encoding: 'utf8' });
        // Should not reach here
        fail('Script should exit with error when no APK provided');
      } catch (error) {
        expect(error.code).toBe(1);
        const output = error.stdout + error.stderr;
        expect(output).toContain('No APK file provided');
        expect(output).toContain('Usage:');
      }
    });

    test('shows error when APK file does not exist', async () => {
      const nonExistentAPK = path.join(TEST_DIR, 'nonexistent.apk');
      try {
        await execAsync(`bash ${SCRIPT_PATH} ${nonExistentAPK}`, { encoding: 'utf8' });
        fail('Script should exit with error for non-existent file');
      } catch (error) {
        expect(error.code).toBe(1);
        const output = error.stdout + error.stderr;
        expect(output).toContain('APK file not found');
      }
    });
  });

  describe('Mock APK Analysis', () => {
    let mockAPKPath;

    beforeAll(async () => {
      // Create a mock APK file (which is just a ZIP file)
      mockAPKPath = path.join(TEST_DIR, 'mock-app.apk');
      await createMockAPK(mockAPKPath);
    });

    test('analyzes mock APK file structure', async () => {
      // Run with stderr redirected to /dev/null to ignore certificate warnings
      const { stdout } = await execAsync(`bash ${SCRIPT_PATH} ${mockAPKPath} 2>/dev/null || true`);
      
      // Check that analysis started
      expect(stdout).toContain('Tokyo Predictor APK Analysis');
      expect(stdout).toContain('Analyzing:');
      
      // Check for basic sections
      expect(stdout).toContain('File Information');
      expect(stdout).toContain('Extracting APK');
      expect(stdout).toContain('APK Structure');
      
      // Check for completion
      expect(stdout).toContain('Analysis Complete');
    });

    test('generates file hashes', async () => {
      const { stdout } = await execAsync(`bash ${SCRIPT_PATH} ${mockAPKPath} 2>/dev/null || true`);
      
      // Should generate MD5 hash
      expect(stdout).toContain('File Hash (MD5)');
      expect(stdout).toMatch(/[a-f0-9]{32}/); // MD5 hash format
      
      // Should generate SHA256 hash
      expect(stdout).toContain('File Hash (SHA256)');
      expect(stdout).toMatch(/[a-f0-9]{64}/); // SHA256 hash format
    });

    test('extracts and analyzes APK contents', async () => {
      const { stdout } = await execAsync(`bash ${SCRIPT_PATH} ${mockAPKPath} 2>/dev/null || true`);
      
      // Check that extraction occurred
      expect(stdout).toContain('Extracted to:');
      
      // Should mention AndroidManifest.xml
      expect(stdout).toContain('AndroidManifest.xml');
    });

    test('provides security recommendations', async () => {
      const { stdout } = await execAsync(`bash ${SCRIPT_PATH} ${mockAPKPath} 2>/dev/null || true`);
      
      // Should include security checks section
      expect(stdout).toContain('Basic Security Checks');
      
      // Should mention additional tools for detailed analysis
      expect(stdout).toContain('For more detailed analysis');
      expect(stdout).toContain('apktool');
      expect(stdout).toContain('jadx');
    });
  });

  describe('Script Features', () => {
    test('script includes proper error handling', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      
      // Check for error handling patterns
      expect(content).toContain('set -e'); // Exit on error
      expect(content).toContain('check_tool'); // Tool checking function
      expect(content).toContain('trap'); // Cleanup on exit
    });

    test('script has colored output support', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      
      // Check for color definitions
      expect(content).toContain('RED=');
      expect(content).toContain('GREEN=');
      expect(content).toContain('BLUE=');
      expect(content).toContain('NC='); // No Color
    });

    test('script checks for required tools', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      
      // Should check for tools
      expect(content).toContain('check_tool');
      expect(content).toContain('aapt');
      expect(content).toContain('unzip');
      expect(content).toContain('openssl');
    });
  });
});

/**
 * Creates a mock APK file for testing
 * An APK is essentially a ZIP file with specific structure
 */
async function createMockAPK(outputPath) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    output.on('close', () => {
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add mock AndroidManifest.xml (binary format simulation)
    archive.append(Buffer.from('MOCK_ANDROID_MANIFEST_BINARY_DATA'), { 
      name: 'AndroidManifest.xml' 
    });

    // Add mock META-INF directory with certificate
    archive.append('Signature-Version: 1.0\nCreated-By: Mock\n', { 
      name: 'META-INF/MANIFEST.MF' 
    });
    
    archive.append(Buffer.from('MOCK_CERT_DATA'), { 
      name: 'META-INF/CERT.RSA' 
    });

    // Add mock DEX file
    archive.append(Buffer.from('dex\n035'), { 
      name: 'classes.dex' 
    });

    // Add mock resources directory
    archive.append('', { name: 'res/' });
    archive.append('', { name: 'res/values/' });

    // Add mock assets directory
    archive.append('', { name: 'assets/' });

    // Add mock lib directory with native library
    archive.append(Buffer.from('MOCK_SO_LIB'), { 
      name: 'lib/armeabi-v7a/libmock.so' 
    });

    archive.finalize();
  });
}
