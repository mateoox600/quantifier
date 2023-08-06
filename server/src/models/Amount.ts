import { v4 as uuid } from 'uuid';
import { driver } from '..';

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

    public static async get(uuid: string): Promise<DataAmount> {
        const session = driver.session();
        const amount = await session.run('MATCH (amount:Amount) WHERE amount.uuid=$uuid RETURN amount', { uuid: uuid });
        session.close();
        return amount.records.length > 0 ? amount.records[0].get('amount').properties : null;
    }

    public static async getAll(): Promise<DataAmount[]> {
        const session = driver.session();
        const amounts = await session.run('MATCH (amount:Amount) RETURN amount');
        session.close();
        return amounts.records.map((record) => record.get('amount').properties);
    }

    public static async getAllMonthly(): Promise<DataAmount[]> {
        const start = new Date();
        start.setUTCDate(1);
        start.setUTCHours(0, 0, 0, 0);
        const startDateTime = start.getTime();
        
        const end = new Date();
        end.setUTCMonth(start.getUTCMonth() + 1, 1);
        end.setUTCHours(0, 0, 0, 0);
        const endDateTime = end.getTime();
    
        const session = driver.session();
        const amounts = await session.run('MATCH (amount:Amount) WHERE amount.dateTime>=$startDateTime AND amount.dateTime<$endDateTime RETURN amount', { startDateTime, endDateTime });
        session.close();

        return amounts.records.map((record) => record.get('amount').properties);
    }

    public static async getAllMonthlyGains(): Promise<DataAmount[]> {
        const start = new Date();
        start.setUTCDate(1);
        start.setUTCHours(0, 0, 0, 0);
        const startDateTime = start.getTime();
        
        const end = new Date();
        end.setUTCMonth(start.getUTCMonth() + 1, 1);
        end.setUTCHours(0, 0, 0, 0);
        const endDateTime = end.getTime();
    
        const session = driver.session();
        const gains = await session.run('MATCH (amount:Amount) WHERE amount.gain=true AND amount.planned="no" AND amount.dateTime>=$startDateTime AND amount.dateTime<$endDateTime RETURN amount', { startDateTime, endDateTime });
        session.close();

        return gains.records.map((record) => record.get('amount').properties);
    }

    public static async getAllMonthlyGainsTotal() {
        const total = (await this.getAllMonthlyGains()).reduce((acc, gain) => acc + gain.amount, 0);
        return total;
    }

    public static async getAllMonthlyUsed(): Promise<DataAmount[]> {    
        const start = new Date();
        start.setUTCDate(1);
        start.setUTCHours(0, 0, 0, 0);
        const startDateTime = start.getTime();
        
        const end = new Date();
        end.setUTCMonth(start.getUTCMonth() + 1, 1);
        end.setUTCHours(0, 0, 0, 0);
        const endDateTime = end.getTime();
    
        const session = driver.session();
        const useds = await session.run('MATCH (amount:Amount) WHERE amount.gain=false AND amount.planned="no" AND amount.dateTime>=$startDateTime AND amount.dateTime<$endDateTime RETURN amount', { startDateTime, endDateTime });
        session.close();

        return useds.records.map((record) => record.get('amount').properties);
    }

    public static async getAllMonthlyUsedTotal() {
        const total = (await this.getAllMonthlyUsed()).reduce((acc, used) => acc + used.amount, 0);
        return total;
    }

    public static async getAllMonthlyGainPlanned(): Promise<DataAmount[]> {
        const session = driver.session();
        const gains = await session.run('MATCH (amount:Amount) WHERE amount.gain=true AND amount.planned="monthly" RETURN amount', { });
        session.close();

        return gains.records.map((record) => record.get('amount').properties);
    }

    public static async getAllMonthlyGainPlannedTotal() {
        const total = (await this.getAllMonthlyGainPlanned()).reduce((acc, gain) => acc + gain.amount, 0);
        return total;
    }

    public static async getAllMonthlyUsedPlanned(): Promise<DataAmount[]> {
        const session = driver.session();
        const useds = await session.run('MATCH (amount:Amount) WHERE amount.gain=false AND amount.planned="monthly" RETURN amount', { });
        session.close();

        return useds.records.map((record) => record.get('amount').properties);
    }

    public static async getAllMonthlyUsedPlannedTotal() {
        const total = (await this.getAllMonthlyUsedPlanned()).reduce((acc, used) => acc + used.amount, 0);
        return total;
    }

    public static async create(amount: Omit<DataAmount, 'uuid'>, category?: string) {
        const amountProperties = {
            uuid: uuid(),
            ...amount
        };

        const session = driver.session();

        let query = 'CREATE (amount:Amount $amountProperties)';

        if(category) query = `
            MATCH (category:Category)
            WHERE category.uuid=$category
            CREATE (amount:Amount $amountProperties)-[:AmountHasCategory]->(category)
        `;

        await session.run(query, { amountProperties, category });
        session.close();

        return amountProperties;
    }

    public static async edit(amount: DataAmount) {
        const session = driver.session();
        await session.run('MATCH (amount: Amount) WHERE amount.uuid=$uuid SET amount+=$amountProperties RETURN amount', {
            uuid: amount.uuid,
            amountProperties: amount
        });
        session.close();
        return amount;
    }

    public static async delete(uuid: string) {
        const session = driver.session();
        await session.run('MATCH (amount:Amount) WHERE amount.uuid=$uuid DETACH DELETE amount', { uuid });
        session.close();
    }

}