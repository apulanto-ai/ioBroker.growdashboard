'use strict';

const fs   = require('fs');
const path = require('path');

const root      = path.join(__dirname, '..');
const pkgPath   = path.join(root, 'package.json');
const ioPkgPath = path.join(root, 'io-package.json');

const pkg   = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const ioPkg = JSON.parse(fs.readFileSync(ioPkgPath, 'utf8'));

const parts = pkg.version.split('.').map(Number);
parts[2]++;
const newVersion = parts.join('.');

pkg.version          = newVersion;
ioPkg.common.version = newVersion;

// Prepend new entry to news (keeps history intact)
ioPkg.common.news = {
    [newVersion]: { en: `Version ${newVersion}`, de: `Version ${newVersion}` },
    ...ioPkg.common.news,
};

fs.writeFileSync(pkgPath,   JSON.stringify(pkg,   null, 2) + '\n');
fs.writeFileSync(ioPkgPath, JSON.stringify(ioPkg, null, 2) + '\n');

process.stdout.write(`version bumped → ${newVersion}\n`);
