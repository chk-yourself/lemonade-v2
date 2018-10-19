const now = new Date();
const currentYear = now.getFullYear();

export const isLeapYear = (year) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export const monthsArr = [
  {
    name: 'January',
    daysTotal: 31,
    abbrev: 'Jan'
  },
  {
    name: 'February',
    daysTotal: isLeapYear(currentYear) ? 29 : 28,
    abbrev: 'Feb'
  },
  {
    name: 'March',
    daysTotal: 31,
    abbrev: 'Mar'
  },
  {
    name: 'April',
    daysTotal: 30,
    abbrev: 'Apr'
  },
  {
    name: 'May',
    daysTotal: 31,
    abbrev: 'May'
  },
  {
    name: 'June',
    daysTotal: 30,
    abbrev: 'Jun'
  },
  {
    name: 'July',
    daysTotal: 31,
    abbrev: 'Jul'
  },
  {
    name: 'August',
    daysTotal: 31,
    abbrev: 'Aug'
  },
  {
    name: 'September',
    daysTotal: 30,
    abbrev: 'Sep'
  },
  {
    name: 'October',
    daysTotal: 31,
    abbrev: 'Oct'
  },
  {
    name: 'November',
    daysTotal: 30,
    abbrev: 'Nov'
  },
  {
    name: 'December',
    daysTotal: 31,
    abbrev: 'Dec'
  }
];

export const weekdaysArr = [
  { full: 'Sunday', short: 'Sun' },
  { full: 'Monday', short: 'Mon' },
  { full: 'Tuesday', short: 'Tue' },
  { full: 'Wednesday', short: 'Wed' },
  { full: 'Thursday', short: 'Thu' },
  { full: 'Friday', short: 'Fri' },
  { full: 'Saturday', short: 'Sat' }
];
