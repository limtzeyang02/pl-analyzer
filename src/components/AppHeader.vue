<script setup lang="ts">
    import { LayoutGridIcon, MenuIcon } from "@lucide/vue";
    import { computed, ref } from "vue";
    import AppLogoIcon from "@/components/AppLogoIcon.vue";
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
    import Breadcrumbs from "./Breadcrumbs.vue";
    import { useCurrentUrl } from "@/composables/useCurrentUrl";
    import type { BreadcrumbItem, NavItem } from "@/types";

    type Props = {
        breadcrumbs?: BreadcrumbItem[];
    };

    const props = withDefaults(defineProps<Props>(), {
        breadcrumbs: () => [],
    });

    const activeItemStyles =
        "!bg-transparent text-neutral-900 dark:text-neutral-100";

    const mobileActiveItemStyles =
        "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary";

    const mainNavItems = computed<NavItem[]>(() => [
        {
            title: "test",
            href: "",
            icon: LayoutGridIcon,
        },
    ]);

    const mobileMenuOpen = ref(false);
    const { isCurrentUrl, whenCurrentUrl } = useCurrentUrl();
</script>

<template>
    <div>
        <div class="border-b border-sidebar-border/80 lg:hidden">
            <div class="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
                <!-- Mobile Menu -->
                <div class="lg:hidden">
                    <Sheet v-model:open="mobileMenuOpen">
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
                            <SheetHeader class="flex justify-start text-left">
                                <AppLogoIcon class="h-12 w-auto self-start" />
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
                                        :class="
                                            whenCurrentUrl(
                                                item.href,
                                                mobileActiveItemStyles
                                            )
                                        "
                                        @click="mobileMenuOpen = false"
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

                <RouterLink to="/">
                    <AppLogoIcon class="h-8 w-auto" />
                </RouterLink>

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
                                    :class="[
                                        navigationMenuTriggerStyle(),
                                        whenCurrentUrl(
                                            item.href,
                                            activeItemStyles
                                        ),
                                        'h-9 cursor-pointer px-3',
                                    ]"
                                    :to="item.href"
                                >
                                    <component
                                        v-if="item.icon"
                                        :is="item.icon"
                                        class="mr-2 size-4"
                                    />
                                    {{ item.title }}
                                </RouterLink>
                                <div
                                    v-if="isCurrentUrl(item.href)"
                                    class="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-primary"
                                ></div>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>
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
    </div>
</template>
