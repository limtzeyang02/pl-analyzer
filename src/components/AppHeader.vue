<script setup lang="ts">
    import { LayoutGridIcon, MenuIcon, MoonIcon, SunIcon } from "@lucide/vue";
    import { storeToRefs } from "pinia";
    import { computed } from "vue";
    import AppLogo from "@/components/AppLogo.vue";
    import Breadcrumbs from "@/components/Breadcrumbs.vue";
    import { Button } from "@/components/ui/button";
    import {
        NavigationMenu,
        NavigationMenuItem,
        NavigationMenuList,
        navigationMenuTriggerStyle,
    } from "@/components/ui/navigation-menu";
    import {
        Sheet,
        SheetContent,
        SheetHeader,
        SheetTitle,
        SheetTrigger,
    } from "@/components/ui/sheet";
    import { useAppStateStore } from "@/stores/appState";
    import type { BreadcrumbItem, NavItem } from "@/types";

    type Props = {
        breadcrumbs?: BreadcrumbItem[];
    };

    const props = withDefaults(defineProps<Props>(), {
        breadcrumbs: () => [],
    });
    const appStateStore = useAppStateStore();
    const { toggleDark } = appStateStore;
    const { isDark } = storeToRefs(appStateStore);
    const activeItemStyles = "bg-transparent ";
    const mainNavItems = computed<NavItem[]>(() => [
        {
            title: "Home",
            href: "/",
            icon: LayoutGridIcon,
        },
    ]);
</script>

<template>
    <header>
        <div class="border-b border-sidebar-border/80">
            <div class="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
                <!-- Mobile Menu -->
                <div class="lg:hidden">
                    <Sheet>
                        <SheetTrigger :as-child="true">
                            <Button
                                variant="ghost"
                                size="icon"
                                class="mr-2 size-9"
                            >
                                <MenuIcon class="size-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" class="w-75 p-6">
                            <SheetTitle class="sr-only">
                                Navigation menu
                            </SheetTitle>
                            <SheetHeader
                                class="flex-row items-center justify-center"
                            >
                                <AppLogo />
                            </SheetHeader>
                            <div
                                class="flex h-full flex-1 flex-col justify-between space-y-4 py-6"
                            >
                                <nav class="-mx-3 space-y-1">
                                    <RouterLink
                                        v-for="item in mainNavItems"
                                        :key="item.title"
                                        :to="item.href"
                                        class="flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
                                        :exact-active-class="activeItemStyles"
                                    >
                                        <component
                                            v-if="item.icon"
                                            :is="item.icon"
                                            class="size-5"
                                        />
                                        {{ item.title }}
                                    </RouterLink>
                                </nav>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                <RouterLink to="/" class="flex items-center gap-x-2">
                    <AppLogo />
                </RouterLink>

                <Button
                    size="icon"
                    variant="outline"
                    class="ml-auto lg:hidden"
                    @click="toggleDark()"
                >
                    <component :is="isDark ? MoonIcon : SunIcon" />
                </Button>

                <!-- Desktop Menu -->
                <div class="hidden h-full lg:flex lg:flex-1">
                    <NavigationMenu class="ml-10 flex h-full items-stretch">
                        <NavigationMenuList
                            class="flex h-full items-stretch space-x-2"
                        >
                            <NavigationMenuItem
                                v-for="(item, index) in mainNavItems"
                                :key="index"
                                class="relative flex h-full items-center"
                            >
                                <RouterLink
                                    v-slot="{ isExactActive, href, navigate }"
                                    :to="item.href"
                                    custom
                                >
                                    <a
                                        :href="href"
                                        :class="[
                                            navigationMenuTriggerStyle(),
                                            isExactActive && activeItemStyles,
                                            'h-9 cursor-pointer px-3',
                                        ]"
                                        @click="navigate"
                                    >
                                        <component
                                            v-if="item.icon"
                                            :is="item.icon"
                                            class="mr-2 size-4"
                                        />
                                        {{ item.title }}
                                    </a>
                                    <div
                                        v-if="isExactActive"
                                        class="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-primary"
                                    ></div>
                                </RouterLink>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>
                <Button
                    size="icon"
                    variant="outline"
                    class="hidden lg:flex"
                    @click="toggleDark()"
                >
                    <component :is="isDark ? MoonIcon : SunIcon" />
                </Button>
            </div>
        </div>

        <div
            v-if="props.breadcrumbs.length > 1"
            class="flex w-full border-b border-sidebar-border/70"
        >
            <div
                class="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl"
            >
                <Breadcrumbs :breadcrumbs />
            </div>
        </div>
    </header>
</template>
