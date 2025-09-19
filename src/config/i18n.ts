/**
 * Internationalization Configuration
 * 
 * Configuração de internacionalização para suporte a 20 idiomas
 * mais falados no mundo, conforme especificação NFR-005.
 * 
 * @fileoverview Configuração i18next para 20 idiomas
 * @version 1.0.0
 * @since 2024-12-19
 */

import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { join } from 'path';

// Lista dos 20 idiomas mais falados no mundo (conforme spec NFR-005)
export const SUPPORTED_LANGUAGES = [
  { code: 'zh', name: 'Mandarin', nativeName: '中文', speakers: '1.14B' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', speakers: '609M' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', speakers: '560M' },
  { code: 'en', name: 'English', nativeName: 'English', speakers: '1.5B' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', speakers: '274M' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', speakers: '265M' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', speakers: '258M' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', speakers: '257M' },
  { code: 'fr', name: 'French', nativeName: 'Français', speakers: '277M' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', speakers: '170M' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', speakers: '134.6M' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', speakers: '125M' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', speakers: '125M' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', speakers: '83M' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', speakers: '81M' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', speakers: '79M' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', speakers: '76M' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', speakers: '75M' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', speakers: '75M' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', speakers: '75M' }
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code'];

// Configuração padrão
const DEFAULT_LANGUAGE: SupportedLanguage = 'pt'; // pt-BR como padrão conforme FR-020

/**
 * Inicializa o sistema de internacionalização
 */
export async function initializeI18n(): Promise<void> {
  await i18next
    .use(Backend)
    .init({
      // Idioma padrão
      lng: DEFAULT_LANGUAGE,
      fallbackLng: 'en',
      
      // Namespaces
      ns: ['common', 'errors', 'validation', 'issues', 'auth', 'cli'],
      defaultNS: 'common',
      
      // Configuração do backend
      backend: {
        loadPath: join(process.cwd(), 'locales', '{{lng}}', '{{ns}}.json'),
        addPath: join(process.cwd(), 'locales', '{{lng}}', '{{ns}}.missing.json')
      } as any,
      
      // Configurações de desenvolvimento
      debug: process.env.NODE_ENV === 'development',
      
      // Interpolação
      interpolation: {
        escapeValue: false, // React já faz escape
        formatSeparator: ',',
        format: (value, format) => {
          if (format === 'uppercase') return value.toUpperCase();
          if (format === 'lowercase') return value.toLowerCase();
          return value;
        }
      },
      
      // Detecção de idioma
      detection: {
        order: ['querystring', 'cookie', 'header', 'localStorage', 'navigator'],
        caches: ['cookie', 'localStorage']
      },
      
      // Configurações de recursos
      resources: {},
      
      // Configurações de namespace
      nsSeparator: ':',
      keySeparator: '.',
      
      // Configurações de pluralização
      pluralSeparator: '_',
      contextSeparator: '_',
      
      // Configurações de cache
      cache: {
        enabled: true
      },
      
      // Configurações de reload
      reloadOnPrerender: process.env.NODE_ENV === 'development',
      
      // Configurações de save missing
      saveMissing: process.env.NODE_ENV === 'development',
      saveMissingTo: 'current',
      
      // Configurações de missing key
      missingKeyHandler: (lng, ns, key) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Missing translation key: ${lng}:${ns}:${key}`);
        }
      }
    });
}

/**
 * Obtém a instância do i18next
 */
export function getI18n() {
  return i18next;
}

/**
 * Traduz uma chave
 */
export function t(key: string, options?: any): string {
  return i18next.t(key, options);
}

/**
 * Muda o idioma atual
 */
export async function changeLanguage(lng: SupportedLanguage): Promise<void> {
  await i18next.changeLanguage(lng);
}

/**
 * Obtém o idioma atual
 */
export function getCurrentLanguage(): string {
  return i18next.language;
}

/**
 * Obtém todos os idiomas suportados
 */
export function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES;
}

/**
 * Verifica se um idioma é suportado
 */
export function isLanguageSupported(lng: string): lng is SupportedLanguage {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === lng);
}

/**
 * Obtém informações de um idioma
 */
export function getLanguageInfo(lng: SupportedLanguage) {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === lng);
}

/**
 * Middleware para Express
 */
export function i18nMiddleware() {
  return (req: any, res: any, next: any) => {
    // Detectar idioma do header Accept-Language
    const acceptLanguage = req.headers['accept-language'];
    if (acceptLanguage) {
      const languages = acceptLanguage
        .split(',')
        .map((lang: string) => lang.split(';')[0].trim())
        .map((lang: string) => lang.split('-')[0]); // Remove region codes
      
      for (const lang of languages) {
        if (isLanguageSupported(lang)) {
          req.language = lang;
          break;
        }
      }
    }
    
    // Usar idioma padrão se não detectado
    if (!req.language) {
      req.language = DEFAULT_LANGUAGE;
    }
    
    next();
  };
}

/**
 * Função helper para traduzir com contexto
 */
export function translateWithContext(context: string, key: string, options?: any): string {
  return t(`${context}:${key}`, options);
}

/**
 * Função helper para traduzir erros
 */
export function translateError(errorCode: string, options?: any): string {
  return t(`errors:${errorCode}`, options);
}

/**
 * Função helper para traduzir validações
 */
export function translateValidation(validationKey: string, options?: any): string {
  return t(`validation:${validationKey}`, options);
}

/**
 * Função helper para traduzir issues
 */
export function translateIssue(issueKey: string, options?: any): string {
  return t(`issues:${issueKey}`, options);
}

/**
 * Função helper para traduzir autenticação
 */
export function translateAuth(authKey: string, options?: any): string {
  return t(`auth:${authKey}`, options);
}

/**
 * Função helper para traduzir CLI
 */
export function translateCLI(cliKey: string, options?: any): string {
  return t(`cli:${cliKey}`, options);
}

export default i18next;
