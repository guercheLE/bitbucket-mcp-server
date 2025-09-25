```typescript
import { z } from 'zod';

// Contract for i18next integration
export const i18nContract = {
  name: 'i18n.translate',
  description: 'Verifies that the server returns translated strings.',
  request: z.object({
    key: z.string(),
    language: z.string(),
  }),
  response: z.object({
    translatedText: z.string(),
  }),
};
```
