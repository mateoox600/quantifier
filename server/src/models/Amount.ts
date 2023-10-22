import { v4 as uuid } from 'uuid';
import { driver } from '..';
import { getMonthStartAndEnd } from '../utils/Time';

// Amount data structure
export interface DataAmount {
    uuid: string,
    amount: number,
    dateTime: number,
    endDateTime?: number,
    gain: boolean,
    planned: boolean,
    description: string
}

export default class Amount {

    // Check if a user can access that amount
    public static async access(uuid: string, user: string): Promise<boolean> {
        const session = driver.session();
        const project = await session.run(`
            MATCH (user:User)-[*0..]-(amount:Amount)
            WHERE amount.uuid=$uuid AND user.uuid=$user
            RETURN amount
        `, { uuid, user });
        session.close();
        return project.records.length > 0 ? true : false;
    }

    // Gets the amount via it's uuid, if it's not found returns null
    public static async get(uuid: string): Promise<DataAmount> {
        const session = driver.session();
        const amount = await session.run('MATCH (amount:Amount) WHERE amount.uuid=$uuid RETURN amount', { uuid: uuid });
        session.close();
        return amount.records.length > 0 ? amount.records[0].get('amount').properties : null;
    }

    // Gets every amounts of a project
    public static async getAll(project: string): Promise<DataAmount[]> {
        const session = driver.session();
        const amounts = await session.run(`
            MATCH (amount:Amount)
            MATCH (amount)-[*0..]->(project:Project)
            WHERE project.uuid=$projectUuid
            RETURN amount
        `, { projectUuid: project });
        session.close();
        return amounts.records.map((record) => record.get('amount').properties);
    }

    // Gets all amounts for a project for a month with an offset
    public static async getAllMonthly(project: string, offset: number): Promise<DataAmount[]> {
        const { start: startDateTime, end: endDateTime } = getMonthStartAndEnd(offset);
    
        const session = driver.session();
        const amounts = await session.run(`
            MATCH (amount:Amount)
            MATCH (amount)-[*0..]->(project:Project)
            WHERE project.uuid=$projectUuid
            AND (
                (amount.dateTime>=$startDateTime AND amount.dateTime<$endDateTime)
                OR (amount.planned=true AND amount.dateTime<=$endDateTime AND (amount.endDateTime >= $endDateTime OR amount.endDateTime=-1))
            )
            OPTIONAL MATCH (amount)-[:AmountHasCategory]->(category:Category)
            RETURN amount, category
        `, { startDateTime, endDateTime, projectUuid: project });
        session.close();

        return amounts.records.map((record) => {
            return {
                ...record.get('amount').properties,
                parent: (record.get('category') ?? { properties: { name: 'Main', uuid: 'main' } }).properties
            };
        });
    }

    // Gets all gains amounts for a project for a month with an offset
    public static async getAllMonthlyGains(project: string, offset: number): Promise<DataAmount[]> {
        const { start: startDateTime, end: endDateTime } = getMonthStartAndEnd(offset);
    
        const session = driver.session();
        const gains = await session.run(`
            MATCH (amount:Amount)
            MATCH (amount)-[*0..]->(project:Project)
            WHERE project.uuid=$projectUuid
            AND amount.gain=true AND amount.planned=false AND amount.dateTime>=$startDateTime AND amount.dateTime<$endDateTime
            RETURN amount
        `, { startDateTime, endDateTime, projectUuid: project });
        session.close();

        return gains.records.map((record) => record.get('amount').properties);
    }

    // Gets gains total for a project for a month with an offset
    public static async getAllMonthlyGainsTotal(project: string, offset: number) {
        const total = (await this.getAllMonthlyGains(project, offset)).reduce((acc, gain) => acc + gain.amount, 0);
        return total;
    }

    // Gets all used amounts for a project for a month with an offset
    public static async getAllMonthlyUsed(project: string, offset: number): Promise<DataAmount[]> {
        const { start: startDateTime, end: endDateTime } = getMonthStartAndEnd(offset);
    
        const session = driver.session();
        const useds = await session.run(`
            MATCH (amount:Amount)
            MATCH (amount)-[*0..]->(project:Project)
            WHERE project.uuid=$projectUuid
            AND amount.gain=false AND amount.planned=false AND amount.dateTime>=$startDateTime AND amount.dateTime<$endDateTime
            RETURN amount
        `, { startDateTime, endDateTime, projectUuid: project });
        session.close();

        return useds.records.map((record) => record.get('amount').properties);
    }

    // Gets used total for a project for a month with an offset
    public static async getAllMonthlyUsedTotal(project: string, offset: number) {
        const total = (await this.getAllMonthlyUsed(project, offset)).reduce((acc, used) => acc + used.amount, 0);
        return total;
    }

    // Gets all planned gains amounts for a project for a month with an offset
    public static async getAllMonthlyGainPlanned(project: string, offset: number): Promise<DataAmount[]> {
        const { end: endDateTime } = getMonthStartAndEnd(offset);
        const session = driver.session();
        const gains = await session.run(`
            MATCH (amount:Amount)
            MATCH (amount)-[*0..]->(project:Project)
            WHERE project.uuid=$projectUuid
            AND amount.gain=true AND amount.planned=true AND amount.dateTime<=$endDateTime AND (amount.endDateTime >= $endDateTime OR amount.endDateTime=-1)
            RETURN amount
        `, { endDateTime, projectUuid: project });
        session.close();

        return gains.records.map((record) => record.get('amount').properties);
    }

    // Gets planned gains total for a project for a month with an offset
    public static async getAllMonthlyGainPlannedTotal(project: string, offset: number) {
        const total = (await this.getAllMonthlyGainPlanned(project, offset)).reduce((acc, gain) => acc + gain.amount, 0);
        return total;
    }

    // Gets all planned used amounts for a project for a month with an offset
    public static async getAllMonthlyUsedPlanned(project: string, offset: number): Promise<DataAmount[]> {
        const { end: endDateTime } = getMonthStartAndEnd(offset);
        const session = driver.session();
        const useds = await session.run(`
            MATCH (amount:Amount)
            MATCH (amount)-[*0..]->(project:Project)
            WHERE project.uuid=$projectUuid
            AND amount.gain=false AND amount.planned=true AND amount.dateTime<=$endDateTime AND (amount.endDateTime >= $endDateTime OR amount.endDateTime=-1)
            RETURN amount
        `, { endDateTime, projectUuid: project });
        session.close();

        return useds.records.map((record) => record.get('amount').properties);
    }

    // Gets planned used total for a project for a month with an offset
    public static async getAllMonthlyUsedPlannedTotal(project: string, offset: number) {
        const total = (await this.getAllMonthlyUsedPlanned(project, offset)).reduce((acc, used) => acc + used.amount, 0);
        return total;
    }

    public static async create(amount: Omit<DataAmount, 'uuid' | 'endDateTime'>, project: string, category?: string) {
        // First we define this object to add the generated uuid to the amount
        const amountProperties: DataAmount = {
            uuid: uuid(),
            ...amount
        };

        if(amount.planned) amountProperties.endDateTime = -1;

        const session = driver.session();

        // We then create the amount
        // If there are no parent category we create it with a relation to the project
        // Else we create the amount, with a relation to it's category
        const query = !category ? `
            MATCH (project:Project)
            WHERE project.uuid=$projectUuid
            CREATE (amount:Amount $amountProperties)-[:AmountHasProject]->(project)
        ` : `
            MATCH (category:Category)
            WHERE category.uuid=$category
            CREATE (amount:Amount $amountProperties)-[:AmountHasCategory]->(category)
        `;

        await session.run(query, { amountProperties, category, projectUuid: project });
        session.close();

        // We also return the properties of the just created amount
        return amountProperties;
    }

    // Edits the given amount, the uuid shouldn't be editable
    public static async edit(amount: DataAmount) {
        const session = driver.session();
        await session.run('MATCH (amount: Amount) WHERE amount.uuid=$uuid SET amount+=$amountProperties RETURN amount', {
            uuid: amount.uuid,
            amountProperties: amount
        });
        session.close();
        return amount;
    }

    // Deletes the given amount
    public static async delete(uuid: string) {
        const session = driver.session();
        await session.run('MATCH (amount:Amount) WHERE amount.uuid=$uuid DETACH DELETE amount', { uuid });
        session.close();
    }

}