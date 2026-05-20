import { getVersion } from "@tauri-apps/api/app";
import { defineStore } from "pinia";
import { computedAsync, useDark, useToggle } from "@vueuse/core";
import { shallowRef } from "vue";

export const useAppStateStore = defineStore("app_state", () => {
    const isLoading = shallowRef(true);
    const isDark = useDark();
    const toggleDark = useToggle(isDark);
    const version = computedAsync(async () => await getVersion(), null, {
        lazy: true,
    });

    function updateLoading(value?: boolean) {
        isLoading.value = value ?? !isLoading.value;
    }

    return { isLoading, isDark, version, toggleDark, updateLoading };
});
