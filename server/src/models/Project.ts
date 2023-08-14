import { v4 as uuid } from 'uuid';
import { driver } from '..';

// Project data structure
export interface DataProject {
    uuid: string,
    name: string,
    unit: string
}

export default class Project {

    // Check if a user can access that project
    public static async access(uuid: string, user: string): Promise<boolean> {
        const session = driver.session();
        const project = await session.run(`
            MATCH (user:User)-[:HasParentUser]-(project:Project)
            WHERE project.uuid=$uuid AND user.uuid=$user
            RETURN project
        `, { uuid, user });
        session.close();
        return project.records.length > 0 ? true : false;
    }

    // Gets the project via it's uuid, if it's not found returns null
    public static async get(uuid: string): Promise<DataProject> {
        const session = driver.session();
        const project = await session.run('MATCH (project:Project) WHERE project.uuid=$uuid RETURN project', { uuid: uuid });
        session.close();
        return project.records.length > 0 ? project.records[0].get('project').properties : null;
    }

    // Gets every projects of the whole database
    public static async getAll(user: string): Promise<DataProject[]> {
        const session = driver.session();
        const projects = await session.run('MATCH (user:User)-[:HasParentUser]-(project:Project) WHERE user.uuid=$user RETURN project', { user });
        session.close();
        return projects.records.map((record) => record.get('project').properties);
    }

    public static async create(project: Omit<DataProject, 'uuid'>, user: string) {
        // First we define this object to add the generated uuid to the project
        const projectProperties: DataProject = {
            uuid: uuid(),
            ...project
        };

        const session = driver.session();

        // We then create the project
        const query = `
            MATCH (user:User)
            WHERE user.uuid=$user
            CREATE (project:Project $projectProperties)-[:HasParentUser]->(user)
        `;

        await session.run(query, { projectProperties, user });
        session.close();

        // We also return the properties of the just created project
        return projectProperties;
    }

    // Edits the given project, the uuid shouldn't be editable
    public static async edit(project: DataProject) {
        const session = driver.session();
        await session.run('MATCH (project:Project) WHERE project.uuid=$uuid SET project+=$projectProperties RETURN project', {
            uuid: project.uuid,
            projectProperties: project
        });
        session.close();
        return project;
    }

    // Deletes the given project
    public static async delete(uuid: string) {
        const session = driver.session();
        // Starts by deleting every amounts of itself and of it's categories
        await session.run(`
            MATCH (project:Project)<-[*0..]-(sub:Category)
            MATCH (sub)-[:AmountHasCategory]-(amount:Amount)
            WHERE project.uuid=$uuid
            DETACH DELETE amount
        `, { uuid });
        // Then deletes every categories
        await session.run(`
            MATCH (project:Project)<-[*0..]-(sub:Category)
            WHERE project.uuid=$uuid
            DETACH DELETE sub
        `, { uuid });
        // Finally deletes itself
        await session.run('MATCH (project:Project) WHERE project.uuid=$uuid DETACH DELETE project', { uuid });
        session.close();
    }

}