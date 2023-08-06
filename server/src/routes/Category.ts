import { Router } from 'express';
import Category from '../models/Category';

const router = Router();

router.get('/:uuid/', async (req, res) => {
    const category = await Category.get(req.params.uuid);
    if(!category) return res.sendStatus(404);
    res.send(category);
});

router.get('/:uuid/tree', async (req, res) => {
    const category = await Category.getCategoryTreeWithAmountCalculated(req.params.uuid);
    if(!category) return res.sendStatus(404);
    res.send(category);
});

router.post('/', async (req, res) => {
    if(!('name' in req.body)) return res.sendStatus(400);

    const {
        name
    } = req.body;

    const parent = ('parent' in req.body) ? req.body.parent : null;

    const category = await Category.create({
        name
    }, parent);

    res.send(category);
});

router.post('/edit', async (req, res) => {
    if(!('uuid' in req.body)) return res.sendStatus(400);
    if(!('name' in req.body)) return res.sendStatus(400);

    const {
        uuid,
        name
    } = req.body;

    const category = await Category.edit({
        uuid, name
    });

    res.send(category);
});

router.delete('/:uuid', async (req, res) => {
    await Category.delete(req.params.uuid);
    res.sendStatus(200);
});

export default router;