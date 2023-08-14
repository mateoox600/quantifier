import { Router } from 'express';
import User, { DataUser } from '../models/User';
import { generateAuthToken, hashPassword, protectedEndpoint } from '../utils/Auth';

const router = Router();

router.get('/', protectedEndpoint, (req, res) => {
    // Get the user stored in the locals and returns it
    const user: DataUser | undefined = res.locals.user;
    if(!user) return res.sendStatus(401);
    res.send(user);
});

router.post('/register/', async (req, res) => {
    
    // Checking if a body is present and if all required properties are in the body
    if(!req.body) return res.status(400).send('missing body');
    if(!('email' in req.body)) return res.status(400).send('missing email in body');
    if(!('password' in req.body)) return res.status(400).send('missing password in body');
    if(!('passwordConfirm' in req.body)) return res.status(400).send('missing passwordConfirm in body');

    // Extacts properties from the body
    const { email, password, passwordConfirm } = req.body;

    // Check if the password is the same as the confirmation password
    if(password !== passwordConfirm) return res.status(400).send('password != passwordConfirm');

    // Validate the email, password and username
    if(!email.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/)) return res.status(400).send('email format not valid');
    if(!password.match(/^\S{8,}$/)) return res.status(400).send('password format not valid');
    
    // Check if the email doesn't already exists
    if(await User.existsEmail(email)) return res.status(400).send('email is already taken');

    // Hashing the password
    const hashedPassword = hashPassword(password);

    // Adding the user to the database
    await User.create({
        email: email,
        password: hashedPassword,
        session: null
    });
    res.sendStatus(201);
});

router.post('/login/', async (req, res) => {
    // Check if the user is not already logged in
    if(res.locals.user) return res.status(400).send('Already logged-in');

    // Checking if a body is present and if all required properties are in the body
    if(!req.body) return res.status(400).send('missing body');
    if(!('email' in req.body)) return res.status(400).send('missing email in body');
    if(!('password' in req.body)) return res.status(400).send('missing password in body');
    
    // Extracting the properties from the body and hashing the password
    const { email, password } = req.body;
    const hashedPassword = hashPassword(password);

    // Fetching the user from the database
    const user = await User.getEmailPassword(email, hashedPassword);

    if(!user) return res.sendStatus(404);

    // If the user exists generate an auth token and insert it to the user node
    const authToken = generateAuthToken();

    await User.edit({
        ...user,
        session: authToken
    });

    // Add the user token to the cookies with proper expiration time and return the success
    res.cookie('AuthToken', authToken);
    res.status(200).send('authentificated');
});

router.get('/disconnect/', protectedEndpoint, async (req, res) => {
    // Removes the auth token links that links the token to a user id
    await User.edit({
        ...res.locals.user,
        session: null
    });
    // Removes the AuthToken from the cookies
    res.clearCookie('AuthToken');
    res.sendStatus(200);
});

router.get('/check/', protectedEndpoint, (req, res) => {
    // Checks if the user is authentificated
    if(res.locals.user) {
        res.send('authentificated');
        return;
    }
    res.sendStatus(401);
});

export default router;