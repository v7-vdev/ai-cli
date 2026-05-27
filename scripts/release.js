import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8'));
const version = pkg.version;

console.log(`\n[Release] Preparing ORK v${version}...`);

const releaseDir = path.join(ROOT_DIR, 'release');
const backupDir = path.join(releaseDir, '.backup');

if (!fs.existsSync(releaseDir)) fs.mkdirSync(releaseDir);
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

const exeName = `ork-v${version}-windows-x64.exe`;
const exePath = path.join(releaseDir, exeName);

// Backup previous release if exists and prune stale backups (cap at 3)
if (fs.existsSync(exePath)) {
    const backupPath = path.join(backupDir, `${exeName}-${Date.now()}.bak`);
    console.log(`[Release] Backing up previous binary to ${backupPath}...`);
    fs.copyFileSync(exePath, backupPath);
}

const backups = fs.readdirSync(backupDir).filter(f => f.endsWith('.bak')).sort((a, b) => {
    const timeA = parseInt(a.split('-').pop() || '0');
    const timeB = parseInt(b.split('-').pop() || '0');
    return timeB - timeA;
});

if (backups.length > 3) {
    for (let i = 3; i < backups.length; i++) {
        fs.unlinkSync(path.join(backupDir, backups[i]));
    }
}

// Generate Reproducibility Manifest
const manifestPath = path.join(releaseDir, 'release-manifest.json');
const manifest = {
    version: version,
    timestamp: new Date().toISOString(),
    node_version: process.version,
    platform: process.platform,
    arch: process.arch
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('[Release] Building TypeScript source...');
execSync('npm run build', { stdio: 'inherit', cwd: ROOT_DIR });

console.log('[Release] Packaging with CAXA...');
// Run caxa to output to releaseDir
const caxaCmd = `npx caxa --input . --output "${exePath}" --exclude ".git" "release" "src" "tests" -- "{{caxa}}/node_modules/.bin/node" "{{caxa}}/dist/index.js"`;
try {
    execSync(caxaCmd, { stdio: 'inherit', cwd: ROOT_DIR });
} catch (e: any) {
    console.error(`[Release] CAXA packaging failed. Are you sure caxa is installed?`);
    process.exit(1);
}

// Generate Checksum
console.log('[Release] Generating SHA256 Checksum...');
const fileBuffer = fs.readFileSync(exePath);
const hashSum = crypto.createHash('sha256');
hashSum.update(fileBuffer);
const hex = hashSum.digest('hex');

const checksumPath = path.join(releaseDir, 'checksums.txt');
let checksumContent = '';
if (fs.existsSync(checksumPath)) {
    checksumContent = fs.readFileSync(checksumPath, 'utf-8');
}

// Update checksums.txt, replace old entry if it exists, or append
const checksumLine = `${hex}  ${exeName}\n`;
const lines = checksumContent.split('\n').filter(l => !l.includes(exeName) && l.trim().length > 0);
lines.push(checksumLine.trim());

fs.writeFileSync(checksumPath, lines.join('\n') + '\n');
console.log(`[Release] Generated Checksum: ${hex}`);
console.log(`\n[Release] Success! ORK v${version} binary is ready at: ${exePath}`);
