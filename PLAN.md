# Implementation Plan

This plan migrates `pl-analyser` from a scaffold with broken stores and empty page stubs into a fully functional Tauri profit/loss analysis application. It proceeds in eight phases, strictly ordered by dependency: types first, then service layer, then composables (infrastructure then feature), then shared UI components, then the sidebar layout change, then all six pages, and finally deletion of the four broken stores. Each phase produces independently reviewable work. On completion, the application will have a sidebar-based layout, six fully implemented pages (Overview, Transactions, CashFlow, Analysis, Items, Categories), a generic DataTable and dialog system, Chart.js-based charts, full XLSX import/export, and all code-review bugs resolved.

---

## Phase 1 — Domain Types

**Goal:** Define all domain interfaces in one place so every subsequent phase can import them.

**Tasks:**

1. `src/types/index.ts` — Add domain types below the existing `export * from "./navigation"` line. Types to add: `TransactionType`, `Interval`, `Category`, `Item`, `CashFlow`, `Transaction`, `OverviewRecord`, `DateRange`, `BreakdownRecord`, `ComparisonRecord`, `FieldType`, `FieldDef`, `ImportFieldDef`. See SPEC.md §Types for full interface definitions.

**Dependencies:** None.

**Done when:**
- `vue-tsc --noEmit` passes with no errors
- All types are importable from `@/types`
- Existing `BreadcrumbItem` and `NavItem` re-export still works

---

## Phase 2 — Service Layer

**Goal:** Implement all database query functions as plain async functions in `src/service/`.

**Tasks:**

1. `src/service/db.ts` — Re-export `getDatabase` from `useDatabase`.
2. `src/service/utils.ts` — Implement `formatDateForSQL(date: Date): string` and `parseDateFromSQL(str: string): Date`.
3. `src/service/categories.ts` — Implement `getCategories`, `addCategory`, `editCategory`, `deleteCategories`. All queries use `$1, $2, ...` parameterization.
4. `src/service/items.ts` — Implement `getItems`, `addItem`, `editItem`, `deleteItems`. Takes `type: TransactionType` to select the correct table.
5. `src/service/cashFlow.ts` — Implement `getCashFlow`, `addCashFlow`, `editCashFlow`, `deleteCashFlow`, `importCashFlow`.
6. `src/service/transactions.ts` — Implement `getTransactions`, `addTransaction`, `editTransaction`, `deleteTransactions`, `importTransactions`. `importTransactions` wraps all three insert steps (categories → items → transactions) in a `BEGIN / COMMIT` block; rolls back on any failure. The `.map()` inside uses local variables — never mutates source objects.
7. `src/service/analysis.ts` — Implement `getOverviewRange`, `getOverview`, `getOverviewBreakdown`, `getPeriodComparison`. Apply: named SQL fragments for `getOverview`/`getOverviewBreakdown` (no inline ternaries); fix dead ternary in `getPeriodComparison` (verify correct average-price formula for sales); replace O(n²) `.map(...).indexOf()` with a `Map` keyed on `category`.

**Dependencies:** Phase 1 (types).

**Done when:**
- `vue-tsc --noEmit` passes
- Each service file exports only typed functions — no classes, no `formatSQLString`, no `await` at module scope

---

## Phase 3 — Infrastructure Composables

**Goal:** Build the shared composable primitives that feature composables and pages depend on. Fix the existing `useXlsx.ts` typing gap.

**Tasks:**

1. `src/composables/useXlsx.ts` — Add full TypeScript types to the existing file. Add the missing `MONTHS` constant (12-element string array of short month names). Update `parseFile` signature to `(file: File, fields: ImportFieldDef[], options: { worksheet: string }): Record<string, unknown>[]`.
2. `src/composables/useDateRange.ts` — Implement per SPEC.md. Includes the private `computeDefaultRange` module-level helper.
3. `src/composables/useConfirmDelete.ts` — Implement per SPEC.md.
4. `src/composables/useToast.ts` — Implement per SPEC.md (thin `vue-sonner` wrapper).

**Dependencies:** Phase 1 (types for `ImportFieldDef`, `DateRange`).

**Done when:**
- `vue-tsc --noEmit` passes
- `useXlsx` has no untyped parameters or return values

---

## Phase 4 — Feature Composables

**Goal:** Implement all six feature composables. After this phase, pages can be fully composed with no inline data logic.

**Tasks:**

1. `src/composables/useOverview.ts` — Implement per SPEC.md. Includes `loadId` stale-response guard and `Promise.all` for parallel fetch of overview + breakdown.
2. `src/composables/useTransactions.ts` — Implement per SPEC.md.
3. `src/composables/useItems.ts` — Same CRUD pattern as `useTransactions`. No import dialog. Accepts `type: TransactionType`.
4. `src/composables/useCategories.ts` — Same CRUD pattern. No `type` parameter, no import dialog.
5. `src/composables/useCashFlow.ts` — Same CRUD pattern. `add` accepts `Omit<CashFlow, 'profit_loss'>`. Includes `showImportDialog`.
6. `src/composables/useAnalysis.ts` — Implement per SPEC.md. Two independent `range1`/`range2` refs. Guards against null ranges before calling `getPeriodComparison`.

**Dependencies:** Phase 2 (service layer), Phase 3 (infrastructure composables).

**Done when:**
- `vue-tsc --noEmit` passes
- All composables are pure functions returning typed reactive state
- No `await` at module scope in any composable

---

## Phase 5 — Shared Components

**Goal:** Build the DataTable system, generic dialogs, chart wrappers, and export utilities that all pages will use.

**Tasks:**

1. `src/utils/exports.ts` — Implement `exportXLSX(rows, filename)` using the `xlsx` package. Operates on row data objects — no DOM traversal.
2. `src/utils/text.ts` — Implement `toTitleCase` and `highlightMatch` (XSS-safe: escape the filter string before building `<mark>` HTML).
3. `src/components/data-table/DataTableColumnHeader.vue` — Sortable column header using shadcn `<Button>` variants + `@lucide/vue` sort icons (ascending/descending/none).
4. `src/components/data-table/DataTableColumnToggle.vue` — `<Popover>` with a checkbox list for column visibility.
5. `src/components/data-table/DataTablePagination.vue` — Page size `<Select>` and prev/next `<Button>` bound to TanStack pagination state.
6. `src/components/data-table/DataTableToolbar.vue` — Search `<Input>` (global filter), column toggle trigger, export `<Button>`.
7. `src/components/data-table/DataTable.vue` — Main wrapper. Props: `columns`, `data`, `loading`, `getRowId`, `exportFilename`, `title`. Uses `defineModel('selection')`. Export calls `exportXLSX` with `table.getRowModel().rows`.
8. `src/components/dialogs/RecordDialog.vue` — Generic dialog per SPEC.md. Renders each `FieldType` with the mapped shadcn-vue primitive.
9. `src/components/dialogs/ImportDialog.vue` — File picker → column mapping → submit. Uses `useXlsx().parseFile()`.
10. `src/components/charts/DoughnutChart.vue` — Chart.js doughnut wrapper. Props: `data: ChartData`, `options?: ChartOptions`.
11. `src/components/charts/LineChart.vue` — Chart.js line chart wrapper. Same prop contract.

**Dependencies:** Phase 1 (types for `FieldDef`, `ImportFieldDef`), Phase 3 (`useXlsx`).

**Done when:**
- `vue-tsc --noEmit` passes
- `DataTable.vue` renders with sort, filter, pagination, column toggle, and export working (verify with hardcoded mock data before wiring to a page)
- `RecordDialog` renders all six `FieldType` variants correctly

---

## Phase 6 — Sidebar Layout

**Goal:** Replace the top-navigation header with a persistent sidebar. This is a layout-only change — no page logic is affected.

**Tasks:**

1. `src/components/AppSidebar.vue` — New component. Renders the nav groups (Overview / Operations / Analysis / Setup) per SPEC.md. Uses `RouterLink` with `exactActiveClass` for active state. No store dependencies.
2. `src/components/AppShell.vue` — Change grid from single-column (`grid-cols-1 grid-rows-[auto_1fr_auto]`) to two-column (`grid-cols-[16rem_1fr]`). Right column retains `grid-rows-[auto_1fr_auto]`.
3. `src/components/AppHeader.vue` — Remove the `NavigationMenu`, `Sheet`, mobile menu button, and `breadcrumbs` prop. Keep only: `AppLogo` on the left, dark mode toggle `<Button>` on the right.
4. `src/layouts/app/AppSidebarLayout.vue` — New file. Composes `AppShell` + `AppSidebar` + content slot + `<Toaster>`. Replaces `AppHeaderLayout.vue`.
5. `src/layouts/AppLayout.vue` — Update to import and delegate to `AppSidebarLayout.vue`.
6. `src/router/index.ts` — Uncomment and replace all commented-out routes with the flat parametric routes from SPEC.md §Router. Remove the `/manage` nesting. Update the `/` route to target `OverviewPage.vue`.

**Dependencies:** Phase 1 (types for `NavItem`).

**Done when:**
- App launches with the sidebar visible and all nav items listed
- Navigating between routes highlights the correct sidebar item
- Dark mode toggle still works
- All mobile-specific `<Sheet>` code removed from `AppHeader.vue`
- `vue-tsc --noEmit` passes

---

## Phase 7 — Pages

**Goal:** Implement all six page components. After this phase the application is functionally complete.

Implement in this order (simplest first, most complex last):

**Tasks:**

1. `src/pages/CategoriesPage.vue` — Rename from `ManageCategoriesPage.vue`. Implement with `useCategories()`, column defs, `RecordDialog` for add/edit, `AlertDialog` for confirm delete. Delete `ManageCategoriesPage.vue`.

2. `src/pages/ItemsPage.vue` — New file replacing `ManagePurchasesPage.vue` and `ManageSalesPage.vue`. Takes `type: TransactionType` prop from router. Purchases/Sales tab switcher navigates to `/items/purchases` or `/items/sales`. Uses `useItems(props.type)`. Delete `ManagePurchasesPage.vue` and `ManageSalesPage.vue`.

3. `src/pages/CashFlowPage.vue` — Implement with `useCashFlow()`, column defs, `RecordDialog` (month field type), `ImportDialog`, confirm delete.

4. `src/pages/TransactionsPage.vue` — New file replacing `PurchasesPage.vue` and `SalesPage.vue`. Takes `type` prop. Purchases/Sales tab switcher. Both `RecordDialog` and `ImportDialog`. Uses `useTransactions(props.type)`. Delete `PurchasesPage.vue` and `SalesPage.vue`.

5. `src/pages/OverviewPage.vue` — Rename from `HomePage.vue`. Implement with `useOverview()`. Toolbar: interval toggle, date range picker, export button. Table renders `OverviewRecord[]`. Breakdown section passes `breakdownData` as props to `DoughnutChart` and `LineChart`. Delete `HomePage.vue`.

6. `src/pages/AnalysisPage.vue` — Purchases/Sales tabs. Each tab uses `useAnalysis(type)`. Renders comparison `<DataTable>` and two chart components. Two range pickers in the toolbar (range1, range2).

**Dependencies:** Phase 4 (feature composables), Phase 5 (DataTable, dialogs, charts), Phase 6 (routes registered for all pages).

**Done when:**
- All six pages render without runtime errors
- CRUD (add, edit, delete) works on Categories, Items, Transactions, CashFlow
- XLSX import works for Transactions and CashFlow
- Overview page loads data and updates on interval/range change
- Analysis page loads comparison data and updates on range change
- `vue-tsc --noEmit` passes

---

## Phase 8 — Delete Broken Stores

**Goal:** Remove the four Pinia stores that have invalid top-level `await` calls. Done last to confirm nothing imports them.

**Tasks:**

1. Search `src/` for any imports of `useAnalysisStore`, `useCashFlowStore`, `useItemsStore`, `useTransactionsStore`. Confirm zero usages.
2. Delete `src/stores/analysis.ts`
3. Delete `src/stores/cashFlow.ts`
4. Delete `src/stores/items.ts`
5. Delete `src/stores/transactions.ts`

**Dependencies:** Phase 7 (all pages confirmed not importing these stores).

**Done when:**
- `src/stores/` contains only `appState.ts`
- `vue-tsc --noEmit` passes
- `npm run build` completes without errors

---

## Dependency Graph

```
Phase 1 (Types)
    └── Phase 2 (Service Layer)
    └── Phase 3 (Infrastructure Composables)
            └── Phase 4 (Feature Composables)  ← also needs Phase 2
                    └── Phase 7 (Pages)  ← also needs Phase 5, Phase 6
Phase 1 (Types)
    └── Phase 5 (Shared Components)  ← also needs Phase 3
    └── Phase 6 (Sidebar Layout)
Phase 7 (Pages)
    └── Phase 8 (Delete Broken Stores)
```

Phases 2, 3, 5, and 6 can all be started as soon as Phase 1 is complete. Phase 4 requires both 2 and 3. Phase 7 requires 4, 5, and 6. Phase 8 requires 7.
