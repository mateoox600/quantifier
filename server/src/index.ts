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

app.get('/gain/monthly', async (req, res) => {
    res.send({ gain: await Amount.getAllMonthlyGains(0) });
});

app.get('/used/monthly', async (req, res) => {
    res.send({ used: await Amount.getAllMonthlyUsed(0) });
});

app.get('/total/monthly', async (req, res) => {

    const offset = Number(req.query['offset']) || 0;

    const gain = await Amount.getAllMonthlyGainsTotal(offset);
    const used = await Amount.getAllMonthlyUsedTotal(offset);

    const plannedGain = await Amount.getAllMonthlyGainPlannedTotal();
    const plannedUsed = await Amount.getAllMonthlyUsedPlannedTotal();

    res.send({
        gain, used,
        plannedGain, plannedUsed,
        left: (plannedGain + gain) - (plannedUsed + used)
    });

});

import AmountRouter from './routes/Amount';
app.use('/amount', AmountRouter);
import CategoryRouter from './routes/Category';
app.use('/category', CategoryRouter);

// Starting the server with the port provided in the .env
app.listen(process.env.PORT, async () => {
    console.log(`Server running on: ${process.env.PORT}`);
});