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
                    name: "Home",
                    component: () => import("@/pages/HomePage.vue"),
                },
                // {
                //     path: "/manage",
                //     children: [
                //         {
                //             path: "categories",
                //             name: "Manage Categories",
                //             component: () =>
                //                 import("@/views/manage/Categories.vue"),
                //         },
                //         {
                //             path: "items/purchases",
                //             name: "Manage Items - Purchases",
                //             component: () =>
                //                 import("@/views/manage/items/Purchases.vue"),
                //         },
                //         {
                //             path: "items/sales",
                //             name: "Manage Items - Sales",
                //             component: () =>
                //                 import("@/views/manage/items/Sales.vue"),
                //         },
                //     ],
                // },
                // {
                //     path: "/transactions",
                //     children: [
                //         {
                //             path: "purchases",
                //             name: "Purchases",
                //             component: () =>
                //                 import("@/views/transactions/Purchases.vue"),
                //         },
                //         {
                //             path: "sales",
                //             name: "Sales",
                //             component: () =>
                //                 import("@/views/transactions/Sales.vue"),
                //         },
                //     ],
                // },
                // {
                //     path: "/cash-flow",
                //     name: "Cash Flow",
                //     component: () => import("@/views/CashFlow.vue"),
                // },
                // {
                //     path: "/analysis",
                //     name: "Analysis",
                //     component: () => import("@/views/Analysis.vue"),
                // },
            ],
        },
    ],
});

export default router;
