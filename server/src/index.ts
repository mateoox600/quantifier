import './utils/setup';

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import neo4j from 'neo4j-driver';
import Amount from './models/Amount';
import User from './models/User';
import { protectedEndpoint } from './utils/Auth';

// Express server
export const app = express();

// Neo4j db connection
export const driver = neo4j.driver(
    process.env.DATABASE_URL,
    neo4j.auth.basic(process.env.DATABASE_USER, process.env.DATABASE_PASSWORD)
);

// Adding cors, cookie parser and json middleware to express
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// Middleware that set the res.locals.user parameters with the user that the AuthToken token points
app.use(async (req, res, next) => {
    // If the token is not set in the cookies we continue routing
    if(!('AuthToken' in req.cookies)) return next();

    const authToken = req.cookies['AuthToken'];

    // If it's set but is undefined we clear it from the cookies and we continue routing
    if(!authToken) {
        res.clearCookie('AuthToken');
        return next();
    }
    
    // Fetching the user via the token
    const user = await User.getSession(authToken);

    // If the user is not found we clear the token from the cookies and we continue routing
    if(!user) {
        res.clearCookie('AuthToken');
        return next();
    }
    
    // If all goes right we set the user in the locals and we continue routing
    res.locals.user = user;
    next();
});

// Used to get used amounts totals, gains amounts totals and left overs
app.get('/total/monthly', async (req, res) => {
    if(!req.query.project) return res.sendStatus(400);

    const project = req.query.project as string;
    const offset = Number(req.query['offset']) || 0;

    if(!(await Project.access(project, res.locals.user.uuid))) return res.sendStatus(403);

    const gain = await Amount.getAllMonthlyGainsTotal(project, offset);
    const used = await Amount.getAllMonthlyUsedTotal(project, offset);

    const plannedGain = await Amount.getAllMonthlyGainPlannedTotal(project, offset);
    const plannedUsed = await Amount.getAllMonthlyUsedPlannedTotal(project, offset);

    res.send({
        gain, used,
        plannedGain, plannedUsed,
        left: (plannedGain + gain) - (plannedUsed + used)
    });

});

import UserRouter from './routes/User';
app.use('/user', UserRouter);
import ProjectRouter from './routes/Project';
app.use('/project', protectedEndpoint, ProjectRouter);
import CategoryRouter from './routes/Category';
app.use('/category', protectedEndpoint, CategoryRouter);
import AmountRouter from './routes/Amount';
import Project from './models/Project';
app.use('/amount', protectedEndpoint, AmountRouter);

// Starting the server with the port provided in the .env
app.listen(process.env.PORT, async () => {
    console.log(`Server running on: ${process.env.PORT}`);
});