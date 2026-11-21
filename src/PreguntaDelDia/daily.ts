/** Days since the Unix epoch, counted on the viewer's local calendar. */
export function localDayNumber(d: Date = new Date()): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

const dateFmt = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' });
const dateYearFmt = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/** "Hoy", "Ayer", or the date ("Lunes, 16 de noviembre"; with the year if it isn't this year's). */
export function dayLabel(at: number, today: number): string {
  const date = new Date(at);
  const day = localDayNumber(date);
  if (day === today) return 'Hoy';
  if (day === today - 1) return 'Ayer';
  const thisYear = new Date(today * 86_400_000).getUTCFullYear();
  const label = (date.getFullYear() === thisYear ? dateFmt : dateYearFmt).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export interface DayGroup<T> {
  /** Local day number, unique per group. */
  day: number;
  label: string;
  /** The items drawn that day, in order, with their place in the whole list. */
  rows: { item: T; index: number }[];
}

/** Split a list (newest first) into runs from the same local day, for day headings. */
export function groupByDay<T>(items: T[], at: (item: T) => number, today: number): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];
  items.forEach((item, index) => {
    const day = localDayNumber(new Date(at(item)));
    const last = groups[groups.length - 1];
    if (last?.day === day) last.rows.push({ item, index });
    else groups.push({ day, label: dayLabel(at(item), today), rows: [{ item, index }] });
  });
  return groups;
}
