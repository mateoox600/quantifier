import { v4 as uuid } from 'uuid';
import { driver } from '..';

// User data structure
export interface DataUser {
    uuid: string,
    email: string,
    password: string,
    session: string | null
}

export default class User {

    // Gets the user via it's uuid, if it's not found returns null
    public static async get(uuid: string): Promise<DataUser> {
        const session = driver.session();
        const user = await session.run('MATCH (user:User) WHERE user.uuid=$uuid RETURN user', { uuid });
        session.close();
        return user.records.length > 0 ? user.records[0].get('user').properties : null;
    }

    // Gets a user via it's email and it's hashed password
    public static async getEmailPassword(email: string, password: string): Promise<DataUser | null> {
        const session = driver.session();
        const user = await session.run('MATCH (user:User) WHERE user.email=$email AND user.password=$password RETURN user', { email, password });
        session.close();
        return user.records.length > 0 ? user.records[0].get('user').properties : null;
    }

    // Gets the user via it's session, if it's not found returns null
    public static async getSession(userSession: string): Promise<DataUser> {
        const session = driver.session();
        const user = await session.run('MATCH (user:User) WHERE user.session=$session RETURN user', { session: userSession });
        session.close();
        return user.records.length > 0 ? user.records[0].get('user').properties : null;
    }

    // Gets if a user exists from it's email
    public static async existsEmail(email: string): Promise<boolean> {
        const session = driver.session();
        const user = await session.run('MATCH (user:User) WHERE user.email=$email RETURN user', { email });
        session.close();
        return user.records.length > 0 ? true : false;
    }

    public static async create(user: Omit<DataUser, 'uuid'>) {
        // First we define this object to add the generated uuid to the user
        const userProperties: DataUser = {
            uuid: uuid(),
            ...user
        };

        const session = driver.session();

        // We then create the user
        const query = 'CREATE (user:User $userProperties)';

        await session.run(query, { userProperties });
        session.close();

        // We also return the properties of the just created project
        return userProperties;
    }

    // Edits the given user, the uuid shouldn't be editable
    public static async edit(user: DataUser) {
        const session = driver.session();
        await session.run('MATCH (user:User) WHERE user.uuid=$uuid SET user+=$userProperties RETURN user', {
            uuid: user.uuid,
            userProperties: user
        });
        session.close();
        return user;
    }

    // Deletes the given user
    public static async delete(uuid: string) {
        const session = driver.session();
        // Starts by deleting every amounts of all of the user projects
        await session.run(`
            MATCH (user:User)-[:HasParentUser]-(project:Project)
            MATCH (project)<-[*0..]-(sub:Category)
            MATCH (sub)-[:AmountHasCategory]-(amount:Amount)
            WHERE user.uuid=$uuid
            DETACH DELETE amount
        `, { uuid });
        // Then deletes every categories of the user projects
        await session.run(`
            MATCH (user:User)-[:HasParentUser]-(project:Project)
            MATCH (project)<-[*0..]-(sub:Category)
            WHERE user.uuid=$uuid
            DETACH DELETE sub
        `, { uuid });
        // Then deletes every projects
        await session.run(`
            MATCH (user:User)-[:HasParentUser]-(project:Project)
            WHERE user.uuid=$uuid
            DETACH DELETE project
        `, { uuid });
        // Finally deletes itself
        await session.run('MATCH (user:User) WHERE user.uuid=$uuid DETACH DELETE user', { uuid });
        session.close();
    }

}