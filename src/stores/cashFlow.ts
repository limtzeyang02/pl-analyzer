import { defineStore } from "pinia";
import { useDatabase } from "@/composables/useDatabase";

export const useCashFlowStore = defineStore("cash_flow", () => {
    const { getDatabase } = useDatabase();
    const database = await getDatabase();

    return {};
});
