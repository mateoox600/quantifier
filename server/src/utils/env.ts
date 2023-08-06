import { z } from 'zod';

export const envSchema = z.object({
    DATABASE_URL: z.string(),
    DATABASE_USER: z.string(),
    DATABASE_PASSWORD: z.string(),
    PORT: z.string(),
    MODE: z.union([
        z.literal('DEBUG'),
        z.literal('PROD')
    ])
});