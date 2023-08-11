import { Total } from './Amount'

// Category Data Structure
export interface Category {
    uuid: string
    name: string
}

// Category with total Amounts
export interface CategoryWithAmounts extends Category, Total { }
