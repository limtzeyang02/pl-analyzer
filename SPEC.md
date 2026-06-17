# Implementation Spec

---

## Overview

`pl-analyser` is a Tauri desktop application for profit/loss analysis of scrap metal trading. It manages transactions (purchases and sales), items, categories, cash flow, and produces analysis with charts.

The project is a fresh TypeScript + Vue 3 + shadcn-vue rewrite of an older PrimeVue-based app. The following infrastructure is already present and is not to be rebuilt:

- TypeScript: `tsconfig.json`, `vite.config.ts`, `vue-tsc` build step
- shadcn-vue: all primitives generated under `src/components/ui/` — do not edit these files directly
- Installed packages: `@tanstack/vue-table`, `vue-sonner`, `@lucide/vue`, `chart.js`, `@tauri-apps/plugin-sql`, `reka-ui`, `@vueuse/core`
- `src/utils/format.ts` — `formatPrice`, `formatWeight`, `formatPercent`, `formatMonth`, `formatMonthYear`, `formatDateShort`, `formatYear`, `formatDateLabel`, `formatRangeLabel`, `plColorClass`, `MONTH_OPTIONS`, `calcAvgPrice`
- `src/composables/useDatabase.ts` — SQLite singleton (`getDatabase()`)
- `src/composables/useXlsx.ts` — Excel file parser (needs full typing — see Phase 3)
- `src/stores/appState.ts` — `useAppStateStore`: `isLoading`, `isDark`, `toggleDark`, `version`, `updateLoading`
- `src/lib/utils.ts` — `cn()`, `toDate()`, `toDateString()`
- `src/types/navigation.ts` — `BreadcrumbItem`, `NavItem`
- Layout shell: `AppShell.vue`, `AppHeader.vue`, `AppContent.vue`, `AppFooter.vue`, `Breadcrumbs.vue`, `Toolbar.vue`, `AppLogo.vue`, `AppLogoIcon.vue`
- `src/router/index.ts` — only `/` → `HomePage.vue` is active; all other routes are commented out

The following stores must be deleted — they call `await` at the top level of a Pinia setup function, which is invalid:

- `src/stores/analysis.ts`
- `src/stores/cashFlow.ts`
- `src/stores/items.ts`
- `src/stores/transactions.ts`

All pages in `src/pages/` are empty or near-empty placeholders. `src/service/` and feature composables do not exist yet.

---

## Folder Structure (Target State)

```
src/
├── main.ts
├── App.vue
├── css/
│   └── main.css
├── lib/
│   └── utils.ts                    — already exists
├── types/
│   ├── index.ts                    — add domain types (re-export of navigation.ts stays)
│   └── navigation.ts               — already exists
├── service/                        — new directory
│   ├── db.ts
│   ├── utils.ts
│   ├── analysis.ts
│   ├── transactions.ts
│   ├── items.ts
│   ├── categories.ts
│   └── cashFlow.ts
├── utils/
│   ├── format.ts                   — already exists
│   ├── exports.ts                  — new
│   └── text.ts                     — new
├── stores/
│   └── appState.ts                 — keep; delete the other four
├── composables/
│   ├── useDatabase.ts              — already exists
│   ├── useXlsx.ts                  — already exists (needs full typing)
│   ├── useDateRange.ts             — new
│   ├── useConfirmDelete.ts         — new
│   ├── useToast.ts                 — new
│   ├── useOverview.ts              — new
│   ├── useTransactions.ts          — new
│   ├── useItems.ts                 — new
│   ├── useCategories.ts            — new
│   ├── useCashFlow.ts              — new
│   └── useAnalysis.ts              — new
├── layouts/
│   ├── AppLayout.vue               — update to delegate to AppSidebarLayout
│   └── app/
│       └── AppSidebarLayout.vue    — new (replaces AppHeaderLayout.vue)
├── components/
│   ├── ui/                         — already exists; do not edit
│   ├── AppShell.vue                — update grid for sidebar layout
│   ├── AppSidebar.vue              — new
│   ├── AppHeader.vue               — strip to logo + dark mode toggle only
│   ├── AppFooter.vue               — already exists
│   ├── AppLogo.vue                 — already exists
│   ├── AppLogoIcon.vue             — already exists
│   ├── AppContent.vue              — already exists
│   ├── Breadcrumbs.vue             — already exists; render conditionally
│   ├── Toolbar.vue                 — already exists
│   ├── data-table/
│   │   ├── DataTable.vue
│   │   ├── DataTableToolbar.vue
│   │   ├── DataTableColumnHeader.vue
│   │   ├── DataTablePagination.vue
│   │   └── DataTableColumnToggle.vue
│   ├── charts/
│   │   ├── DoughnutChart.vue
│   │   └── LineChart.vue
│   └── dialogs/
│       ├── RecordDialog.vue
│       └── ImportDialog.vue
├── router/
│   └── index.ts                    — flat parametric routes (no /manage nesting)
└── pages/
    ├── OverviewPage.vue            — rename from HomePage.vue
    ├── TransactionsPage.vue        — merge PurchasesPage + SalesPage
    ├── CashFlowPage.vue            — implement
    ├── AnalysisPage.vue            — implement
    ├── ItemsPage.vue               — merge ManagePurchasesPage + ManageSalesPage
    └── CategoriesPage.vue          — rename from ManageCategoriesPage
```

Pages to delete after consolidation: `HomePage.vue`, `PurchasesPage.vue`, `SalesPage.vue`, `ManagePurchasesPage.vue`, `ManageSalesPage.vue`, `ManageCategoriesPage.vue`

---

## Types

**File:** `src/types/index.ts`

The existing file contains only `export * from "./navigation"`. Add all domain types below that line.

```ts
export type TransactionType = 'purchases' | 'sales'
export type Interval = 'Monthly' | 'Yearly'

export interface Category {
    id: number
    name: string
    ferous: boolean
}

export interface Item {
    id: number
    description: string
    category: number          // FK to Category.id
    category_name?: string    // joined field from DB query
}

export interface CashFlow {
    date: Date
    year: number
    month: number
    salary: number
    expenses: number
    petty_cash: number
    profit_loss: number       // computed by DB; never sent on write
}

export interface Transaction {
    id?: number
    date: Date
    item_id: number
    item?: string             // joined from items table
    category?: string         // joined from categories table
    weight: number
    price: number
}

export interface OverviewRecord {
    year: number
    month?: number            // absent when interval = 'Yearly'
    buy_weight: number
    buy_price: number
    buy_average_price: number
    sell_weight: number
    sell_price: number
    sell_average_price: number
    stock_weight: number
    salary: number
    expenses: number
    petty_cash: number
    profit_loss: number
}

export interface DateRange {
    min: Date | null
    max: Date | null
}

export interface BreakdownRecord {
    category: string
    weight: number
    price: number
    average_price: number
}

export interface ComparisonRecord {
    category: string
    weight1: number
    price1: number
    average_price1: number
    weight2: number
    price2: number
    average_price2: number
}

export type FieldType = 'text' | 'month' | 'year' | 'date' | 'currency' | 'weight' | 'select'

export interface FieldDef {
    id: string
    label: string
    type: FieldType
    required?: boolean
    min?: number
    max?: number
    options?: { label: string; value: unknown }[]
}

export interface ImportFieldDef {
    name: string
    label: string
    type: 'date' | 'month' | 'year' | 'numeric' | 'string'
    mapping: string | null    // Excel column header to read from
}
```

---

## Service Layer

**Directory:** `src/service/` (new)

All exports are plain `async` functions. No classes. Each function calls `getDatabase()` inside the function body — never at module scope. All queries use Tauri's native parameterized syntax (`$1, $2, ...`). The old `formatSQLString` custom formatter is not ported.

### `src/service/db.ts`

```ts
import { useDatabase } from '@/composables/useDatabase'
export const { getDatabase } = useDatabase()
```

### `src/service/utils.ts`

```ts
export function formatDateForSQL(date: Date): string  // → 'YYYY-MM-DD'
export function parseDateFromSQL(str: string): Date   // parses 'YYYY-MM-DD' as local midnight
```

Replaces the old dual-purpose `parseDate()`.

### `src/service/categories.ts`

```ts
export async function getCategories(): Promise<Category[]>
export async function addCategory(category: Omit<Category, 'id'>): Promise<void>
export async function editCategory(id: number, record: Partial<Category>): Promise<void>
export async function deleteCategories(ids: number[]): Promise<void>
```

### `src/service/items.ts`

```ts
export async function getItems(type: TransactionType): Promise<Item[]>
export async function addItem(type: TransactionType, item: Omit<Item, 'id'>): Promise<void>
export async function editItem(type: TransactionType, id: number, record: Partial<Item>): Promise<void>
export async function deleteItems(type: TransactionType, ids: number[]): Promise<void>
```

### `src/service/transactions.ts`

```ts
export async function getTransactions(type: TransactionType): Promise<Transaction[]>
export async function addTransaction(type: TransactionType, record: Omit<Transaction, 'id'>): Promise<void>
export async function editTransaction(type: TransactionType, id: number, record: Partial<Transaction>): Promise<void>
export async function deleteTransactions(type: TransactionType, ids: number[]): Promise<void>
export async function importTransactions(type: TransactionType, records: Record<string, unknown>[]): Promise<void>
```

`importTransactions` wraps the three sequential inserts (categories → items → transactions) in a single `BEGIN / COMMIT` block. If any step fails, the block is rolled back. The `.map()` inside uses local variables — does not mutate source objects.

### `src/service/cashFlow.ts`

```ts
export async function getCashFlow(): Promise<CashFlow[]>
export async function addCashFlow(record: Omit<CashFlow, 'profit_loss'>): Promise<void>
export async function editCashFlow(key: Date, record: Partial<CashFlow>): Promise<void>
export async function deleteCashFlow(dates: Date[]): Promise<void>
export async function importCashFlow(records: Record<string, unknown>[]): Promise<void>
```

### `src/service/analysis.ts`

```ts
export async function getOverviewRange(): Promise<DateRange>
export async function getOverview(interval: Interval, range: DateRange): Promise<OverviewRecord[]>
export async function getOverviewBreakdown(interval: Interval, range: DateRange): Promise<BreakdownRecord[]>
export async function getPeriodComparison(
    type: TransactionType,
    range1: [Date, Date],
    range2: [Date, Date]
): Promise<ComparisonRecord[]>
```

Fixes applied when porting from the old `AnalysisService.js`:
- Split the inline SQL in `getOverview`/`getOverviewBreakdown` into named fragment strings (`monthlyFields`, `yearlyFields`) — no ternary operators embedded in query strings
- Fix the dead ternary in `getPeriodComparison` (both branches were identical) — determine the correct average-price formula for sales before writing this branch
- Replace the O(n²) `.map(...).indexOf()` pattern with a `Map` keyed on `category` built once before the loop

---

## Composables — Infrastructure

### `src/composables/useXlsx.ts` (update existing)

Add full TypeScript types. The `MONTHS` constant (12-element string array of short month names) must be defined at the top of this file — it is currently missing and causes a runtime error.

```ts
export function useXlsx() {
    function parseFile(
        file: File,
        fields: ImportFieldDef[],
        options: { worksheet: string }
    ): Record<string, unknown>[]
    return { parseFile }
}
```

### `src/composables/useDateRange.ts` (new)

Eliminates the range-initialization pattern that was duplicated across three components in the old codebase.

```ts
interface UseDateRangeOptions {
    fetchRange: () => Promise<DateRange>
}

export function useDateRange(options: UseDateRangeOptions) {
    const period = ref<[Date | null, Date | null]>([null, null])
    const range = ref<[Date | null, Date | null]>([null, null])
    const isInitializing = ref(false)

    async function init() {
        isInitializing.value = true
        const { min, max } = await options.fetchRange()
        period.value = [min, max]
        range.value = computeDefaultRange(min, max)
        isInitializing.value = false
    }

    return { period, range, init, isInitializing }
}

function computeDefaultRange(min: Date | null, max: Date | null): [Date | null, Date | null] {
    if (!min || !max) return [null, null]
    const startOfYear = new Date(max.getFullYear(), 0, 1)
    return [startOfYear < min ? min : startOfYear, max]
}
```

### `src/composables/useConfirmDelete.ts` (new)

```ts
export function useConfirmDelete(options: {
    message: string
    onConfirm: () => Promise<void>
}) {
    const isOpen = ref(false)
    function open() { isOpen.value = true }
    async function confirm() { await options.onConfirm(); isOpen.value = false }
    function cancel() { isOpen.value = false }
    return { isOpen, open, confirm, cancel }
}
```

### `src/composables/useToast.ts` (new)

```ts
import { toast } from 'vue-sonner'
export function useToast() {
    return {
        success: (msg: string) => toast.success(msg),
        error: (msg: string) => toast.error(msg),
    }
}
```

---

## Composables — Feature

One composable per feature. Pages are composition-only surfaces — no data logic inline.

### `src/composables/useOverview.ts`

```ts
export function useOverview() {
    const interval = ref<Interval>('Monthly')
    const { period, range, init, isInitializing } = useDateRange({ fetchRange: getOverviewRange })
    const data = ref<OverviewRecord[]>([])
    const breakdownData = ref<BreakdownRecord[]>([])
    const isLoading = ref(false)
    let loadId = 0

    async function load() {
        const id = ++loadId
        isLoading.value = true
        const [overview, breakdown] = await Promise.all([
            getOverview(interval.value, { min: range.value[0], max: range.value[1] }),
            getOverviewBreakdown(interval.value, { min: range.value[0], max: range.value[1] })
        ])
        if (id !== loadId) return  // discard stale response
        data.value = overview
        breakdownData.value = breakdown
        isLoading.value = false
    }

    onMounted(() => init().then(load))
    watch([interval, range], load)

    return { interval, period, range, data, breakdownData, isLoading, isInitializing }
}
```

### `src/composables/useTransactions.ts`

```ts
export function useTransactions(type: TransactionType) {
    const data = ref<Transaction[]>([])
    const selection = ref<Transaction[]>([])
    const isLoading = ref(false)
    const showAddDialog = ref(false)
    const showImportDialog = ref(false)

    async function load() {
        isLoading.value = true
        data.value = await getTransactions(type)
        isLoading.value = false
    }
    async function add(record: Omit<Transaction, 'id'>) { await addTransaction(type, record); await load() }
    async function edit(id: number, record: Partial<Transaction>) { await editTransaction(type, id, record); await load() }
    async function remove(ids: number[]) { await deleteTransactions(type, ids); selection.value = []; await load() }
    async function importRecords(records: Record<string, unknown>[]) { await importTransactions(type, records); await load() }

    onMounted(load)

    return { data, selection, isLoading, showAddDialog, showImportDialog, load, add, edit, remove, importRecords }
}
```

### `src/composables/useItems.ts`

Same CRUD pattern as `useTransactions`. Accepts `type: TransactionType`. No import dialog. Calls `getItems`, `addItem`, `editItem`, `deleteItems`.

### `src/composables/useCategories.ts`

Same CRUD pattern without `type` parameter. Calls `getCategories`, `addCategory`, `editCategory`, `deleteCategories`. No import dialog.

### `src/composables/useCashFlow.ts`

Same CRUD pattern. `add` accepts `Omit<CashFlow, 'profit_loss'>`. Includes `showImportDialog`. Calls `getCashFlow`, `addCashFlow`, `editCashFlow`, `deleteCashFlow`, `importCashFlow`.

### `src/composables/useAnalysis.ts`

```ts
export function useAnalysis(type: TransactionType) {
    const { period, range, init, isInitializing } = useDateRange({ fetchRange: getOverviewRange })
    const comparisonData = ref<ComparisonRecord[]>([])
    const isLoading = ref(false)
    const range1 = ref<[Date | null, Date | null]>([null, null])
    const range2 = ref<[Date | null, Date | null]>([null, null])

    async function loadComparison() {
        if (!range1.value[0] || !range1.value[1] || !range2.value[0] || !range2.value[1]) return
        isLoading.value = true
        comparisonData.value = await getPeriodComparison(
            type,
            range1.value as [Date, Date],
            range2.value as [Date, Date]
        )
        isLoading.value = false
    }

    onMounted(() => init().then(loadComparison))
    watch([range1, range2], loadComparison)

    return { period, range1, range2, comparisonData, isLoading, isInitializing }
}
```

---

## Shared Components

### DataTable (`src/components/data-table/`)

Wraps `@tanstack/vue-table` and renders using shadcn `<Table>` primitives from `src/components/ui/table/`.

**`DataTable.vue` props:**

```ts
interface Props<T> {
    columns: ColumnDef<T>[]
    data: T[]
    loading?: boolean
    getRowId?: (row: T) => string
    exportFilename?: string
    title?: string
}
const selection = defineModel<T[]>('selection', { default: () => [] })
```

Column definitions are passed as a stable `const` from `<script setup>` — never as inline array literals in the template. Export calls `exportXLSX` from `utils/exports.ts` with `table.getRowModel().rows` — no DOM traversal.

Sub-components:
- `DataTableColumnHeader.vue` — sortable header using shadcn `<Button>` variants + `@lucide/vue` sort icons
- `DataTableColumnToggle.vue` — `<Popover>` with checkboxes for column visibility
- `DataTablePagination.vue` — page size `<Select>` + prev/next `<Button>`
- `DataTableToolbar.vue` — search `<Input>` (global filter), column toggle trigger, export `<Button>`

### `src/components/dialogs/RecordDialog.vue`

Generic add/edit dialog driven by a `FieldDef[]` schema.

```ts
interface Props {
    title: string
    fields: FieldDef[]
    initialValues?: Record<string, unknown>
}
// v-model:open (boolean)
// emits: submit(values: Record<string, unknown>)
```

Field type → component mapping:

| FieldType | Rendered as |
|---|---|
| `text` | `<Input>` |
| `currency` / `weight` | `<NumberField>` |
| `date` | `<DatePicker>` |
| `month` | `<NativeSelect>` with month options from `MONTH_OPTIONS` |
| `year` | `<NumberField>` with min/max |
| `select` | `<Select>` with `options` from `FieldDef` |

### `src/components/dialogs/ImportDialog.vue`

Excel import flow: file picker → column mapping → submit.

```ts
interface Props {
    title: string
    fields: ImportFieldDef[]
}
// v-model:open (boolean)
// emits: submit(records: Record<string, unknown>[])
```

Uses `useXlsx().parseFile()` internally.

### `src/components/charts/DoughnutChart.vue` and `LineChart.vue`

Port from old project — pure Chart.js, no PrimeVue. Props: `data: ChartData`, `options?: ChartOptions`.

---

## Navigation & Layout

### Sidebar layout

The top-navigation Menubar is replaced with a persistent left sidebar. The current `AppHeader.vue` includes a mobile `<Sheet>`-based nav — remove it entirely (Tauri apps do not run on mobile).

**`AppShell.vue` grid change:**

Current: `grid-cols-1 grid-rows-[auto_1fr_auto]`
New: two-column layout — `grid-cols-[16rem_1fr]`, with the right column retaining `grid-rows-[auto_1fr_auto]`

**`AppSidebar.vue` nav structure:**

```
Overview                → /
────── Operations
Transactions            → /transactions/purchases
Cash Flow               → /cash-flow
────── Analysis
Analysis                → /analysis
────── Setup
Items                   → /items/purchases
Categories              → /categories
```

Active state via `RouterLink`'s `exactActiveClass`. Uses `NavItem` type from `navigation.ts`.

**`AppHeader.vue` after stripping:** Contains only `AppLogo` on the left and the dark mode toggle `<Button>` on the right. No breadcrumbs prop (breadcrumbs handled at page level if needed).

**`AppLayout.vue`:** Delegates to new `AppSidebarLayout.vue` (which replaces `AppHeaderLayout.vue`). `AppSidebarLayout.vue` composes `AppShell` + `AppSidebar` + content slot + `<Toaster>`.

### Router

Replace all commented-out routes with flat parametric routes:

```ts
{ path: '/',                                    name: 'Overview',     component: () => import('@/pages/OverviewPage.vue') },
{ path: '/transactions/:type(purchases|sales)', name: 'Transactions', component: () => import('@/pages/TransactionsPage.vue'), props: true },
{ path: '/cash-flow',                           name: 'CashFlow',     component: () => import('@/pages/CashFlowPage.vue') },
{ path: '/analysis',                            name: 'Analysis',     component: () => import('@/pages/AnalysisPage.vue') },
{ path: '/items/:type(purchases|sales)',        name: 'Items',        component: () => import('@/pages/ItemsPage.vue'), props: true },
{ path: '/categories',                          name: 'Categories',   component: () => import('@/pages/CategoriesPage.vue') },
```

All routes are children of the single root layout route. The `/manage` nesting is removed.

### Breadcrumbs

With the sidebar providing persistent location context, breadcrumbs only render when the trail has more than one item. Top-level pages pass an empty breadcrumbs array; the bar does not render. No Pinia store needed for breadcrumbs — passed as props from page to layout.

---

## Pages

Every page follows this pattern: import feature composable, define column defs as a `const`, use `useConfirmDelete`, render dialogs with `v-if` + `v-model:open`, render `<DataTable>`. No inline data-fetching.

### `OverviewPage.vue` (rename from `HomePage.vue`)

```ts
const { interval, period, range, data, breakdownData, isLoading } = useOverview()
const columns: ColumnDef<OverviewRecord>[] = [/* year/month, buy stats, sell stats, stock, salary, expenses, P&L */]
```

Toolbar: interval toggle (`Monthly`/`Yearly`), date range picker, export button. Breakdown data passed as props to `DoughnutChart` and `LineChart` child components.

### `TransactionsPage.vue` (merge `PurchasesPage.vue` + `SalesPage.vue`)

```ts
const props = defineProps<{ type: TransactionType }>()
const { data, selection, isLoading, showAddDialog, showImportDialog, add, edit, remove, importRecords } = useTransactions(props.type)
const columns: ColumnDef<Transaction>[] = [/* date, item, category, weight, price */]
const addFields: FieldDef[] = [/* date, item_id (select), weight, price */]
const importFields: ImportFieldDef[] = [/* date, item, category, weight, price */]
```

Purchases/Sales tab switcher at the top navigates to `/transactions/purchases` or `/transactions/sales`.

### `CashFlowPage.vue`

```ts
const { data, selection, isLoading, showAddDialog, showImportDialog, add, edit, remove, importRecords } = useCashFlow()
const columns: ColumnDef<CashFlow>[] = [/* year, month, salary, expenses, petty_cash, profit_loss */]
const addFields: FieldDef[] = [/* date (month type), salary, expenses, petty_cash */]
```

### `AnalysisPage.vue`

Purchases/Sales tabs at the top. Each tab instantiates `useAnalysis(type)`. Renders a comparison `<DataTable>` (`ComparisonRecord[]`) and two chart panels. Two date range pickers in the toolbar (range1, range2).

### `ItemsPage.vue` (merge `ManagePurchasesPage.vue` + `ManageSalesPage.vue`)

```ts
const props = defineProps<{ type: TransactionType }>()
const { data, selection, isLoading, showAddDialog, add, edit, remove } = useItems(props.type)
const columns: ColumnDef<Item>[] = [/* description, category_name */]
const addFields: FieldDef[] = [/* description (text), category (select from getCategories()) */]
```

### `CategoriesPage.vue` (rename from `ManageCategoriesPage.vue`)

```ts
const { data, selection, isLoading, showAddDialog, add, edit, remove } = useCategories()
const columns: ColumnDef<Category>[] = [/* name, ferous */]
const addFields: FieldDef[] = [/* name (text), ferous (select: ferrous / non-ferrous) */]
```

---

## Utilities

### `src/utils/format.ts` — already exists, no changes needed

### `src/utils/text.ts` (new)

```ts
export function toTitleCase(str: string): string

// Sanitizes filter input before embedding in HTML — prevents XSS through user-supplied search strings
export function highlightMatch(value: string, filter: string): string {
    const escaped = filter.replace(/[<>&"']/g, c => `&#${c.charCodeAt(0)};`)
    // build <mark> wrapper using escaped term
}
```

### `src/utils/exports.ts` (new)

```ts
// Accepts row data from table.getRowModel().rows — no DOM traversal
export function exportXLSX(rows: Record<string, unknown>[], filename: string): void
```

---

## Code Quality Fixes

All applied during service and composable implementation — not a separate pass.

| Issue | Fix location |
|---|---|
| `parseDate` dual-purpose function | `service/utils.ts`: two separate named functions |
| Stateless service classes | `service/*.ts`: plain async functions by design |
| Dead ternary in `getPeriodComparison` | `service/analysis.ts`: verify and fix sales formula |
| O(n²) category lookup | `service/analysis.ts`: `Map` before the loop |
| No DB transaction in import | `service/transactions.ts`: `BEGIN / COMMIT / ROLLBACK` |
| `formatSQLString` custom SQL builder | Replaced by native `$1, $2, ...` parameterization everywhere |
| `v-html` with unsanitized input | `utils/text.ts`: `highlightMatch` escapes before building HTML |
| Fragile DOM traversal for export | `utils/exports.ts`: operates on row data, not DOM |
| Race condition on rapid filter change | `composables/useOverview.ts`: `loadId` counter |
| `importTransactions` mutates source records | `service/transactions.ts`: local variables in `.map()` |
| Missing `MONTHS` constant in `useXlsx.ts` | Fix in existing `composables/useXlsx.ts` |
| Top-level `await` in Pinia stores | Delete `stores/analysis.ts`, `cashFlow.ts`, `items.ts`, `transactions.ts` |
