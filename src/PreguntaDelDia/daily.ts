/** Days since the Unix epoch, counted on the viewer's local calendar. */
export function localDayNumber(d: Date = new Date()): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}
