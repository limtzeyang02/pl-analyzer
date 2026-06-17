import { getDatabase } from "./db";
import { formatDateForSQL, parseDateFromSQL } from "./utils";
import type { CashFlow } from "@/types";

interface CashFlowRow {
    date: string;
    year: number;
    month: number;
    salary: number;
    expenses: number;
    petty_cash: number;
    profit_loss: number;
}

export async function getCashFlow(): Promise<CashFlow[]> {
    const db = await getDatabase();
    const rows = await db.select<CashFlowRow[]>(
        `SELECT cf.date, cf.year, cf.month, cf.salary, cf.expenses, cf.petty_cash,
                COALESCE(ov.profit_loss, 0) AS profit_loss
         FROM cash_flow cf
         LEFT JOIN overview ov ON ov.year = cf.year AND ov.month = cf.month
         ORDER BY cf.date`
    );

    return rows.map((row) => ({ ...row, date: parseDateFromSQL(row.date) }));
}

export async function addCashFlow(
    record: Omit<CashFlow, "profit_loss">
): Promise<void> {
    const db = await getDatabase();
    await db.execute(
        "INSERT INTO cash_flow (date, year, month, salary, expenses, petty_cash) VALUES ($1, $2, $3, $4, $5, $6)",
        [
            formatDateForSQL(record.date),
            record.year,
            record.month,
            record.salary,
            record.expenses,
            record.petty_cash,
        ]
    );
}

export async function editCashFlow(
    key: Date,
    record: Partial<CashFlow>
): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (record.salary !== undefined) {
        fields.push(`salary = $${idx++}`);
        params.push(record.salary);
    }

    if (record.expenses !== undefined) {
        fields.push(`expenses = $${idx++}`);
        params.push(record.expenses);
    }

    if (record.petty_cash !== undefined) {
        fields.push(`petty_cash = $${idx++}`);
        params.push(record.petty_cash);
    }

    if (fields.length === 0) {
        return;
    }

    params.push(formatDateForSQL(key));
    await db.execute(
        `UPDATE cash_flow SET ${fields.join(", ")} WHERE date = $${idx}`,
        params
    );
}

export async function deleteCashFlow(dates: Date[]): Promise<void> {
    if (dates.length === 0) {
        return;
    }

    const db = await getDatabase();
    const placeholders = dates.map((_, i) => `$${i + 1}`).join(", ");
    await db.execute(
        `DELETE FROM cash_flow WHERE date IN (${placeholders})`,
        dates.map(formatDateForSQL)
    );
}

export async function importCashFlow(
    records: Record<string, unknown>[]
): Promise<void> {
    if (records.length === 0) {
        return;
    }

    const db = await getDatabase();
    await db.execute("BEGIN", []);

    try {
        for (const record of records) {
            await db.execute(
                "INSERT OR REPLACE INTO cash_flow (date, year, month, salary, expenses, petty_cash) VALUES ($1, $2, $3, $4, $5, $6)",
                [
                    record.date,
                    record.year,
                    record.month,
                    record.salary,
                    record.expenses,
                    record.petty_cash,
                ]
            );
        }

        await db.execute("COMMIT", []);
    } catch (err) {
        await db.execute("ROLLBACK", []);

        throw err;
    }
}
