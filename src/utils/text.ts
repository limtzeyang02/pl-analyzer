function toTitleCase(str: string): string {
    return str.toLowerCase().replace(/\b\S/g, (char) => char.toUpperCase());
}

function escapeHtml(raw: string): string {
    return raw
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function highlightMatch(value: string, filter: string): string {
    const escapedValue = escapeHtml(`${value}`);

    if (!value || !filter) {
        return escapedValue;
    }

    // Escape filter for regex use after HTML-escaping it, so the pattern
    // matches against the already-escaped value string safely.
    const escapedFilter = escapeHtml(filter).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedFilter, "gi");

    return escapedValue.replace(regex, (match) => `<mark>${match}</mark>`);
}

export { toTitleCase, highlightMatch };
