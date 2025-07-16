#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const VERSION_FILE = 'src/lib/versions.ts';
const PACKAGE_JSON = 'package.json';
const CARGO_TOML = 'worker/rust_ai_core/Cargo.toml';

function updateVersionsFile(newVersion) {
  const content = fs.readFileSync(VERSION_FILE, 'utf8');
  const updatedContent = content
    .replace(/app: '[^']+',/g, `app: '${newVersion}',`)
    .replace(/classicAI: '[^']+',/g, `classicAI: '${newVersion}',`)
    .replace(/mlAI: '[^']+',/g, `mlAI: '${newVersion}',`)
    .replace(/game: '[^']+',/g, `game: '${newVersion}',`);
  fs.writeFileSync(VERSION_FILE, updatedContent);
  console.log(`✅ Updated ${VERSION_FILE} to version ${newVersion}`);
}

function updatePackageJson(newVersion) {
  const content = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  content.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(content, null, 2) + '\n');
  console.log(`✅ Updated ${PACKAGE_JSON} to version ${newVersion}`);
}

function updateCargoToml(newVersion) {
  const content = fs.readFileSync(CARGO_TOML, 'utf8');
  const updatedContent = content.replace(/version = "[^"]+"/g, `version = "${newVersion}"`);
  fs.writeFileSync(CARGO_TOML, updatedContent);
  console.log(`✅ Updated ${CARGO_TOML} to version ${newVersion}`);
}

function main() {
  const newVersion = process.argv[2];

  if (!newVersion) {
    console.log('Usage: node scripts/update-versions.js <new-version>');
    console.log('Example: node scripts/update-versions.js 1.1.0');
    process.exit(1);
  }

  if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
    console.log('❌ Version must be in semantic versioning format (e.g., 1.0.0)');
    process.exit(1);
  }

  console.log(`🔄 Updating all version files to ${newVersion}...`);

  try {
    updateVersionsFile(newVersion);
    updatePackageJson(newVersion);
    updateCargoToml(newVersion);

    console.log('\n🎉 All version files updated successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the changes');
    console.log('2. Commit the version update');
    console.log('3. Run tests: npm run check');
    console.log('4. Deploy when ready');
  } catch (error) {
    console.error('❌ Error updating versions:', error.message);
    process.exit(1);
  }
}

main();
