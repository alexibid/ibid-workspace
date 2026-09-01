export function normalizeText(value: string | null | undefined): string {
    if (!value) return '';

    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

export function slugify(value: string | null | undefined): string {
    if (!value) return '';

    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}