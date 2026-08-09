const data = () => window.DataService;

export const getTiendaMonth = (year, month) => data().get(`/tienda/month/${year}/${month}`);
export const saveTiendaDay = (year, month, payload) => data().create(`/tienda/day/${year}/${month}`, payload, { resourceKey: `tienda:${year}-${month}-${payload.day}` });
export const deleteTiendaDay = (year, month, day) => data().delete(`/tienda/day/${year}/${month}/${day}`, { resourceKey: `tienda:${year}-${month}-${day}` });
export const recalculateTienda = (year, month) => data().create(`/tienda/month/${year}/${month}/recalculate`, {}, { queue: false });
export async function getTiendaPdf(year, month) {
  const response = await fetch(window.getApiUrl(`/tienda/pdf/${year}/${month}`), { credentials: 'include' });
  if (!response.ok) throw new Error('No se pudo generar el PDF sin conexión');
  return response.blob();
}
