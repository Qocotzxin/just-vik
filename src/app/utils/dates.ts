import getWeekOfMonth from 'date-fns/getWeekOfMonth';
import eachWeekOfInterval from 'date-fns/eachWeekOfInterval';
import format from 'date-fns/format';
import es from 'date-fns/locale/es/index.js';
import sub from 'date-fns/sub';
import { Lapse } from '../model/chart';

export const DATE_FORMATS = {
  BASE: 'dd/MM/yyyy',
  FULL: 'dd/MM/yyyy HH:mm:ss',
  MONTH_READABLE: 'MMMM',
};

/**
 * Provides date information to correctly display charts data.
 */
export const CHART_DATE_INFO = {
  [Lapse.week]: {
    keys: getWeekKeys,
    value: getWeekLabels,
    condition: getWeekMinDateToSearch,
  },
  [Lapse.month]: {
    keys: getMonthKeys,
    value: getMonthLabels,
    condition: getMonthMinDateToSearch,
  },
  [Lapse.year]: {
    keys: getYearKeys,
    value: getYearLabels,
    condition: getYearMinDateToSearch,
  },
};

/**
 * Formats a date into the expected string format.
 * It's a date-fns native format function wrapper to avoid
 * passing the locale each time.
 * @param date: number | Date
 * @param formatStr: string
 * @returns string
 */
export function dateFnsFormat(
  date: number | Date,
  formatStr = DATE_FORMATS.FULL
) {
  return format(date, formatStr, {
    locale: es,
  });
}

/**
 * Returns the corresponding week of month for a specified date.
 * It's a date-fns native getWeekOfMonth function wrapper to avoid
 * passing the locale each time.
 * @param date: number | Date
 * @returns number
 */
export function dateFnsGetWeekOfMonth(date: number | Date): number {
  return getWeekOfMonth(date, {
    locale: es,
  });
}

/**
 * Returns the corresponding beginning of week (as Date)
 * for a specified time frame.
 * It's a date-fns native eachWeekOfInterval function wrapper to avoid
 * passing the locale each time.
 * @param interval: Interval
 * @returns Date[]
 */
export function dateFnsEachWeekOfInterval(interval: Interval): Date[] {
  return eachWeekOfInterval(interval, { locale: es });
}

/**
 * Returns labels for sales chart (x axis) on a week basis.
 * @function
 * @returns string[]
 */
function getWeekLabels(): string[] {
  const labels = [];
  const now = new Date();

  for (let days = 7; days >= 0; --days) {
    labels.push(dateFnsFormat(sub(now, { days }), DATE_FORMATS.BASE));
  }

  return labels;
}

/**
 * Returns labels for sales chart (x axis) on a month basis.
 * @function
 * @returns string[]
 */
function getMonthLabels(): string[] {
  const today = new Date();

  const formattedToday = dateFnsFormat(today, DATE_FORMATS.BASE);

  const labels = dateFnsEachWeekOfInterval({
    start: new Date(today.getFullYear(), today.getMonth(), 1),
    end: today,
  }).map((d) => dateFnsFormat(d, DATE_FORMATS.BASE));

  return labels.includes(formattedToday) ? labels : [...labels, formattedToday];
}

/**
 * Returns labels for sales chart (x axis) on a year basis.
 * @function
 * @returns string[]
 */
function getYearLabels(): string[] {
  const months = [];
  const today = new Date();
  for (let i = 0; i <= 11; i++) {
    months.push(
      dateFnsFormat(
        new Date(today.getFullYear(), i, 1),
        DATE_FORMATS.MONTH_READABLE
      )
    );
  }

  return months;
}

/**
 * Returns the minimum lastModification date for the search
 * (for week basis search).
 * @function
 * @returns Date
 */
function getWeekMinDateToSearch(): Date {
  return sub(new Date(), { days: 7 });
}

/**
 * Returns the minimum lastModification date for the search
 * (for month basis search).
 * @function
 * @returns Date
 */
function getMonthMinDateToSearch(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

/**
 * Returns the minimum lastModification date for the search
 * (for year basis search).
 * @function
 * @returns Date
 */
function getYearMinDateToSearch(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), 0, 1);
}

/**
 * Parses the specified date and returns it in the same format
 * as the labels.
 * @param date: Date
 * @param labels: string[]
 * @returns string
 */
function getWeekKeys(date: Date, labels: string[]): string {
  return dateFnsFormat(date, DATE_FORMATS.BASE);
}

/**
 * Parses the specified date and returns it in the same format
 * as the labels.
 * @param date: Date
 * @param labels: string[]
 * @returns string
 */
function getMonthKeys(date: Date, labels: string[]): string {
  const dateWeek = dateFnsGetWeekOfMonth(date);
  return labels[dateWeek - 1];
}

/**
 * Parses the specified date and returns it in the same format
 * as the labels.
 * @param date: Date
 * @param labels: string[]
 * @returns string
 */
function getYearKeys(date: Date, labels: string[]): string {
  return dateFnsFormat(date, DATE_FORMATS.MONTH_READABLE);
}
