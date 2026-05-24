import Database from "@tauri-apps/plugin-sql";

let database: Database | null = null;

async function getDatabase() {
    if (!database) {
        database = await Database.load("sqlite:pl_analyser.db");
    }

    return database;
}

export function useDatabase() {
    return { getDatabase };
}
