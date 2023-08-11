import { envSchema } from './env';
import { ZodError } from 'zod';
import dotenv from 'dotenv';

// Loads the env from the .env file
dotenv.config();

// If the .env format is not correct throw an error and exit the program
try {
    envSchema.parse(process.env);
}catch(err: unknown) {
    if(!(err instanceof ZodError)) throw err;
    
    console.error(`\x1b[31mEnvError: Missing env var ${err.errors[0].path}\x1b[0m`);
    process.exit(1);
}