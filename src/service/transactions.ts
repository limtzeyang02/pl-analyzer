import { getDatabase } from "./db";
import { formatDateForSQL, parseDateFromSQL } from "./utils";
import type { Transaction, TransactionType } from "@/types";
import { toTitleCase } from "@/utils/text";

interface TransactionRow {
    id: number;
    date: string;
    item_id: number;
    item: string;
    category: string;
    weight: number;
    price: number;
}

function table(type: TransactionType): string {
    return type === "purchases" ? "transaction_purchases" : "transaction_sales";
}

function itemTable(type: TransactionType): string {
    return type === "purchases" ? "item_purchases" : "item_sales";
}

export async function getTransactions(
    type: TransactionType
): Promise<Transaction[]> {
    const db = await getDatabase();
    const t = table(type);
    const it = itemTable(type);
    const rows = await db.select<TransactionRow[]>(
        `SELECT tx.id, tx.date, tx.item AS item_id, i.description AS item, c.name AS category,
                tx.weight, tx.price
         FROM ${t} tx
         LEFT JOIN ${it} i ON i.id = tx.item
         LEFT JOIN item_categories c ON c.id = i.category
         ORDER BY tx.date`
    );

    return rows.map((row) => ({ ...row, date: parseDateFromSQL(row.date) }));
}

export async function addTransaction(
    type: TransactionType,
    record: Omit<Transaction, "id">
): Promise<void> {
    const db = await getDatabase();
    await db.execute(
        `INSERT INTO ${table(type)} (date, item, weight, price) VALUES ($1, $2, $3, $4)`,
        [
            formatDateForSQL(record.date),
            record.item_id,
            record.weight,
            record.price,
        ]
    );
}

export async function editTransaction(
    type: TransactionType,
    id: number,
    record: Partial<Transaction>
): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (record.date !== undefined) {
        fields.push(`date = $${idx++}`);
        params.push(formatDateForSQL(record.date));
    }

    if (record.item_id !== undefined) {
        fields.push(`item = $${idx++}`);
        params.push(record.item_id);
    }

    if (record.weight !== undefined) {
        fields.push(`weight = $${idx++}`);
        params.push(record.weight);
    }

    if (record.price !== undefined) {
        fields.push(`price = $${idx++}`);
        params.push(record.price);
    }

    if (fields.length === 0) {
        return;
    }

    params.push(id);
    await db.execute(
        `UPDATE ${table(type)} SET ${fields.join(", ")} WHERE id = $${idx}`,
        params
    );
}

export async function deleteTransactions(
    type: TransactionType,
    ids: number[]
): Promise<void> {
    if (ids.length === 0) {
        return;
    }

    const db = await getDatabase();
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
    await db.execute(
        `DELETE FROM ${table(type)} WHERE id IN (${placeholders})`,
        ids
    );
}

export async function importTransactions(
    type: TransactionType,
    records: Record<string, unknown>[]
): Promise<void> {
    if (records.length === 0) {
        return;
    }

    const db = await getDatabase();
    const it = itemTable(type);
    const t = table(type);

    await db.execute("BEGIN", []);

    try {
        // Step 1: upsert categories
        for (const record of records) {
            const categoryName = toTitleCase(String(record.category ?? ""));
            await db.execute(
                "INSERT OR IGNORE INTO item_categories (name) VALUES ($1)",
                [categoryName]
            );
        }

        // Step 2: upsert items
        for (const record of records) {
            const categoryName = toTitleCase(String(record.category ?? ""));
            const itemDescription = toTitleCase(String(record.item ?? ""));
            await db.execute(
                `INSERT OR IGNORE INTO ${it} (description, category)
                 SELECT $1, id FROM item_categories WHERE name = $2`,
                [itemDescription, categoryName]
            );
        }

        // Step 3: insert transactions (no mutation of source objects)
        for (const record of records) {
            const itemDescription = toTitleCase(String(record.item ?? ""));
            const categoryName = toTitleCase(String(record.category ?? ""));
            const dateStr = String(record.date ?? "");
            const weight = Number(record.weight);
            const price = Number(record.price);
            await db.execute(
                `INSERT INTO ${t} (date, item, weight, price)
                 SELECT $1, i.id, $2, $3
                 FROM ${it} i
                 JOIN item_categories c ON c.id = i.category
                 WHERE i.description = $4 AND c.name = $5`,
                [dateStr, weight, price, itemDescription, categoryName]
            );
        }

        await db.execute("COMMIT", []);
    } catch (err) {
        await db.execute("ROLLBACK", []);

        throw err;
    }
}
