import { getDatabase } from "./db";
import type { Item, TransactionType } from "@/types";

function table(type: TransactionType): string {
    return type === "purchases" ? "item_purchases" : "item_sales";
}

export async function getItems(type: TransactionType): Promise<Item[]> {
    const db = await getDatabase();
    const t = table(type);

    return db.select<Item[]>(
        `SELECT i.id, i.description, i.category, c.name AS category_name
         FROM ${t} i
         LEFT JOIN item_categories c ON c.id = i.category`
    );
}

export async function addItem(
    type: TransactionType,
    item: Omit<Item, "id">
): Promise<void> {
    const db = await getDatabase();
    await db.execute(
        `INSERT INTO ${table(type)} (description, category) VALUES ($1, $2)`,
        [item.description, item.category]
    );
}

export async function editItem(
    type: TransactionType,
    id: number,
    record: Partial<Item>
): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (record.description !== undefined) {
        fields.push(`description = $${idx++}`);
        params.push(record.description);
    }

    if (record.category !== undefined) {
        fields.push(`category = $${idx++}`);
        params.push(record.category);
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

export async function deleteItems(
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
