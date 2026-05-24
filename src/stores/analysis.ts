import { defineStore } from "pinia";
import { useDatabase } from "@/composables/useDatabase";

export const useAnalysisStore = defineStore("analysis", () => {
    const { getDatabase } = useDatabase();

    return {};
});
