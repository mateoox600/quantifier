import { Router } from 'express';
import Category from '../models/Category';

const router = Router();

// Get an amount via it's uuid
router.get('/:uuid/', async (req, res) => {
    const category = await Category.get(req.params.uuid);
    if(!category) return res.sendStatus(404);
    res.send(category);
});

// Get the category tree of a category via it's uuid
router.get('/:uuid/tree', async (req, res) => {
    if(!req.query.project) return res.sendStatus(400);
    const category = await Category.getCategoryTree(req.params.uuid, req.query.project as string, Number(req.query.offset) || 0);
    if(!category) return res.sendStatus(404);
    res.send(category);
});

// Create a category, Required Body:
/*
{
    name: string,
    project: string, // Uuid of the current project
    parent: string // Optional, uuid of the parent category
}
*/
router.post('/', async (req, res) => {
    // Checks that the body has the right data and extracts it
    if(!('name' in req.body)) return res.sendStatus(400);
    if(!('project' in req.body)) return res.sendStatus(400);

    const {
        name,
        project
    } = req.body;

    // Tries to get the parent category from the body, if it doesn't exists defaults to null
    const parent = ('parent' in req.body) ? req.body.parent : null;

    const category = await Category.create({
        name
    }, project, parent);

    res.send(category);
});

// Edit a category, Required Body:
/*
{
    uuid: string, // CANNOT BE EDITED !!!
    name: string
}
*/
router.post('/edit', async (req, res) => {
    // Checks that the body has the right data and extracts it
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

// Delete a category via it's uuid
router.delete('/:uuid', async (req, res) => {
    await Category.delete(req.params.uuid);
    res.sendStatus(200);
});

export default router;