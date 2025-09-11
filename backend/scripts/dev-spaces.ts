#!/usr/bin/env ts-node

import { spawn } from 'child_process';
import * as path from 'path';

const SPACE = process.argv[2];

if (!SPACE || !['club', 'municipality'].includes(SPACE)) {
  console.log('❌ Usage: npm run dev:club ou npm run dev:municipality');
  process.exit(1);
}

const configs = {
  club: {
    name: '🏟️  Espace Club 360°',
    port: 3001,
    env: {
      NODE_ENV: 'development',
      APP_SPACE: 'club_360',
      PORT: '3001',
      FRONTEND_URL: 'http://localhost:3001',
      API_BASE_URL: 'http://localhost:3000/api',
    },
  },
  municipality: {
    name: '🏛️  Portail Municipal',
    port: 3002,
    env: {
      NODE_ENV: 'development',
      APP_SPACE: 'municipality',
      PORT: '3002',
      FRONTEND_URL: 'http://localhost:3002',
      API_BASE_URL: 'http://localhost:3000/api',
    },
  },
};

const config = configs[SPACE as keyof typeof configs];

console.log(`\n${config.name}`);
console.log(`🌐 Port: ${config.port}`);
console.log(`🔗 URL: ${config.env.FRONTEND_URL}`);
console.log(`📡 API: ${config.env.API_BASE_URL}\n`);

// Démarrer le serveur de développement
const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';
const shell = isWindows ? true : false;

const child = spawn(npmCommand, ['run', 'dev'], {
  stdio: 'inherit',
  shell,
  env: {
    ...process.env,
    ...config.env,
  } as NodeJS.ProcessEnv,
  cwd: path.join(__dirname, '..'),
});

child.on('error', (error) => {
  console.error(`❌ Erreur lors du démarrage: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`\n👋 Serveur ${SPACE} arrêté (code: ${code})`);
  process.exit(code || 0);
});

// Gestion des signaux
process.on('SIGINT', () => {
  console.log(`\n🛑 Arrêt du serveur ${SPACE}...`);
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log(`\n🛑 Arrêt du serveur ${SPACE}...`);
  child.kill('SIGTERM');
});
