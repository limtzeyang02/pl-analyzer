<script setup lang="ts">
    import {
        ActivityIcon,
        BarChart2Icon,
        LayoutDashboardIcon,
        ListIcon,
        TagIcon,
        TrendingUpIcon,
    } from "@lucide/vue";
    import { useRoute } from "vue-router";
    import AppLogoIcon from "@/components/AppLogoIcon.vue";
    import {
        Sidebar,
        SidebarContent,
        SidebarGroup,
        SidebarGroupContent,
        SidebarGroupLabel,
        SidebarHeader,
        SidebarMenu,
        SidebarMenuButton,
        SidebarMenuItem,
    } from "@/components/ui/sidebar";

    const route = useRoute();

    const navGroups = [
        {
            label: "Overview",
            items: [
                {
                    title: "Overview",
                    to: "/",
                    icon: LayoutDashboardIcon,
                    exact: true,
                },
            ],
        },
        {
            label: "Operations",
            items: [
                {
                    title: "Transactions",
                    to: "/transactions/purchases",
                    icon: ActivityIcon,
                    exact: false,
                },
                {
                    title: "Cash Flow",
                    to: "/cash-flow",
                    icon: TrendingUpIcon,
                    exact: true,
                },
            ],
        },
        {
            label: "Analysis",
            items: [
                {
                    title: "Analysis",
                    to: "/analysis",
                    icon: BarChart2Icon,
                    exact: true,
                },
            ],
        },
        {
            label: "Setup",
            items: [
                {
                    title: "Items",
                    to: "/items/purchases",
                    icon: ListIcon,
                    exact: false,
                },
                {
                    title: "Categories",
                    to: "/categories",
                    icon: TagIcon,
                    exact: true,
                },
            ],
        },
    ];

    function isActive(item: { to: string; exact: boolean }) {
        if (item.exact) {
            return route.path === item.to;
        }

        return route.path.startsWith(item.to);
    }
</script>

<template>
    <Sidebar collapsible="icon">
        <SidebarHeader>
            <RouterLink to="/" class="flex items-center gap-x-2 overflow-hidden">
                <AppLogoIcon class="aspect-square size-8 shrink-0" />
                <span class="max-w-xs truncate font-semibold leading-tight transition-[opacity,max-width] duration-200 ease-linear group-data-[state=collapsed]:max-w-0 group-data-[state=collapsed]:opacity-0">
                    P&amp;L Analyser
                </span>
            </RouterLink>
        </SidebarHeader>
        <SidebarContent>
            <SidebarGroup v-for="group in navGroups" :key="group.label">
                <SidebarGroupLabel>{{ group.label }}</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem
                            v-for="item in group.items"
                            :key="item.title"
                        >
                            <SidebarMenuButton
                                as-child
                                :is-active="isActive(item)"
                                :tooltip="item.title"
                            >
                                <RouterLink :to="item.to">
                                    <component :is="item.icon" />
                                    <span>{{ item.title }}</span>
                                </RouterLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </SidebarContent>
    </Sidebar>
</template>
