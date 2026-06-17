const LOCALE = "en-MY";

const MYR_OPTS: Intl.NumberFormatOptions = {
    style: "currency",
    currency: "MYR",
};
const KG_OPTS: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 5,
};
const PERCENT_OPTS: Intl.NumberFormatOptions = {
    style: "percent",
    minimumFractionDigits: 2,
};
const MONTH_OPTS: Intl.DateTimeFormatOptions = { month: "short" };
const MONTHYR_OPTS: Intl.DateTimeFormatOptions = {
    month: "short",
    year: "numeric",
};
const DATE_OPTS: Intl.DateTimeFormatOptions = { dateStyle: "short" };
const YEAR_OPTS: Intl.DateTimeFormatOptions = { year: "numeric" };

export const formatPrice = (n: number): string =>
    n.toLocaleString(LOCALE, MYR_OPTS);
export const formatWeight = (n: number): string =>
    `${n.toLocaleString(LOCALE, KG_OPTS)} kg`;
export const formatPercent = (n: number): string =>
    n.toLocaleString(LOCALE, PERCENT_OPTS);

// guards against NaN/Infinity when weight is 0
export const calcAvgPrice = (
    totalPrice: number,
    totalWeight: number
): number => (totalWeight === 0 ? 0 : totalPrice / totalWeight);

// month is 1-based; year 2000 is arbitrary — only the month part is formatted
export const formatMonth = (month: number): string =>
    new Date(2000, month - 1).toLocaleString(LOCALE, MONTH_OPTS);

export const formatMonthYear = (date: Date): string =>
    date.toLocaleString(LOCALE, MONTHYR_OPTS);
export const formatDateShort = (date: Date): string =>
    date.toLocaleString(LOCALE, DATE_OPTS);
export const formatYear = (date: Date): string =>
    date.toLocaleString(LOCALE, YEAR_OPTS);

export const formatDateLabel = (
    date: Date,
    interval: "Monthly" | "Yearly"
): string =>
    date.toLocaleString(
        LOCALE,
        interval === "Monthly" ? MONTHYR_OPTS : YEAR_OPTS
    );

export const formatRangeLabel = (
    range: [Date | null, Date | null],
    interval: "Monthly" | "Yearly"
): string => {
    const [start, end] = range;

    if (!start) {
        return "";
    }

    const startLabel = formatDateLabel(start, interval);

    return end
        ? `${startLabel} - ${formatDateLabel(end, interval)}`
        : startLabel;
};

export const plColorClass = (
    n: number
): "text-red-500" | "text-green-500" | null =>
    n < 0 ? "text-red-500" : n > 0 ? "text-green-500" : null;

export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
    label: formatMonth(i + 1),
    value: i + 1,
}));
