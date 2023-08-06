import { Total } from './Amount'

export interface Category {
    uuid: string
    name: string
}

export interface CategoryWithAmounts extends Category, Total { }
