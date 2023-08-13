import './utils/setup';

import express from 'express';
import cors from 'cors';
import neo4j from 'neo4j-driver';
import Amount from './models/Amount';

// Express server
export const app = express();

// Neo4j db connection
export const driver = neo4j.driver(
    process.env.DATABASE_URL,
    neo4j.auth.basic(process.env.DATABASE_USER, process.env.DATABASE_PASSWORD)
);

// Adding cors and json middleware to express
app.use(cors());
app.use(express.json());

// Used to get used amounts totals, gains amounts totals and left overs
app.get('/total/monthly', async (req, res) => {
    if(!req.query.project) return res.sendStatus(400);

    const project = req.query.project as string;
    const offset = Number(req.query['offset']) || 0;

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

import ProjectRouter from './routes/Project';
app.use('/project', ProjectRouter);
import CategoryRouter from './routes/Category';
app.use('/category', CategoryRouter);
import AmountRouter from './routes/Amount';
app.use('/amount', AmountRouter);

// Starting the server with the port provided in the .env
app.listen(process.env.PORT, async () => {
    console.log(`Server running on: ${process.env.PORT}`);
});