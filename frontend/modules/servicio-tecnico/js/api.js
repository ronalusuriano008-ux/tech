// Los módulos de diario no conocen si los datos vienen de red, IndexedDB o la cola.
const data = () => window.DataService;

export function getMonthData(year, month) {
  return data().get(`/month/${year}/${month}`);
}

export function saveDayData(payload) {
  return data().create('/day', payload, { resourceKey: `diary:${payload.year}-${payload.month}-${payload.day}` });
}

export function deleteDayData(year, month, day) {
  return data().delete(`/day/${year}/${month}/${day}`, { resourceKey: `diary:${year}-${month}-${day}` });
}

export function deleteMonthData(year, month) {
  return data().delete(`/month/${year}/${month}`, { resourceKey: `diary:${year}-${month}` });
}
