<script setup lang="ts">
    import { nextTick } from "vue";
    import { useRouter } from "vue-router";
    import { storeToRefs } from "pinia";
    import { LoaderCircleIcon } from "@lucide/vue";
    import { useAppStateStore } from "./stores/appState";

    const router = useRouter();
    const appStateStore = useAppStateStore();
    const { updateLoading } = appStateStore;
    const { isLoading } = storeToRefs(appStateStore);

    router.beforeEach(() => updateLoading(true));
    router.afterEach(() => {
        nextTick(() => {
            updateLoading(false);
        });
    });
</script>

<template>
    <Teleport to="body">
        <div v-if="isLoading" class="fixed inset-0 z-1101 backdrop-blur-sm">
            <LoaderCircleIcon
                class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-foreground"
                :size="48"
            />
        </div>
    </Teleport>
    <RouterView />
</template>
