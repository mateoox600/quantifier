import { createHash, randomBytes } from 'crypto';
import { NextFunction, Request, Response } from 'express';

// Function that encodes a password to sha256 and returns it's base64 form
export function hashPassword(password: string) {
    const sha256 = createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
}

// Generates an auth token composed of 30 random bytes
export function generateAuthToken() {
    return randomBytes(30).toString('hex');
}

// Middleware to secure endpoints
export async function protectedEndpoint(req: Request, res: Response, next: NextFunction) {
    // Checks if the AuthToken is set in the cookies
    if(!('AuthToken' in req.cookies)) return res.sendStatus(401);
    // If it's not null (alias if it's defined) and that no user was found with that token (should not happend but in case it's but there)
    // Then we clear the AuthToken cookie, and we return an error 401
    if(!req.cookies['AuthToken'] || !res.locals.user) {
        res.clearCookie('AuthToken');
        return res.sendStatus(401);
    }
    // Else we continue the request routing
    next();
}