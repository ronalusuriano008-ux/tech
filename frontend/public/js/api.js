const API_URL = window.AppConfig?.apiBaseUrl || 'http://localhost:3000/api';

console.log('[api.js] API_URL configurado como:', API_URL);
console.log('[api.js] window.AppConfig:', window.AppConfig);

async function handleResponse(res) {
    if (res.status === 401) {
        window.location.href = '/login/index.html';
        return;
    }
    if (!res.ok) {
        const text = await res.text();
        let errorMessage = text;
        try {
            const json = JSON.parse(text);
            errorMessage = json.error || json.message || text;
        } catch (err) {
            // keep raw text when it is not JSON
        }
        throw new Error(errorMessage || `HTTP error ${res.status}`);
    }
    return res.json();
}

export async function getMonthData(year, month) {
    const url = `${API_URL}/month/${year}/${month}`;
    console.log('[getMonthData] Fetching:', url);
    const res = await fetch(url);
    return handleResponse(res);
}

export async function saveDayData(data) {
    const url = `${API_URL}/day`;
    console.log('[saveDayData] Posting to:', url, 'with data:', data);
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const response = await handleResponse(res);
    console.log('[saveDayData] Response:', response);
    return response;
}

export async function deleteDayData(year, month, day) {
    const res = await fetch(`${API_URL}/day/${year}/${month}/${day}`, { method: 'DELETE' });
    return handleResponse(res);
}

export async function deleteMonthData(year, month) {
    const res = await fetch(`${API_URL}/month/${year}/${month}`, { method: 'DELETE' });
    return handleResponse(res);
}
