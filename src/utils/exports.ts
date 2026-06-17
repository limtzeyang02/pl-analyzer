import { utils, writeXLSX } from "xlsx";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

async function exportXLSX(rows: Record<string, unknown>[], filename: string): Promise<void> {
    const workbook = utils.book_new();
    const sheet = utils.json_to_sheet(rows);
    utils.book_append_sheet(workbook, sheet);
    const fileData = writeXLSX(workbook, { type: "array", cellDates: true });
    const filePath = await save({
        title: "Export to Excel",
        filters: [
            {
                name: "Excel Spreadsheet",
                extensions: ["xlsx", "xls"],
            },
        ],
        defaultPath: filename,
    });

    if (filePath) {
        await writeFile(filePath, fileData);
    }
}

export { exportXLSX };
