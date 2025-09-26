import path from "node:path";

import { createI18nService } from "../../src/services/i18n";

describe("i18n contract", () => {
    it("returns translated strings for the requested language", async () => {
        const localesDir = path.resolve(__dirname, "../../locales");
        const service = createI18nService({
            fallbackLng: "en",
            supportedLngs: ["en", "fr"],
            resourcesPath: localesDir
        });

        await service.init();

        const english = service.translate("status.ready", "en");
        const french = service.translate("status.ready", "fr");

        expect(english).toBe("Server ready");
        expect(french).toBe("Serveur prêt");
    });
});
