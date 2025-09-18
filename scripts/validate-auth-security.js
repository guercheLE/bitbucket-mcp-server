#!/usr/bin/env node

/**
 * Script de validação de segurança para autenticação
 * T029: Configure Authentication Security Validation
 * 
 * Valida:
 * - Criptografia de tokens
 * - Sanitização de dados sensíveis
 * - Rate limiting
 * - Proteção CSRF
 * - PKCE implementation
 * - JWT security
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AuthSecurityValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  /**
   * Executa todas as validações de segurança
   */
  async validateAll() {
    console.log('🔒 Iniciando validação de segurança de autenticação...\n');

    await this.validateEncryption();
    await this.validateSanitization();
    await this.validateRateLimiting();
    await this.validateCSRFProtection();
    await this.validatePKCE();
    await this.validateJWT();
    await this.validateEnvironmentVariables();
    await this.validateDependencies();

    this.printResults();
    return this.errors.length === 0;
  }

  /**
   * Valida implementação de criptografia
   */
  async validateEncryption() {
    console.log('🔐 Validando criptografia...');
    
    try {
      // Verificar se há implementação de criptografia
      const authFiles = this.findAuthFiles();
      let hasEncryption = false;

      for (const file of authFiles) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('crypto') || content.includes('encrypt') || content.includes('decrypt')) {
          hasEncryption = true;
          break;
        }
      }

      if (hasEncryption) {
        this.passed.push('✅ Criptografia implementada');
      } else {
        this.errors.push('❌ Criptografia não implementada');
      }

      // Verificar se há uso de algoritmos seguros
      const secureAlgorithms = ['aes-256-gcm', 'aes-256-cbc', 'chacha20-poly1305'];
      let usesSecureAlgorithm = false;

      for (const file of authFiles) {
        const content = fs.readFileSync(file, 'utf8');
        for (const algorithm of secureAlgorithms) {
          if (content.includes(algorithm)) {
            usesSecureAlgorithm = true;
            break;
          }
        }
      }

      if (usesSecureAlgorithm) {
        this.passed.push('✅ Algoritmos de criptografia seguros detectados');
      } else {
        this.warnings.push('⚠️  Algoritmos de criptografia podem não ser seguros');
      }

    } catch (error) {
      this.errors.push(`❌ Erro ao validar criptografia: ${error.message}`);
    }
  }

  /**
   * Valida sanitização de dados sensíveis
   */
  async validateSanitization() {
    console.log('🧹 Validando sanitização...');
    
    try {
      const authFiles = this.findAuthFiles();
      let hasSanitization = false;

      for (const file of authFiles) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('sanitize') || content.includes('escape') || content.includes('validate')) {
          hasSanitization = true;
          break;
        }
      }

      if (hasSanitization) {
        this.passed.push('✅ Sanitização implementada');
      } else {
        this.warnings.push('⚠️  Sanitização pode não estar implementada');
      }

      // Verificar se há validação de entrada
      let hasInputValidation = false;
      for (const file of authFiles) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('zod') || content.includes('validate') || content.includes('schema')) {
          hasInputValidation = true;
          break;
        }
      }

      if (hasInputValidation) {
        this.passed.push('✅ Validação de entrada implementada');
      } else {
        this.errors.push('❌ Validação de entrada não implementada');
      }

    } catch (error) {
      this.errors.push(`❌ Erro ao validar sanitização: ${error.message}`);
    }
  }

  /**
   * Valida rate limiting
   */
  async validateRateLimiting() {
    console.log('⏱️  Validando rate limiting...');
    
    try {
      const authFiles = this.findAuthFiles();
      let hasRateLimiting = false;

      for (const file of authFiles) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('rateLimit') || content.includes('rate-limit') || content.includes('throttle')) {
          hasRateLimiting = true;
          break;
        }
      }

      if (hasRateLimiting) {
        this.passed.push('✅ Rate limiting implementado');
      } else {
        this.warnings.push('⚠️  Rate limiting pode não estar implementado');
      }

      // Verificar configuração de rate limiting
      const configFile = path.join(__dirname, '../src/config/auth.ts');
      if (fs.existsSync(configFile)) {
        const content = fs.readFileSync(configFile, 'utf8');
        if (content.includes('rateLimitWindow') && content.includes('rateLimitMaxRequests')) {
          this.passed.push('✅ Configuração de rate limiting encontrada');
        } else {
          this.warnings.push('⚠️  Configuração de rate limiting pode estar incompleta');
        }
      }

    } catch (error) {
      this.errors.push(`❌ Erro ao validar rate limiting: ${error.message}`);
    }
  }

  /**
   * Valida proteção CSRF
   */
  async validateCSRFProtection() {
    console.log('🛡️  Validando proteção CSRF...');
    
    try {
      const authFiles = this.findAuthFiles();
      let hasCSRFProtection = false;

      for (const file of authFiles) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('csrf') || content.includes('state') || content.includes('nonce')) {
          hasCSRFProtection = true;
          break;
        }
      }

      if (hasCSRFProtection) {
        this.passed.push('✅ Proteção CSRF implementada');
      } else {
        this.warnings.push('⚠️  Proteção CSRF pode não estar implementada');
      }

      // Verificar se há geração de state para OAuth
      let hasStateGeneration = false;
      for (const file of authFiles) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('generateState') || content.includes('randomBytes') || content.includes('state')) {
          hasStateGeneration = true;
          break;
        }
      }

      if (hasStateGeneration) {
        this.passed.push('✅ Geração de state para OAuth implementada');
      } else {
        this.warnings.push('⚠️  Geração de state para OAuth pode não estar implementada');
      }

    } catch (error) {
      this.errors.push(`❌ Erro ao validar proteção CSRF: ${error.message}`);
    }
  }

  /**
   * Valida implementação PKCE
   */
  async validatePKCE() {
    console.log('🔑 Validando PKCE...');
    
    try {
      const authFiles = this.findAuthFiles();
      let hasPKCE = false;

      for (const file of authFiles) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('pkce') || content.includes('code_challenge') || content.includes('code_verifier')) {
          hasPKCE = true;
          break;
        }
      }

      if (hasPKCE) {
        this.passed.push('✅ PKCE implementado');
      } else {
        this.errors.push('❌ PKCE não implementado');
      }

      // Verificar se há geração de code challenge
      let hasCodeChallenge = false;
      for (const file of authFiles) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('generateCodeChallenge') || content.includes('sha256') || content.includes('base64url')) {
          hasCodeChallenge = true;
          break;
        }
      }

      if (hasCodeChallenge) {
        this.passed.push('✅ Geração de code challenge implementada');
      } else {
        this.warnings.push('⚠️  Geração de code challenge pode não estar implementada');
      }

    } catch (error) {
      this.errors.push(`❌ Erro ao validar PKCE: ${error.message}`);
    }
  }

  /**
   * Valida segurança JWT
   */
  async validateJWT() {
    console.log('🎫 Validando JWT...');
    
    try {
      const authFiles = this.findAuthFiles();
      let hasJWT = false;

      for (const file of authFiles) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('jwt') || content.includes('jsonwebtoken') || content.includes('sign') || content.includes('verify')) {
          hasJWT = true;
          break;
        }
      }

      if (hasJWT) {
        this.passed.push('✅ JWT implementado');
      } else {
        this.warnings.push('⚠️  JWT pode não estar implementado');
      }

      // Verificar se há configuração de expiração
      const configFile = path.join(__dirname, '../src/config/auth.ts');
      if (fs.existsSync(configFile)) {
        const content = fs.readFileSync(configFile, 'utf8');
        if (content.includes('tokenExpirationTime') || content.includes('sessionTimeout')) {
          this.passed.push('✅ Configuração de expiração de token encontrada');
        } else {
          this.warnings.push('⚠️  Configuração de expiração de token pode estar ausente');
        }
      }

      // Verificar se há uso de algoritmos seguros para JWT
      let usesSecureJWTAlgorithm = false;
      for (const file of authFiles) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('HS256') || content.includes('RS256') || content.includes('ES256')) {
          usesSecureJWTAlgorithm = true;
          break;
        }
      }

      if (usesSecureJWTAlgorithm) {
        this.passed.push('✅ Algoritmos seguros de JWT detectados');
      } else {
        this.warnings.push('⚠️  Algoritmos de JWT podem não ser seguros');
      }

    } catch (error) {
      this.errors.push(`❌ Erro ao validar JWT: ${error.message}`);
    }
  }

  /**
   * Valida variáveis de ambiente
   */
  async validateEnvironmentVariables() {
    console.log('🌍 Validando variáveis de ambiente...');
    
    try {
      const envExample = path.join(__dirname, '../env.example');
      if (fs.existsSync(envExample)) {
        const content = fs.readFileSync(envExample, 'utf8');
        
        const requiredVars = [
          'OAUTH_CLIENT_ID',
          'OAUTH_CLIENT_SECRET',
          'JWT_SECRET',
          'ENCRYPTION_KEY'
        ];

        for (const varName of requiredVars) {
          if (content.includes(varName)) {
            this.passed.push(`✅ Variável de ambiente ${varName} documentada`);
          } else {
            this.warnings.push(`⚠️  Variável de ambiente ${varName} pode não estar documentada`);
          }
        }
      } else {
        this.warnings.push('⚠️  Arquivo env.example não encontrado');
      }

      // Verificar se há validação de variáveis de ambiente
      const configFile = path.join(__dirname, '../src/config/auth.ts');
      if (fs.existsSync(configFile)) {
        const content = fs.readFileSync(configFile, 'utf8');
        if (content.includes('process.env')) {
          this.passed.push('✅ Carregamento de variáveis de ambiente implementado');
        } else {
          this.warnings.push('⚠️  Carregamento de variáveis de ambiente pode não estar implementado');
        }
      }

    } catch (error) {
      this.errors.push(`❌ Erro ao validar variáveis de ambiente: ${error.message}`);
    }
  }

  /**
   * Valida dependências de segurança
   */
  async validateDependencies() {
    console.log('📦 Validando dependências de segurança...');
    
    try {
      const packageJson = path.join(__dirname, '../package.json');
      if (fs.existsSync(packageJson)) {
        const content = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
        const dependencies = { ...content.dependencies, ...content.devDependencies };

        const securityDeps = [
          'jsonwebtoken',
          'crypto-js',
          'helmet',
          'express-rate-limit',
          'cors'
        ];

        for (const dep of securityDeps) {
          if (dependencies[dep]) {
            this.passed.push(`✅ Dependência de segurança ${dep} instalada`);
          } else {
            this.warnings.push(`⚠️  Dependência de segurança ${dep} pode não estar instalada`);
          }
        }

        // Verificar se há dependências vulneráveis
        if (dependencies['helmet']) {
          this.passed.push('✅ Helmet instalado para segurança HTTP');
        } else {
          this.warnings.push('⚠️  Helmet não instalado para segurança HTTP');
        }

      } else {
        this.errors.push('❌ package.json não encontrado');
      }

    } catch (error) {
      this.errors.push(`❌ Erro ao validar dependências: ${error.message}`);
    }
  }

  /**
   * Encontra arquivos relacionados à autenticação
   */
  findAuthFiles() {
    const authDirs = [
      'src/services/auth',
      'src/tools/shared/auth',
      'src/tools/datacenter/auth',
      'src/tools/cloud/auth',
      'src/types/auth',
      'src/config'
    ];

    const files = [];
    const rootDir = path.join(__dirname, '..');

    for (const dir of authDirs) {
      const fullPath = path.join(rootDir, dir);
      if (fs.existsSync(fullPath)) {
        this.findTsFiles(fullPath, files);
      }
    }

    return files;
  }

  /**
   * Encontra arquivos TypeScript recursivamente
   */
  findTsFiles(dir, files) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        this.findTsFiles(fullPath, files);
      } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    }
  }

  /**
   * Imprime resultados da validação
   */
  printResults() {
    console.log('\n📊 Resultados da Validação de Segurança:\n');

    if (this.passed.length > 0) {
      console.log('✅ Testes Passados:');
      this.passed.forEach(test => console.log(`   ${test}`));
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  Avisos:');
      this.warnings.forEach(warning => console.log(`   ${warning}`));
      console.log('');
    }

    if (this.errors.length > 0) {
      console.log('❌ Erros:');
      this.errors.forEach(error => console.log(`   ${error}`));
      console.log('');
    }

    const total = this.passed.length + this.warnings.length + this.errors.length;
    const passRate = total > 0 ? ((this.passed.length / total) * 100).toFixed(1) : 0;

    console.log(`📈 Taxa de Aprovação: ${passRate}% (${this.passed.length}/${total})`);

    if (this.errors.length === 0) {
      console.log('\n🎉 Validação de segurança PASSOU!');
    } else {
      console.log('\n💥 Validação de segurança FALHOU!');
      process.exit(1);
    }
  }
}

// Executar validação se chamado diretamente
if (require.main === module) {
  const validator = new AuthSecurityValidator();
  validator.validateAll().catch(error => {
    console.error('❌ Erro durante validação:', error);
    process.exit(1);
  });
}

module.exports = AuthSecurityValidator;
