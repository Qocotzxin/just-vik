import getWeekOfMonth from 'date-fns/getWeekOfMonth';
import eachWeekOfInterval from 'date-fns/eachWeekOfInterval';
import format from 'date-fns/format';
import { es } from 'date-fns/locale';
import sub from 'date-fns/sub';
import { Lapse } from '../model/chart';

export const DATE_FORMATS = {
  BASE: 'dd/MM/yyyy',
  FULL: 'dd/MM/yyyy HH:mm:ss',
  MONTH_READABLE: 'MMMM',
};

export const LABELS = {
  [Lapse.week]: {
    keys: getWeekKeys,
    value: getWeekLabels,
    condition: getWeekCondition,
  },
  [Lapse.month]: {
    keys: getMonthKeys,
    value: getMonthLabels,
    condition: getMonthCondition,
  },
  [Lapse.year]: {
    keys: getYearKeys,
    value: getYearLabels,
    condition: getYearCondition,
  },
};

/**
 * Formats a date into the expected string format.
 * @param date {number | Date}
 * @param formatStr {string}
 * @returns {string}
 */
export function dateFnsFormat(
  date: number | Date,
  formatStr = DATE_FORMATS.FULL
) {
  return format(date, formatStr, {
    locale: es,
  });
}

export function dateFnsGetWeekOfMonth(date: number | Date) {
  return getWeekOfMonth(date, {
    locale: es,
  });
}

/**
 * Retrieves labels for sales chart on a week basis.
 */
function getWeekLabels(): string[] {
  const labels = [];
  const now = new Date();

  for (let days = 7; days >= 0; --days) {
    labels.push(dateFnsFormat(sub(now, { days }), DATE_FORMATS.BASE));
  }

  return labels;
}

function getMonthLabels(): string[] {
  const today = new Date();

  const formattedToday = dateFnsFormat(today, DATE_FORMATS.BASE);

  const labels = eachWeekOfInterval(
    {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: today,
    },
    { locale: es }
  ).map((d) => dateFnsFormat(d, DATE_FORMATS.BASE));

  return !!labels.find(d => d === formattedToday) ? labels : [...labels, formattedToday];
}

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

function getWeekCondition(): Date {
  return sub(new Date(), { days: 7 });
}

function getMonthCondition(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

function getYearCondition(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), 0, 1);
}

function getWeekKeys(date: Date, labels: string[]) {
  return dateFnsFormat(date, DATE_FORMATS.BASE);
}

function getMonthKeys(date: Date, labels: string[]) {
  const dateWeek = dateFnsGetWeekOfMonth(date);
  return labels[dateWeek - 1];
}

function getYearKeys(date: Date, labels: string[]) {
  return dateFnsFormat(date, DATE_FORMATS.MONTH_READABLE);
}
