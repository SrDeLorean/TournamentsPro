/**
 * Fixture Date Scheduler Helper for TournamentsPro
 * Calculates exact, accurate calendar dates and times for any matchday.
 */

const WEEKDAY_MAP: { [key: string]: number } = {
  'domingo': 0, 'sun': 0, 'dom': 0,
  'lunes': 1, 'mon': 1, 'lun': 1,
  'martes': 2, 'tue': 2, 'mar': 2,
  'miércoles': 3, 'miercoles': 3, 'wed': 3, 'mié': 3,
  'jueves': 4, 'thu': 4, 'jue': 4,
  'viernes': 5, 'fri': 5, 'vie': 5,
  'sábado': 6, 'sabado': 6, 'sat': 6, 'sáb': 6,
};

const DAYS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export interface MatchdayDateTimeInfo {
  dateObj: Date;
  dateStr: string; // "YYYY-MM-DD"
  timeStr: string; // "HH:mm"
  dayNameCapitalized: string; // "Jueves"
  exactDateStr: string; // "Jueves 06/08 22:00 hrs"
  iso: string; // "2026-08-06 22:00:00"
}

export function getMatchdayDateTime(
  matchdayIndex: number, // 1-indexed (1, 2, 3...)
  startDateISO: string,
  selectedDays: string[] = ['Martes', 'Jueves'],
  selectedTimes: string[] = ['20:00']
): MatchdayDateTimeInfo {
  const parts = (startDateISO || new Date().toISOString().slice(0, 10)).split('T')[0].split('-');
  const startYear = parseInt(parts[0], 10) || 2026;
  const startMonth = (parseInt(parts[1], 10) || 1) - 1;
  const startDay = parseInt(parts[2], 10) || 1;
  const baseDate = new Date(startYear, startMonth, startDay, 12, 0, 0);

  const targetWeekdays = (selectedDays && selectedDays.length > 0 ? selectedDays : ['Martes', 'Jueves'])
    .map((d) => WEEKDAY_MAP[d.toLowerCase().trim()])
    .filter((w) => w !== undefined)
    .sort((a, b) => a - b);

  if (targetWeekdays.length === 0) targetWeekdays.push(2, 4);

  const timesList = selectedTimes && selectedTimes.length > 0 ? selectedTimes : ['20:00'];

  const slotIdx = Math.max(0, matchdayIndex - 1);
  const timesPerDay = timesList.length;

  const dateStepIndex = Math.floor(slotIdx / timesPerDay);
  const timeStepIndex = slotIdx % timesPerDay;

  let currentDate = new Date(baseDate.getTime());
  let countFound = 0;

  for (let offset = 0; offset < 365; offset++) {
    const candidate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + offset, 12, 0, 0);
    if (targetWeekdays.includes(candidate.getDay())) {
      if (countFound === dateStepIndex) {
        currentDate = candidate;
        break;
      }
      countFound++;
    }
  }

  const selectedTime = timesList[timeStepIndex] || '20:00';
  const [hours, minutes] = selectedTime.split(':').map(Number);
  currentDate.setHours(hours || 20, minutes || 0, 0, 0);

  const dayDD = String(currentDate.getDate()).padStart(2, '0');
  const monthMM = String(currentDate.getMonth() + 1).padStart(2, '0');
  const yearYYYY = currentDate.getFullYear();
  const dayNameCapitalized = DAYS_FULL[currentDate.getDay()];
  const hh = String(hours || 20).padStart(2, '0');
  const mm = String(minutes || 0).padStart(2, '0');
  const exactDateStr = `${dayNameCapitalized} ${dayDD}/${monthMM} ${selectedTime}`;
  const dateStr = `${yearYYYY}-${monthMM}-${dayDD}`;
  const iso = `${yearYYYY}-${monthMM}-${dayDD} ${hh}:${mm}:00`;

  return {
    dateObj: currentDate,
    dateStr,
    timeStr: selectedTime,
    dayNameCapitalized,
    exactDateStr,
    iso,
  };
}
