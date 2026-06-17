import { getDatabase } from "./db";
import type { Category } from "@/types";

export async function getCategories(): Promise<Category[]> {
    const db = await getDatabase();
    const rows = await db.select<
        { id: number; name: string; ferous: number }[]
    >("SELECT id, name, ferous FROM item_categories");

    return rows.map((row) => ({ ...row, ferous: row.ferous !== 0 }));
}

export async function addCategory(
    category: Omit<Category, "id">
): Promise<void> {
    const db = await getDatabase();
    await db.execute(
        "INSERT INTO item_categories (name, ferous) VALUES ($1, $2)",
        [category.name, category.ferous ? 1 : 0]
    );
}

export async function editCategory(
    id: number,
    record: Partial<Category>
): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (record.name !== undefined) {
        fields.push(`name = $${idx++}`);
        params.push(record.name);
    }

    if (record.ferous !== undefined) {
        fields.push(`ferous = $${idx++}`);
        params.push(record.ferous ? 1 : 0);
    }

    if (fields.length === 0) {
        return;
    }

    params.push(id);
    await db.execute(
        `UPDATE item_categories SET ${fields.join(", ")} WHERE id = $${idx}`,
        params
    );
}

export async function deleteCategories(ids: number[]): Promise<void> {
    if (ids.length === 0) {
        return;
    }

    const db = await getDatabase();
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
    await db.execute(
        `DELETE FROM item_categories WHERE id IN (${placeholders})`,
        ids
    );
}
