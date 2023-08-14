import { Router } from 'express';
import Project from '../models/Project';

const router = Router();

// Get all projects
router.get('/', async (req, res) => {
    res.send(await Project.getAll(res.locals.user.uuid));
});

// Get a project via it's uuid
router.get('/:uuid/', async (req, res) => {
    if(!(await Project.access(req.params.uuid, res.locals.user.uuid))) return res.sendStatus(403);
    const project = await Project.get(req.params.uuid);
    if(!project) return res.sendStatus(404);
    res.send(project);
});

// Create a project, Required Body:
/*
{
    name: string,
    unit: string
}
*/
router.post('/', async (req, res) => {
    // Checks that the body has the right data and extracts it
    if(!('name' in req.body)) return res.sendStatus(400);
    if(!('unit' in req.body)) return res.sendStatus(400);

    const {
        name,
        unit
    } = req.body;

    const projectObject = await Project.create({
        name, unit
    }, res.locals.user.uuid);

    res.send(projectObject);
});

// Edit a project, Required Body:
/*
{
    uuid: string, // CANNOT BE EDITED !!!
    name: string,
    unit: string
}
*/
router.post('/edit', async (req, res) => {
    // Checks that the body has the right data and extracts it
    if(!('uuid' in req.body)) return res.sendStatus(400);
    if(!('name' in req.body)) return res.sendStatus(400);
    if(!('unit' in req.body)) return res.sendStatus(400);

    const {
        uuid,
        name,
        unit
    } = req.body;

    if(!(await Project.access(uuid, res.locals.user.uuid))) return res.sendStatus(403);

    const projectObject = await Project.edit({
        uuid, name, unit
    });

    res.send(projectObject);
});

// Delete a project via it's uuid
router.delete('/:uuid/', async (req, res) => {
    if(!(await Project.access(req.params.uuid, res.locals.user.uuid))) return res.sendStatus(403);
    await Project.delete(req.params.uuid);

    res.sendStatus(200);
});

export default router;