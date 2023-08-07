import { Router } from 'express';
import Amount from '../models/Amount';
import Category from '../models/Category';

const router = Router();

router.get('/', async (req, res) => {
    res.send(await Amount.getAll());
});

router.get('/monthly', async (req, res) => {
    res.send({
        gain: await Amount.getAllMonthlyGains(0),
        used: await Amount.getAllMonthlyUsed(0),
        plannedGain: await Amount.getAllMonthlyGainPlanned(),
        plannedUsed: await Amount.getAllMonthlyUsedPlanned()
    });
});

router.get('/monthly/all', async (req, res) => {
    res.send(await Amount.getAllMonthly(Number(req.query['offset'] ?? '') || undefined));
});

router.get('/monthly/tree/:uuid/', async (req, res) => {
    res.send(await Category.getCategoryTreeWithAmount(req.params.uuid));
});

router.get('/:uuid/', async (req, res) => {
    const amount = await Amount.get(req.params.uuid);
    if(!amount) return res.sendStatus(404);
    res.send(amount);
});

router.post('/', async (req, res) => {
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

    const category = ('category' in req.body) ? req.body.category : null;

    const amount = Number(amountStr);
    let dateTime = Number(dateTimeStr);
    const gain = gainStr === 'true' ? true : false;

    if(isNaN(amount) || amount < 1) return res.sendStatus(400);
    if(isNaN(dateTime) || dateTime < 1) dateTime = Date.now();

    if(!Amount.plannedPossibilities.includes(planned)) return res.sendStatus(400);

    const amountObject = await Amount.create({
        amount, dateTime, description, gain, planned
    }, category);

    res.send(amountObject);
});

router.post('/edit', async (req, res) => {
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

    const amount = Number(amountStr);
    let dateTime = Number(dateTimeStr);
    const gain = gainStr === 'true' ? true : false;

    if(isNaN(amount) || amount < 1) return res.sendStatus(400);
    if(isNaN(dateTime) || dateTime < 1) dateTime = Date.now();

    if(!Amount.plannedPossibilities.includes(planned)) return res.sendStatus(400);

    const amountObject = await Amount.edit({
        uuid, amount, dateTime, description, gain, planned
    });

    res.send(amountObject);
});

router.delete('/:uuid/', async (req, res) => {
    await Amount.delete(req.params.uuid);

    res.sendStatus(200);
});

export default router;