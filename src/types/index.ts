export * from "./navigation";

export type TransactionType = 'purchases' | 'sales'
export type Interval = 'Monthly' | 'Yearly'

export interface Category {
    id: number
    name: string
    ferous: boolean
}

export interface Item {
    id: number
    description: string
    category: number          // FK to Category.id
    category_name?: string    // joined field from DB query
}

export interface CashFlow {
    date: Date
    year: number
    month: number
    salary: number
    expenses: number
    petty_cash: number
    profit_loss: number       // computed by DB; never sent on write
}

export interface Transaction {
    id?: number
    date: Date
    item_id: number
    item?: string             // joined from items table
    category?: string         // joined from categories table
    weight: number
    price: number
}

export interface OverviewRecord {
    year: number
    month?: number            // absent when interval = 'Yearly'
    buy_weight: number
    buy_price: number
    buy_average_price: number
    sell_weight: number
    sell_price: number
    sell_average_price: number
    stock_weight: number
    salary: number
    expenses: number
    petty_cash: number
    profit_loss: number
}

export interface DateRange {
    min: Date | null
    max: Date | null
}

export interface BreakdownRecord {
    category: string
    weight: number
    price: number
    average_price: number
}

export interface ComparisonRecord {
    category: string
    weight1: number
    price1: number
    average_price1: number
    weight2: number
    price2: number
    average_price2: number
}

export type FieldType = 'text' | 'month' | 'year' | 'date' | 'currency' | 'weight' | 'select'

export interface FieldDef {
    id: string
    label: string
    type: FieldType
    required?: boolean
    min?: number
    max?: number
    options?: { label: string; value: unknown }[]
}

export interface ImportFieldDef {
    name: string
    label: string
    type: 'date' | 'month' | 'year' | 'numeric' | 'string'
    mapping: string | null    // Excel column header to read from
}
