<script setup lang="ts">
    import AppContent from "@/components/AppContent.vue";
    import AppFooter from "@/components/AppFooter.vue";
    import AppHeader from "@/components/AppHeader.vue";
    import AppShell from "@/components/AppShell.vue";
    import AppSidebar from "@/components/AppSidebar.vue";
    import { SidebarInset } from "@/components/ui/sidebar";
    import { Toaster } from "@/components/ui/sonner";
</script>

<template>
    <AppShell>
        <AppSidebar />
        <SidebarInset>
            <AppHeader />
            <AppContent>
                <slot></slot>
            </AppContent>
            <AppFooter />
        </SidebarInset>
    </AppShell>
    <Toaster rich-colors />
</template>
