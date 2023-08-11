import { Router } from 'express';
import Amount from '../models/Amount';

const router = Router();

// Get all amounts
router.get('/', async (req, res) => {
    res.send(await Amount.getAll());
});

// Get all monthly amounts
router.get('/monthly', async (req, res) => {
    res.send(await Amount.getAllMonthly(Number(req.query.offset) || 0));
});

// Get an amount via it's uuid
router.get('/:uuid/', async (req, res) => {
    const amount = await Amount.get(req.params.uuid);
    if(!amount) return res.sendStatus(404);
    res.send(amount);
});

// Create an amount, Required Body:
/*
{
    amount: number,
    dateTime: number, // Can be -1 so that Date.now() be used
    gain: boolean,
    planned: 'no' | 'monthly',
    description: string,
    category: string // Optional, uuid of the parent category
}
*/
router.post('/', async (req, res) => {
    // Checks that the body has the right data and extracts it
    if(!('amount' in req.body)) return res.sendStatus(400);
    if(!('dateTime' in req.body)) return res.sendStatus(400);
    if(!('gain' in req.body)) return res.sendStatus(400);
    if(!('planned' in req.body)) return res.sendStatus(400);
    if(!('description' in req.body)) return res.sendStatus(400);

    const {
        amount: amountStr,
        dateTime: dateTimeStr,
        gain: gainStr,
        planned,
        description
    } = req.body;

    // Tries to get the parent category from the body, if it doesn't exists defaults to null
    const category = ('category' in req.body) ? req.body.category : null;

    // Converts the amount and dateTime to numbers, also convers the gain string to a boolean
    const amount = Number(amountStr);
    let dateTime = Number(dateTimeStr);
    const gain = gainStr === 'true' ? true : false;

    // Ensure the amount is a number and is more than 0
    if(isNaN(amount) || amount < 1) return res.sendStatus(400);
    // If the dateTime is not a number or is under 1 we set it to the current time
    if(isNaN(dateTime) || dateTime < 1) dateTime = Date.now();

    // Checking that the planned properties is one of plannedPossibilities
    if(!Amount.plannedPossibilities.includes(planned)) return res.sendStatus(400);

    const amountObject = await Amount.create({
        amount, dateTime, description, gain, planned
    }, category);

    res.send(amountObject);
});

// Edit an amount, Required Body:
/*
{
    uuid: string, // CANNOT BE EDITED !!!
    amount: number,
    dateTime: number, // Can be -1 so that Date.now() be used
    gain: boolean,
    planned: 'no' | 'monthly',
    description: string
}
*/
router.post('/edit', async (req, res) => {
    // Checks that the body has the right data and extracts it
    if(!('uuid' in req.body)) return res.sendStatus(400);
    if(!('amount' in req.body)) return res.sendStatus(400);
    if(!('dateTime' in req.body)) return res.sendStatus(400);
    if(!('gain' in req.body)) return res.sendStatus(400);
    if(!('planned' in req.body)) return res.sendStatus(400);
    if(!('description' in req.body)) return res.sendStatus(400);

    const {
        uuid,
        amount: amountStr,
        dateTime: dateTimeStr,
        gain: gainStr,
        planned,
        description
    } = req.body;

    // Converts the amount and dateTime to numbers, also convers the gain string to a boolean
    const amount = Number(amountStr);
    let dateTime = Number(dateTimeStr);
    const gain = gainStr === 'true' ? true : false;

    // Ensure the amount is a number and is more than 0
    if(isNaN(amount) || amount < 1) return res.sendStatus(400);
    // If the dateTime is not a number or is under 1 we set it to the current time
    if(isNaN(dateTime) || dateTime < 1) dateTime = Date.now();

    // Checking that the planned properties is one of plannedPossibilities
    if(!Amount.plannedPossibilities.includes(planned)) return res.sendStatus(400);

    const amountObject = await Amount.edit({
        uuid, amount, dateTime, description, gain, planned
    });

    res.send(amountObject);
});

// Delete an amount via it's uuid
router.delete('/:uuid/', async (req, res) => {
    await Amount.delete(req.params.uuid);

    res.sendStatus(200);
});

export default router;