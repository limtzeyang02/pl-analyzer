<script setup lang="ts">
    import { MoonIcon, SunIcon } from "@lucide/vue";
    import { storeToRefs } from "pinia";
    import { Button } from "@/components/ui/button";
    import { SidebarTrigger } from "@/components/ui/sidebar";
    import { useAppStateStore } from "@/stores/appState";

    const appStateStore = useAppStateStore();
    const { toggleDark } = appStateStore;
    const { isDark } = storeToRefs(appStateStore);
</script>

<template>
    <header class="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/80 px-4">
        <SidebarTrigger class="-ml-1" />

        <Button
            size="icon"
            variant="outline"
            class="ml-auto"
            @click="toggleDark()"
        >
            <component :is="isDark ? MoonIcon : SunIcon" />
        </Button>
    </header>
</template>
