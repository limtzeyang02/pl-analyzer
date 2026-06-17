import { getDatabase } from "./db";
import { formatDateForSQL, parseDateFromSQL } from "./utils";
import type {
    BreakdownRecord,
    ComparisonRecord,
    DateRange,
    Interval,
    OverviewRecord,
    TransactionType,
} from "@/types";

export async function getOverviewRange(): Promise<DateRange> {
    const db = await getDatabase();
    const rows = await db.select<
        { min_date: string | null; max_date: string | null }[]
    >("SELECT MIN(date) AS min_date, MAX(date) AS max_date FROM cash_flow");
    const row = rows[0];

    return {
        min: row.min_date ? parseDateFromSQL(row.min_date) : null,
        max: row.max_date ? parseDateFromSQL(row.max_date) : null,
    };
}

export async function getOverview(
    interval: Interval,
    range: DateRange
): Promise<OverviewRecord[]> {
    const db = await getDatabase();
    // overview view already has integer year+month columns — no strftime needed
    const selectFields = interval === "Monthly" ? "year, month" : "year";
    const groupBy = interval === "Monthly" ? "year, month" : "year";

    const params: unknown[] = [];
    let whereClause = "";

    if (range.min && range.max) {
        // Filter by the YYYYMM integer range since overview has no date column
        params.push(formatDateForSQL(range.min), formatDateForSQL(range.max));
        whereClause = `WHERE (year * 100 + month) BETWEEN
            (CAST(strftime('%Y', $1) AS INTEGER) * 100 + CAST(strftime('%m', $1) AS INTEGER))
            AND
            (CAST(strftime('%Y', $2) AS INTEGER) * 100 + CAST(strftime('%m', $2) AS INTEGER))`;
    }

    const rows = await db.select<OverviewRecord[]>(
        `SELECT ${selectFields},
                SUM(buy_weight) AS buy_weight,
                SUM(buy_price) AS buy_price,
                CASE WHEN SUM(buy_weight) = 0 THEN 0 ELSE SUM(buy_price) / SUM(buy_weight) END AS buy_average_price,
                SUM(sell_weight) AS sell_weight,
                SUM(sell_price) AS sell_price,
                CASE WHEN SUM(sell_weight) = 0 THEN 0 ELSE SUM(sell_price) / SUM(sell_weight) END AS sell_average_price,
                SUM(stock_weight) AS stock_weight,
                SUM(salary) AS salary,
                SUM(expenses) AS expenses,
                SUM(petty_cash) AS petty_cash,
                SUM(profit_loss) AS profit_loss
         FROM overview
         ${whereClause}
         GROUP BY ${groupBy}
         ORDER BY ${groupBy}`,
        params
    );

    return rows;
}

export async function getOverviewBreakdown(
    _interval: Interval,
    range: DateRange
): Promise<BreakdownRecord[]> {
    const db = await getDatabase();

    const params: unknown[] = [];
    let whereClause = "";

    if (range.min && range.max) {
        // overview_categories has integer year+month, not a date column — compare as YYYYMM
        params.push(formatDateForSQL(range.min), formatDateForSQL(range.max));
        whereClause = `WHERE (year * 100 + month) BETWEEN
            (CAST(strftime('%Y', $1) AS INTEGER) * 100 + CAST(strftime('%m', $1) AS INTEGER))
            AND
            (CAST(strftime('%Y', $2) AS INTEGER) * 100 + CAST(strftime('%m', $2) AS INTEGER))`;
    }

    const rows = await db.select<BreakdownRecord[]>(
        `SELECT category,
                SUM(weight) AS weight,
                SUM(price) AS price,
                CASE WHEN SUM(weight) = 0 THEN 0 ELSE SUM(price) / SUM(weight) END AS average_price
         FROM overview_categories
         ${whereClause}
         GROUP BY category
         ORDER BY SUM(weight) DESC`,
        params
    );

    return rows;
}

export async function getPeriodComparison(
    type: TransactionType,
    range1: [Date, Date],
    range2: [Date, Date]
): Promise<ComparisonRecord[]> {
    const db = await getDatabase();
    const t =
        type === "purchases" ? "transaction_purchases" : "transaction_sales";
    const it = type === "purchases" ? "item_purchases" : "item_sales";

    const [r1start, r1end] = range1;
    const [r2start, r2end] = range2;

    const rows1 = await db.select<
        { category: string; weight: number; price: number }[]
    >(
        `SELECT c.name AS category, SUM(tx.weight) AS weight, SUM(tx.price) AS price
         FROM ${t} tx
         JOIN ${it} i ON i.id = tx.item
         JOIN item_categories c ON c.id = i.category
         WHERE tx.date BETWEEN $1 AND $2
         GROUP BY c.name`,
        [formatDateForSQL(r1start), formatDateForSQL(r1end)]
    );

    const rows2 = await db.select<
        { category: string; weight: number; price: number }[]
    >(
        `SELECT c.name AS category, SUM(tx.weight) AS weight, SUM(tx.price) AS price
         FROM ${t} tx
         JOIN ${it} i ON i.id = tx.item
         JOIN item_categories c ON c.id = i.category
         WHERE tx.date BETWEEN $1 AND $2
         GROUP BY c.name`,
        [formatDateForSQL(r2start), formatDateForSQL(r2end)]
    );

    // Build a Map keyed on category for O(1) lookups — replaces O(n²) indexOf pattern
    const map2 = new Map(rows2.map((r) => [r.category, r]));

    // Collect all categories from both periods
    const allCategories = new Set([
        ...rows1.map((r) => r.category),
        ...rows2.map((r) => r.category),
    ]);

    const map1 = new Map(rows1.map((r) => [r.category, r]));

    const result: ComparisonRecord[] = [];

    for (const category of allCategories) {
        const r1 = map1.get(category);
        const r2 = map2.get(category);
        const weight1 = r1?.weight ?? 0;
        const price1 = r1?.price ?? 0;
        const weight2 = r2?.weight ?? 0;
        const price2 = r2?.price ?? 0;
        result.push({
            category,
            weight1,
            price1,
            average_price1: weight1 === 0 ? 0 : price1 / weight1,
            weight2,
            price2,
            average_price2: weight2 === 0 ? 0 : price2 / weight2,
        });
    }

    return result;
}
