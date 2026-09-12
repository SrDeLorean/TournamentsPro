export function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Reciente';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'Reciente';

  const differenceMinutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (differenceMinutes < 1) return 'Ahora mismo';
  if (differenceMinutes < 60) return `Hace ${differenceMinutes} min`;
  const differenceHours = Math.floor(differenceMinutes / 60);
  if (differenceHours < 24) return `Hace ${differenceHours} h`;
  return `Hace ${Math.floor(differenceHours / 24)} d`;
}
