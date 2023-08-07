import { v4 as uuid } from 'uuid';
import { driver } from '..';
import { DataAmount } from './Amount';

export interface DataCategory {
    uuid: string,
    name: string
}

export interface DataCategoryWithAmount extends DataCategory {
    amounts: DataAmount[]
}

export interface DataCategoryWithAmountCalculated extends DataCategory {
    used: number,
    plannedUsed: number,
    gain: number,
    plannedGain: number,
    left: number
}

export interface DataCategoryWithSubCategory extends DataCategory {
    subCategories: DataCategory[]
}

export interface DataCategoryTreeWithSubCategoryWithAmount extends DataCategory {
    subCategories: DataCategoryWithAmount[]
}

export interface DataCategoryTreeWithSubCategoryWithAmountCalculated extends DataCategory {
    subCategories: DataCategoryWithAmountCalculated[]
}

export default class Category {

    public static async get(uuid: string): Promise<DataCategory> {
        const session = driver.session();
        const category = await session.run('MATCH (category:Category) WHERE category.uuid=$uuid RETURN category', { uuid });
        session.close();
        return category.records.length > 0 ? category.records[0].get('category').properties : null;
    }

    public static async getWithAmountCalculated(uuid: string, offset: number): Promise<DataCategoryWithAmountCalculated> {

        const start = new Date();
        start.setUTCDate(1);
        start.setUTCHours(0, 0, 0, 0);
        start.setUTCMonth(start.getUTCMonth() + (offset ?? 0));
        const startDateTime = start.getTime();
        
        const end = new Date();
        end.setUTCFullYear(start.getUTCFullYear(), start.getUTCMonth() + 1, 1);
        end.setUTCHours(0, 0, 0, 0);
        const endDateTime = end.getTime();

        const category = await this.get(uuid);

        const session = driver.session();
        const amountsQuery = await session.run(`
                MATCH (category:Category)-[*1..]-(amount:Amount)
                WHERE category.uuid=$uuid AND (amount.dateTime>=$startDateTime AND amount.dateTime<$endDateTime) OR (amount.planned="monthly" AND amount.dateTime<=$startDateTime)
                RETURN amount
            `, { uuid: category.uuid, startDateTime, endDateTime });
        session.close();

        const amounts = amountsQuery.records.map((record) => record.get('amount').properties) as DataAmount[];

        const used = amounts.filter((a) => a.gain == false && a.planned === 'no').reduce((acc, a) => acc + a.amount, 0);
        const plannedUsed = amounts.filter((a) => a.gain == false && a.planned === 'monthly').reduce((acc, a) => acc + a.amount, 0);
        const gain = amounts.filter((a) => a.gain == true && a.planned === 'no').reduce((acc, a) => acc + a.amount, 0);
        const plannedGain = amounts.filter((a) => a.gain == true && a.planned === 'monthly').reduce((acc, a) => acc + a.amount, 0);
        
        const left = (gain + plannedGain) - (used + plannedUsed);

        return {
            used, plannedUsed, gain, plannedGain, left,
            ...category
        };
    }

    public static async getCategoryTree(uuid: string): Promise<DataCategoryWithSubCategory | null> {
        const session = driver.session();

        let query = `
            MATCH (category:Category)<-[:HasParentCategory]-(sub_category:Category)
            WHERE category.uuid=$uuid
            RETURN category, sub_category
        `;

        if(uuid === 'main') query = `
                MATCH (category:Category)
                WHERE NOT (category)-[:HasParentCategory]->(:Category)
                RETURN category
            `;

        const result = await session.run(query, { uuid });
        session.close();

        if(result.records.length == 0) return { name: 'Main', uuid: 'main', subCategories: [] };

        const subCategories = result.records.map((record) => record.get('category').properties);

        return {
            name: 'Main',
            uuid: 'main',
            subCategories
        };
    }

    public static async getCategoryTreeWithAmount(uuid: string): Promise<DataCategoryTreeWithSubCategoryWithAmount | null> {

        const session = driver.session();

        let query = `
            MATCH (category:Category)<-[:HasParentCategory]-(sub_category:Category)
            WHERE category.uuid=$uuid
            RETURN category, sub_category
        `;

        if(uuid === 'main') query = `
                MATCH (sub_category:Category)
                WHERE NOT (sub_category)-[:HasParentCategory]->(:Category)
                RETURN sub_category
            `;

        const result = await session.run(query, { uuid });
        
        if(result.records.length == 0) {
            session.close();
            return {
                uuid: 'main',
                name: 'Main',
                subCategories: []
            };
        }

        const mainCategory = uuid !== 'main' ? result.records[0].get('category').properties : {
            name: 'Main',
            uuid: 'main'
        };
        const subCategories: DataCategoryWithAmount[] = [];
        for(const subCategoryRecord of result.records) {
            const subCategory = subCategoryRecord.get('sub_category').properties;
            const amountsQuery = await session.run(`
                MATCH (category:Category)-[*1..]-(amount:Amount)
                WHERE category.uuid=$uuid
                RETURN amount
            `, { uuid: subCategory.uuid });

            const amounts = amountsQuery.records.map((record) => record.get('amount').properties);
            
            subCategories.push({
                amounts,
                ...subCategory
            });
        }

        session.close();

        return {
            ...mainCategory,
            subCategories
        };
    }
    
    public static async getCategoryTreeWithAmountCalculated(uuid: string, offset: number): Promise<DataCategoryTreeWithSubCategoryWithAmountCalculated | null> {

        const session = driver.session();

        let query = `
            MATCH (category:Category)<-[:HasParentCategory]-(sub_category:Category)
            WHERE category.uuid=$uuid
            RETURN category, sub_category
        `;

        if(uuid === 'main') query = `
                MATCH (sub_category:Category)
                WHERE NOT (sub_category)-[:HasParentCategory]->(:Category)
                RETURN sub_category
            `;

        const result = await session.run(query, { uuid });
        
        if(result.records.length == 0) {
            session.close();
            if(uuid === 'main') return {
                uuid: 'main',
                name: 'Main',
                subCategories: []
            };
            else return { subCategories: [], ...await this.getWithAmountCalculated(uuid, offset) };
        }

        const start = new Date();
        start.setUTCDate(1);
        start.setUTCHours(0, 0, 0, 0);
        start.setUTCMonth(start.getUTCMonth() + (offset ?? 0));
        const startDateTime = start.getTime();
        
        const end = new Date();
        end.setUTCFullYear(start.getUTCFullYear(), start.getUTCMonth() + 1, 1);
        end.setUTCHours(0, 0, 0, 0);
        const endDateTime = end.getTime();

        const mainCategory = uuid !== 'main' ? result.records[0].get('category').properties : {
            name: 'Main',
            uuid: 'main'
        };

        const mainAmountsQuery = await session.run(`
                MATCH (category:Category)-[*1..]-(amount:Amount)
                WHERE category.uuid=$uuid AND (amount.dateTime>=$startDateTime AND amount.dateTime<$endDateTime) OR (amount.planned="monthly" AND amount.dateTime<=$startDateTime)
                RETURN amount
            `, { uuid: mainCategory.uuid, startDateTime, endDateTime });

        const mainAmounts = mainAmountsQuery.records.map((record) => record.get('amount').properties) as DataAmount[];

        const mainUsed = mainAmounts.filter((a) => a.gain == false && a.planned === 'no').reduce((acc, a) => acc + a.amount, 0);
        const mainPlannedUsed = mainAmounts.filter((a) => a.gain == false && a.planned === 'monthly').reduce((acc, a) => acc + a.amount, 0);
        const mainGain = mainAmounts.filter((a) => a.gain == true && a.planned === 'no').reduce((acc, a) => acc + a.amount, 0);
        const mainPlannedGain = mainAmounts.filter((a) => a.gain == true && a.planned === 'monthly').reduce((acc, a) => acc + a.amount, 0);
        
        const mainLeft = (mainGain + mainPlannedGain) - (mainUsed + mainPlannedUsed);

        const subCategories: DataCategoryWithAmountCalculated[] = [];
        for(const subCategoryRecord of result.records) {
            const subCategory = subCategoryRecord.get('sub_category').properties;
            const amountsQuery = await session.run(`
                MATCH (category:Category)<-[*0..]-(sub:Category)
                MATCH (sub)-[:AmountHasCategory]-(amount:Amount)
                WHERE category.uuid=$uuid AND (amount.dateTime>=$startDateTime AND amount.dateTime<$endDateTime) OR (amount.planned="monthly" AND amount.dateTime<=$startDateTime)
                RETURN amount
            `, { uuid: subCategory.uuid, startDateTime, endDateTime });

            const amounts = amountsQuery.records.map((record) => record.get('amount').properties) as DataAmount[];

            const used = amounts.filter((a) => a.gain == false && a.planned === 'no').reduce((acc, a) => acc + a.amount, 0);
            const plannedUsed = amounts.filter((a) => a.gain == false && a.planned === 'monthly').reduce((acc, a) => acc + a.amount, 0);
            const gain = amounts.filter((a) => a.gain == true && a.planned === 'no').reduce((acc, a) => acc + a.amount, 0);
            const plannedGain = amounts.filter((a) => a.gain == true && a.planned === 'monthly').reduce((acc, a) => acc + a.amount, 0);
            
            const left = (gain + plannedGain) - (used + plannedUsed);

            subCategories.push({
                used, plannedUsed, gain, plannedGain, left,
                ...subCategory
            });
        }

        session.close();

        return {
            ...mainCategory,
            used: mainUsed, plannedUsed: mainPlannedUsed, gain: mainGain, plannedGain: mainPlannedGain, left: mainLeft,
            subCategories
        };
    }

    public static async create(category: Omit<DataCategory, 'uuid'>, parent?: string) {
        const catagorieProperties: DataCategory = {
            ...category,
            uuid: uuid()
        };

        let query = 'CREATE (category:Category $catagorieProperties)';
        if(parent) query = `MATCH (parent_category:Category)
        WHERE parent_category.uuid=$parent
        CREATE (category:Category $catagorieProperties)-[:HasParentCategory]->(parent_category)`;

        const session = driver.session();
        await session.run(query, { catagorieProperties, parent });
        session.close();

        return catagorieProperties;
    }

    public static async edit(category: DataCategory) {
        const session = driver.session();
        await session.run('MATCH (category: Category) WHERE category.uuid=$uuid SET category+=$categoryProperties RETURN category', {
            uuid: category.uuid,
            categoryProperties: category
        });
        session.close();
        return category;
    }

    public static async delete(uuid: string) {
        const session = driver.session();
        await session.run(`
            MATCH (category:Category)<-[*0..]-(sub:Category)
            MATCH (sub)-[:AmountHasCategory]-(amount:Amount)
            WHERE category.uuid=$uuid
            DETACH DELETE amount
        `, { uuid });
        await session.run(`
            MATCH (category:Category)<-[*0..]-(sub:Category)
            WHERE category.uuid=$uuid
            DETACH DELETE sub
        `, { uuid });
        await session.run('MATCH (category: Category) WHERE category.uuid=$uuid DETACH DELETE category', { uuid });
        session.close();
    }

}