import path from "node:path";

import type { Handler } from "express";
import i18next, { type i18n } from "i18next";
import Backend from "i18next-fs-backend";
import middleware from "i18next-http-middleware";

export interface I18nServiceOptions {
    fallbackLng: string;
    supportedLngs: string[];
    resourcesPath: string;
    preload?: string[];
}

export interface TranslateOptions {
    count?: number;
    defaultValue?: string;
    interpolation?: Record<string, unknown>;
}

export interface I18nService {
    init(): Promise<void>;
    middleware(): Handler;
    translate(key: string, lng?: string, options?: TranslateOptions): string;
    getInstance(): i18n;
}

export const createI18nService = (options: I18nServiceOptions): I18nService => {
    const instance = i18next.createInstance();
    let initialized = false;

    const ensureInitialized = async () => {
        if (initialized) {
            return;
        }

        instance.use(Backend).use(middleware.LanguageDetector);

        await instance.init({
            fallbackLng: options.fallbackLng,
            supportedLngs: options.supportedLngs,
            preload: options.preload ?? options.supportedLngs,
            backend: {
                loadPath: path.join(options.resourcesPath, "{{lng}}/{{ns}}.json"),
                addPath: path.join(options.resourcesPath, "{{lng}}/{{ns}}.missing.json")
            },
            detection: {
                order: ["header", "querystring", "cookie"],
                lookupHeader: "accept-language"
            },
            interpolation: {
                escapeValue: false
            }
        });

        initialized = true;
    };

    return {
        async init() {
            await ensureInitialized();
        },
        middleware() {
            if (!initialized) {
                throw new Error("i18n service not initialized");
            }
            return middleware.handle(instance);
        },
        translate(key: string, lng?: string, options?: TranslateOptions) {
            if (!initialized) {
                throw new Error("i18n service not initialized");
            }
            return instance.t(key, { lng, ...options });
        },
        getInstance() {
            if (!initialized) {
                throw new Error("i18n service not initialized");
            }
            return instance;
        }
    };
};
