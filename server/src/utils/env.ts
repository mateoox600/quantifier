import { z } from 'zod';

export const envSchema = z.object({
    DATABASE_URL: z.string(), // NEO4J Database URL
    DATABASE_USER: z.string(), // NEO4J Database User
    DATABASE_PASSWORD: z.string(), // NEO4J Database Password
    PORT: z.string(), // Express server port
    MODE: z.union([ // Server mode
        z.literal('DEBUG'),
        z.literal('PROD')
    ])
});