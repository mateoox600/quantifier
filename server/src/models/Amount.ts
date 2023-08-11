import { v4 as uuid } from 'uuid';
import { driver } from '..';
import { getMonthStartAndEnd } from '../utils/Time';

// Amount data structure
export interface DataAmount {
    uuid: string,
    amount: number,
    dateTime: number,
    gain: boolean,
    planned: 'no' | 'monthly',
    description: string
}

export default class Amount {

    public static plannedPossibilities = [
        'no', 'monthly'
    ];

    // Gets the amount via it's uuid, if it's not found returns null
    public static async get(uuid: string): Promise<DataAmount> {
        const session = driver.session();
        const amount = await session.run('MATCH (amount:Amount) WHERE amount.uuid=$uuid RETURN amount', { uuid: uuid });
        session.close();
        return amount.records.length > 0 ? amount.records[0].get('amount').properties : null;
    }

    // Gets every amounts of the whole database
    public static async getAll(): Promise<DataAmount[]> {
        const session = driver.session();
        const amounts = await session.run('MATCH (amount:Amount) RETURN amount');
        session.close();
        return amounts.records.map((record) => record.get('amount').properties);
    }

    // Gets all amounts for a month with an offset
    public static async getAllMonthly(offset: number): Promise<DataAmount[]> {
        const { start: startDateTime, end: endDateTime } = getMonthStartAndEnd(offset);
    
        const session = driver.session();
        const amounts = await session.run('MATCH (amount:Amount) WHERE (amount.dateTime>=$startDateTime AND amount.dateTime<$endDateTime) OR (amount.planned="monthly" AND amount.dateTime<=$startDateTime) RETURN amount', { startDateTime, endDateTime });
        session.close();

        return amounts.records.map((record) => record.get('amount').properties);
    }

    // Gets all gains amounts for a month with an offset
    public static async getAllMonthlyGains(offset: number): Promise<DataAmount[]> {
        const { start: startDateTime, end: endDateTime } = getMonthStartAndEnd(offset);
    
        const session = driver.session();
        const gains = await session.run('MATCH (amount:Amount) WHERE amount.gain=true AND amount.planned="no" AND amount.dateTime>=$startDateTime AND amount.dateTime<$endDateTime RETURN amount', { startDateTime, endDateTime });
        session.close();

        return gains.records.map((record) => record.get('amount').properties);
    }

    // Gets gains total for a month with an offset
    public static async getAllMonthlyGainsTotal(offset: number) {
        const total = (await this.getAllMonthlyGains(offset)).reduce((acc, gain) => acc + gain.amount, 0);
        return total;
    }

    // Gets all used amounts for a month with an offset
    public static async getAllMonthlyUsed(offset: number): Promise<DataAmount[]> {
        const { start: startDateTime, end: endDateTime } = getMonthStartAndEnd(offset);
    
        const session = driver.session();
        const useds = await session.run('MATCH (amount:Amount) WHERE amount.gain=false AND amount.planned="no" AND amount.dateTime>=$startDateTime AND amount.dateTime<$endDateTime RETURN amount', { startDateTime, endDateTime });
        session.close();

        return useds.records.map((record) => record.get('amount').properties);
    }

    // Gets used total for a month with an offset
    public static async getAllMonthlyUsedTotal(offset: number) {
        const total = (await this.getAllMonthlyUsed(offset)).reduce((acc, used) => acc + used.amount, 0);
        return total;
    }

    // Gets all planned gains amounts for a month with an offset
    public static async getAllMonthlyGainPlanned(offset: number): Promise<DataAmount[]> {
        const { start: startDateTime } = getMonthStartAndEnd(offset);
        const session = driver.session();
        const gains = await session.run('MATCH (amount:Amount) WHERE amount.gain=true AND amount.planned="monthly" AND amount.dateTime<=$startDateTime RETURN amount', { startDateTime });
        session.close();

        return gains.records.map((record) => record.get('amount').properties);
    }

    // Gets planned gains total for a month with an offset
    public static async getAllMonthlyGainPlannedTotal(offset: number) {
        const total = (await this.getAllMonthlyGainPlanned(offset)).reduce((acc, gain) => acc + gain.amount, 0);
        return total;
    }

    // Gets all planned used amounts for a month with an offset
    public static async getAllMonthlyUsedPlanned(offset: number): Promise<DataAmount[]> {
        const { start: startDateTime } = getMonthStartAndEnd(offset);
        const session = driver.session();
        const useds = await session.run('MATCH (amount:Amount) WHERE amount.gain=false AND amount.planned="monthly" AND amount.dateTime<=$startDateTime RETURN amount', { startDateTime });
        session.close();

        return useds.records.map((record) => record.get('amount').properties);
    }

    // Gets planned used total for a month with an offset
    public static async getAllMonthlyUsedPlannedTotal(offset: number) {
        const total = (await this.getAllMonthlyUsedPlanned(offset)).reduce((acc, used) => acc + used.amount, 0);
        return total;
    }

    public static async create(amount: Omit<DataAmount, 'uuid'>, category?: string) {
        // First we define this object to add the generated uuid to the amount
        const amountProperties = {
            uuid: uuid(),
            ...amount
        };

        const session = driver.session();

        // We then create the amount
        // If there are no parent category we just create it (= to creating it with main as category)
        // Else we create the amount, with a relation to it's category
        const query = !category ? 'CREATE (amount:Amount $amountProperties)' : `
            MATCH (category:Category)
            WHERE category.uuid=$category
            CREATE (amount:Amount $amountProperties)-[:AmountHasCategory]->(category)
        `;

        await session.run(query, { amountProperties, category });
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