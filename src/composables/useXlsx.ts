import { utils, read } from "xlsx";

export function useXlsx() {
    function parseFile(file: File, fields, options) {
        const workbook = read(file.data, {
            sheets: options.worksheet,
            cellDates: true,
        });
        const sheet = utils.sheet_to_json(workbook.Sheets[options.worksheet]);
        let newRecords = [];

        sheet.forEach((record) => {
            let data = {};

            fields.forEach((field) => {
                switch (field.type) {
                    case "date":
                        data[field.name] = record[field.mapping];
                        break;
                    case "month":
                        data[field.name] =
                            typeof record[field.mapping] === "string"
                                ? MONTHS.findIndex(
                                      (month) =>
                                          month === record[field.mapping].trim()
                                  )
                                : -1;
                        break;
                    case "numeric":
                        data[field.name] = record[field.mapping] || 0;
                        break;
                    case "string":
                        data[field.name] =
                            typeof record[field.mapping] === "string"
                                ? record[field.mapping].trim()
                                : "";
                        break;
                    default:
                        data[field.name] = record[field.mapping] || null;
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
