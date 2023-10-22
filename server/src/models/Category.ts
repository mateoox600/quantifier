import { v4 as uuid } from 'uuid';
import { driver } from '..';
import { DataAmount } from './Amount';
import { getMonthStartAndEnd } from '../utils/Time';

// Category data structure
export interface DataCategory {
    uuid: string,
    name: string
}

// Category data structure with amounts
export interface DataCategoryWithAmount extends DataCategory {
    used: number,
    plannedUsed: number,
    gain: number,
    plannedGain: number,
    left: number
}

// Category tree data structure with amounts
export interface DataCategoryTree extends DataCategoryWithAmount {
    subCategories: DataCategoryWithAmount[]
}

export default class Category {

    // Check if a user can access that category
    public static async access(uuid: string, user: string): Promise<boolean> {
        const session = driver.session();
        const project = await session.run(`
            MATCH (user:User)-[*0..]-(category:Category)
            WHERE category.uuid=$uuid AND user.uuid=$user
            RETURN category
        `, { uuid, user });
        session.close();
        return project.records.length > 0 ? true : false;
    }

    public static async get(uuid: string): Promise<DataCategory> {
        // If the uuid of the category to get is main return the default main category
        if(uuid === 'main') return { name: 'Main', uuid: 'main' };

        // Else get the category by it's uuid and return it, if it doesn't exist return null
        const session = driver.session();
        const category = await session.run('MATCH (category:Category) WHERE category.uuid=$uuid RETURN category', { uuid });
        session.close();

        return category.records.length > 0 ? category.records[0].get('category').properties : null;
    }

    public static async getWithAmount(uuid: string, project: string, offset: number): Promise<DataCategoryWithAmount> {
        // Gets the start time and end time of the month, with the current offset
        const { start: startDateTime, end: endDateTime } = getMonthStartAndEnd(offset);

        // Gets the category by it's uuid
        const category = await this.get(uuid);

        // Then it gets every amounts from this category and it's sub categories
        const session = driver.session();
        const amountsQuery = await session.run(category.uuid === 'main' ? `
                MATCH (project:Project)<-[*1..]-(amount:Amount)
                WHERE project.uuid=$projectUuid
                AND (
                    (amount.dateTime>=$startDateTime AND amount.dateTime<$endDateTime) OR
                    (amount.planned=true AND amount.dateTime<=$endDateTime AND (amount.endDateTime >= $endDateTime OR amount.endDateTime=-1))
                )
                RETURN amount
        ` : `
                MATCH (category:Category)<-[*1..]-(amount:Amount)
                WHERE category.uuid=$uuid
                AND (
                    (amount.dateTime>=$startDateTime AND amount.dateTime<$endDateTime) OR
                    (amount.planned=true AND amount.dateTime<=$endDateTime AND (amount.endDateTime >= $endDateTime OR amount.endDateTime=-1))
                )
                RETURN amount
            `, { uuid: category.uuid, projectUuid: project, startDateTime, endDateTime });
        session.close();

        // Filters and reduce them for used, planned used, gains and planned gains
        const amounts = amountsQuery.records.map((record) => record.get('amount').properties) as DataAmount[];

        const used = amounts.filter((a) => a.gain == false && !a.planned).reduce((acc, a) => acc + a.amount, 0);
        const plannedUsed = amounts.filter((a) => a.gain == false && a.planned).reduce((acc, a) => acc + a.amount, 0);
        const gain = amounts.filter((a) => a.gain == true && !a.planned).reduce((acc, a) => acc + a.amount, 0);
        const plannedGain = amounts.filter((a) => a.gain == true && a.planned).reduce((acc, a) => acc + a.amount, 0);
        
        // Calculate left overs
        const left = (gain + plannedGain) - (used + plannedUsed);

        // Return the category with it's amounts
        return {
            used, plannedUsed, gain, plannedGain, left,
            ...category
        };
    }

    public static async getCategoryTree(uuid: string, project: string, offset: number): Promise<DataCategoryTree | null> {

        const session = driver.session();

        // Gets every sub categries for the category uuid passed
        // If the category is not main we get every category that has the current category as a parent
        // Else we get every category with the project as a parent
        const query = uuid !== 'main' ? `
            MATCH (category:Category)<-[:HasParentCategory]-(sub_category:Category)
            WHERE category.uuid=$uuid
            RETURN category, sub_category
        ` : `
            MATCH (project:Project)<-[:HasParentProject]-(sub_category:Category)
            WHERE project.uuid=$projectUuid
            RETURN sub_category
        `;

        const result = await session.run(query, { uuid, projectUuid: project });
        
        // If no category is returned, then there are no sub categories, so we just return the current category and it's amounts
        if(result.records.length == 0) {
            session.close();
            return { subCategories: [], ...await this.getWithAmount(uuid, project, offset) };
        }

        // Else we get the start and end of the month with the offset, then we build the main category object
        const { start: startDateTime, end: endDateTime } = getMonthStartAndEnd(offset);

        // If we are in the main category it defaults to main for the uuid and name field else it gets the category infos from the query
        const mainCategory = uuid !== 'main' ? result.records[0].get('category').properties : {
            name: 'Main',
            uuid: 'main'
        };

        // Then we get the amounts for the current category
        const mainAmounts = await this.getWithAmount(mainCategory.uuid, project, offset);

        // This list with contain every sub categories and it's amounts
        const subCategories: DataCategoryWithAmount[] = [];
        // We then loop over every sub categories found in the previous query
        for(const subCategoryRecord of result.records) {
            // We then get every amounts from this sub category and it's own sub categories, until we have all of the amounts of that "tree"
            const subCategory = subCategoryRecord.get('sub_category').properties;
            const amountsQuery = await session.run(`
                MATCH (category:Category)<-[*0..]-(sub:Category)
                MATCH (sub)-[:AmountHasCategory]-(amount:Amount)
                WHERE category.uuid=$uuid AND (amount.dateTime>=$startDateTime AND amount.dateTime<$endDateTime) OR
                    (amount.planned=true AND amount.dateTime<=$endDateTime AND (amount.endDateTime >= $endDateTime OR amount.endDateTime=-1))
                RETURN amount
            `, { uuid: subCategory.uuid, startDateTime, endDateTime });

            // We then get them from the query
            const amounts = amountsQuery.records.map((record) => record.get('amount').properties) as DataAmount[];

            // Then we filter and reduce them to get the used, planned used, gains and planned gains of the sub category
            const used = amounts.filter((a) => a.gain == false && !a.planned).reduce((acc, a) => acc + a.amount, 0);
            const plannedUsed = amounts.filter((a) => a.gain == false && a.planned).reduce((acc, a) => acc + a.amount, 0);
            const gain = amounts.filter((a) => a.gain == true && !a.planned).reduce((acc, a) => acc + a.amount, 0);
            const plannedGain = amounts.filter((a) => a.gain == true && a.planned).reduce((acc, a) => acc + a.amount, 0);
            
            // We calculate the left overs
            const left = (gain + plannedGain) - (used + plannedUsed);

            // Finally we add that sub category and it's amounts to the sub categories list
            subCategories.push({
                used, plannedUsed, gain, plannedGain, left,
                ...subCategory
            });
        }

        session.close();

        // To finish everything we return the main category, with it's amounts, and it's sub categories
        return {
            ...mainAmounts,
            ...mainCategory,
            subCategories
        };
    }

    public static async create(category: Omit<DataCategory, 'uuid'>, project: string, parent?: string) {
        // First we define this object to add the generated uuid to the category
        const catagorieProperties: DataCategory = {
            ...category,
            uuid: uuid()
        };

        // We then create the category
        // If there are no parent we create it with a relation to the project
        // Else we create the category, with a relation to it's parent category
        const query = !parent ? `
            MATCH (project:Project)
            WHERE project.uuid=$projectUuid
            CREATE (category:Category $catagorieProperties)-[:HasParentProject]->(project)
        ` : `
            MATCH (parent_category:Category)
            WHERE parent_category.uuid=$parent
            CREATE (category:Category $catagorieProperties)-[:HasParentCategory]->(parent_category)`;

        const session = driver.session();
        await session.run(query, { catagorieProperties, parent, projectUuid: project });
        session.close();

        // We also return the properties of the just created category
        return catagorieProperties;
    }

    // Edits the given category, the uuid shouldn't be editable
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
        // Starts by deleting every amounts of itself and of it's sub categories
        await session.run(`
            MATCH (category:Category)<-[*0..]-(sub:Category)
            MATCH (sub)-[:AmountHasCategory]-(amount:Amount)
            WHERE category.uuid=$uuid
            DETACH DELETE amount
        `, { uuid });
        // Then deletes every sub categories
        await session.run(`
            MATCH (category:Category)<-[*0..]-(sub:Category)
            WHERE category.uuid=$uuid
            DETACH DELETE sub
        `, { uuid });
        // Finally deletes itself
        await session.run('MATCH (category: Category) WHERE category.uuid=$uuid DETACH DELETE category', { uuid });
        session.close();
    }

}