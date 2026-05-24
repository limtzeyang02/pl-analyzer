import { defineStore } from "pinia";
import { useDatabase } from "@/composables/useDatabase";

export const useTransactionsStore = defineStore("transactions", () => {
    const { getDatabase } = useDatabase();
    const database = await getDatabase();

    return {};
});
