import { z } from 'zod';
import { envSchema } from './utils/env';

/*
Used to overwrite the nodejs process.env type for typescript intellisence with the .env checker
*/

declare global {
    namespace NodeJS {
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface ProcessEnv
            extends z.infer<typeof envSchema> { }
    }    
}

export {};