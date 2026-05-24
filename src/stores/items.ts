import { defineStore } from "pinia";
import { useDatabase } from "@/composables/useDatabase";

export const useItemsStore = defineStore("items", () => {
    const { getDatabase } = useDatabase();
    const database = await getDatabase();

    return {};
});
