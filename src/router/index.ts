import { createRouter, createWebHistory } from "vue-router";
import AppLayout from "@/layouts/AppLayout.vue";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: "/",
            component: AppLayout,
            children: [
                {
                    path: "/",
                    name: "Overview",
                    component: () => import("@/pages/OverviewPage.vue"),
                },
                {
                    path: "/transactions/:type(purchases|sales)",
                    name: "Transactions",
                    component: () => import("@/pages/TransactionsPage.vue"),
                    props: true,
                },
                {
                    path: "/cash-flow",
                    name: "Cash Flow",
                    component: () => import("@/pages/CashFlowPage.vue"),
                },
                {
                    path: "/analysis",
                    name: "Analysis",
                    component: () => import("@/pages/AnalysisPage.vue"),
                },
                {
                    path: "/items/:type(purchases|sales)",
                    name: "Items",
                    component: () => import("@/pages/ItemsPage.vue"),
                    props: true,
                },
                {
                    path: "/categories",
                    name: "Categories",
                    component: () => import("@/pages/CategoriesPage.vue"),
                },
            ],
        },
    ],
});

export default router;
