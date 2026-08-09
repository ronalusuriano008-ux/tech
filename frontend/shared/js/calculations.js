export function formatCurrency(value) {
    const numberValue = Number(value);
    const normalized = Number.isFinite(numberValue) ? numberValue : 0;
    return `S/. ${normalized.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function parseDecimal(value) {
    const num = parseFloat(value);
    return Number.isFinite(num) ? num : 0;
}

export function normalizeDay(value) {
    const num = parseInt(value, 10);
    return Number.isFinite(num) && num > 0 && num <= 31 ? num : null;
}

export function formatMonthRange(fromDay, toDay) {
    if (!fromDay && !toDay) return 'Todos los días';
    if (fromDay && toDay) return `Días ${fromDay} - ${toDay}`;
    if (fromDay) return `Desde día ${fromDay}`;
    return `Hasta día ${toDay}`;
}

export const formatPEN = formatCurrency;
export const parseNumber = parseDecimal;

