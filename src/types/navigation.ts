import type { LucideIcon } from "@lucide/vue";

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<string>;
};

export type NavItem = {
    title: string;
    href: NonNullable<string>;
    icon?: LucideIcon;
    isActive?: boolean;
};
