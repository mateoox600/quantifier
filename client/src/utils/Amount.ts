import { Category } from './Category'

// Amount Data Structure
export interface Amount {
    uuid: string,
    amount: number,
    gain: boolean,
    planned: boolean,
    dateTime: number,
    endDateTime?: number,
    description: string
}

// Amount with parent category
export interface AmountWithParent extends Amount {
    parent: Category
}

// Total Amounts Data Structure
export interface Total {
    gain: number,
    used: number,
    plannedGain: number,
    plannedUsed: number,
    left: number
}