const API_URL = window.AppConfig?.apiBaseUrl || 'http://localhost:3000/api';

export async function getMonthData(year, month) {
    const res = await fetch(`${API_URL}/month/${year}/${month}`);
    if (res.status === 401) return window.location.href = '/login/index.html';
    return res.json();
}

export async function saveDayData(data) {
    const res = await fetch(`${API_URL}/day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (res.status === 401) return window.location.href = '/login/index.html';
    return res.json();
}

export async function deleteDayData(year, month, day) {
    const res = await fetch(`${API_URL}/day/${year}/${month}/${day}`, { method: 'DELETE' });
    if (res.status === 401) return window.location.href = '/login/index.html';
    return res.json();
}

export async function deleteMonthData(year, month) {
    const res = await fetch(`${API_URL}/month/${year}/${month}`, { method: 'DELETE' });
    if (res.status === 401) return window.location.href = '/login/index.html';
    return res.json();
}
