import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toDate(dateString?: string | null): Date | undefined {
    return dateString ? new Date(dateString) : undefined;
}

export function toDateString(date?: Date | null): string {
    return date
        ? new Intl.DateTimeFormat("en-GB", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
          })
              .format(date)
              .replace(/\//g, "-")
        : "Invalid date";
}
