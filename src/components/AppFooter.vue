<script setup lang="ts">
    import { storeToRefs } from "pinia";
    import { useAppStateStore } from "@/stores/appState";

    const appStateStore = useAppStateStore();
    const { version } = storeToRefs(appStateStore);
</script>

<template>
    <footer class="flex h-14 items-center justify-center border-t p-4">
        <span>Version {{ version }}</span>
    </footer>
</template>
