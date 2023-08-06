import { z } from 'zod';
import { envSchema } from './utils/env';

declare global {
    namespace NodeJS {
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface ProcessEnv
            extends z.infer<typeof envSchema> { }
    }    
}

export {};