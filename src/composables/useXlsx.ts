import { utils, read } from "xlsx";
import type { ImportFieldDef } from "@/types";

const MONTHS: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function useXlsx() {
    function parseFile(
        file: File & { data: ArrayBuffer },
        fields: ImportFieldDef[],
        options: { worksheet: string }
    ): Record<string, unknown>[] {
        const workbook = read(file.data, {
            sheets: options.worksheet,
            cellDates: true,
        });
        const sheet = utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[options.worksheet]);
        const newRecords: Record<string, unknown>[] = [];

        sheet.forEach((record) => {
            const data: Record<string, unknown> = {};

            fields.forEach((field) => {
                switch (field.type) {
                    case "date":
                        data[field.name] = field.mapping !== null ? record[field.mapping] : null;
                        break;
                    case "month":
                        data[field.name] =
                            field.mapping !== null && typeof record[field.mapping] === "string"
                                ? MONTHS.findIndex(
                                      (month) =>
                                          month === (record[field.mapping as string] as string).trim()
                                  )
                                : -1;
                        break;
                    case "numeric":
                        data[field.name] = field.mapping !== null ? (record[field.mapping] || 0) : 0;
                        break;
                    case "string":
                        data[field.name] =
                            field.mapping !== null && typeof record[field.mapping] === "string"
                                ? (record[field.mapping] as string).trim()
                                : "";
                        break;
                    default:
                        data[field.name] = field.mapping !== null ? (record[field.mapping] || null) : null;
                }
            });

            if (
                !Object.values(data).some(
                    (field) => field === null || field === ""
                )
            ) {
                newRecords.push(data);
            }
        });

        return newRecords;
    }

    return { parseFile };
}
