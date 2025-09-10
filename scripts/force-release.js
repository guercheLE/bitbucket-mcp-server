#!/usr/bin/env node

/**
 * Script para forçar um tipo específico de release
 * Uso: node scripts/force-release.js [patch|minor|major]
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const releaseType = process.argv[2];

if (!releaseType || !['patch', 'minor', 'major'].includes(releaseType)) {
  console.error('❌ Tipo de release inválido. Use: patch, minor ou major');
  console.log('📝 Exemplo: node scripts/force-release.js patch');
  process.exit(1);
}

console.log(`🚀 Forçando release ${releaseType}...`);

try {
  // 1. Build e test
  console.log('📦 Fazendo build...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('🧪 Executando testes...');
  execSync('npm run test', { stdio: 'inherit' });
  
  // 2. Verificar se há mudanças para commitar
  console.log('📝 Verificando mudanças...');
  try {
    execSync('git diff --quiet && git diff --cached --quiet', { stdio: 'pipe' });
    console.log('⚠️  Nenhuma mudança detectada. Criando commit vazio...');
  } catch (error) {
    console.log('✅ Mudanças detectadas. Criando commit...');
  }
  
  // 3. Criar commit com tipo específico
  const commitMessages = {
    patch: 'fix: patch release',
    minor: 'feat: minor release', 
    major: 'feat!: major release'
  };
  
  execSync(`git add .`, { stdio: 'inherit' });
  execSync(`git commit -m "${commitMessages[releaseType]}" --allow-empty`, { stdio: 'inherit' });
  
  // 3. Executar semantic-release
  console.log('🎯 Executando semantic-release...');
  execSync('npm run release', { stdio: 'inherit' });
  
  console.log(`✅ Release ${releaseType} concluído com sucesso!`);
  
} catch (error) {
  console.error('❌ Erro durante o release:', error.message);
  process.exit(1);
}
