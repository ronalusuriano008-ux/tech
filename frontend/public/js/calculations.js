export const formatPEN = (value) => {
    const num = Number(value) || 0;
    return 'S/ ' + num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const parseNumber = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
};
