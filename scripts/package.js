import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const releaseDir = path.join(rootDir, 'release');

// Read version from package.json
const pkgJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const version = pkgJson.version || '1.0.0';
const outputZip = path.join(releaseDir, `jobhunt-ai-v${version}.zip`);

if (!fs.existsSync(distDir)) {
  console.error('Error: "dist" directory not found. Please run "npm run build" first.');
  process.exit(1);
}

if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

// Get all files & directories inside dist/
const entries = fs.readdirSync(distDir);
if (entries.length === 0) {
  console.error('Error: "dist" directory is empty.');
  process.exit(1);
}

// Remove old zip if present
if (fs.existsSync(outputZip)) {
  fs.unlinkSync(outputZip);
}

try {
  // Use bsdtar (built into Windows 10/11, macOS, and Linux)
  const args = entries.map((e) => `"${e}"`).join(' ');
  execSync(`tar -a -cf "${outputZip}" -C "${distDir}" ${args}`, { stdio: 'inherit' });
} catch {
  // Fallback using direct .NET assembly (independent of Microsoft.PowerShell.Archive module)
  const psCmd = `Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${distDir}', '${outputZip}')`;
  execSync(`powershell -NoProfile -Command "${psCmd}"`, { stdio: 'inherit' });
}

if (fs.existsSync(outputZip)) {
  const stat = fs.statSync(outputZip);
  const sizeKb = (stat.size / 1024).toFixed(1);
  console.log(`\n🎉 Package created successfully!`);
  console.log(`📦 File: release/jobhunt-ai-v${version}.zip (${sizeKb} KB)`);
  console.log(`✨ Ready for Chrome Web Store Developer Dashboard upload.\n`);
} else {
  console.error('Failed to create package zip file.');
  process.exit(1);
}
