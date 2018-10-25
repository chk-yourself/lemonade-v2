import { $, $all, createNode } from '../lib/helpers.js';

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

export function populateCalendarYears() {
  const date = new Date();
  const year = date.getFullYear();
  const frag = document.createDocumentFragment();
  // Adds current and next 2 years as radio options for year picker
  for (let i = 0; i <= 3; i++) {
    const yearRadio = createNode('input', {
      type: 'radio',
      name: 'year',
      value: `${year + i}`,
      id: `${year + i}`,
      class: 'dp-calendar__radio'
    });
    frag.appendChild(yearRadio);
    const yearLabel = createNode(
      'label',
      {
        for: `${year + i}`,
        class: 'dp-calendar__year'
      },
      `${year + i}`
    );
    frag.appendChild(yearLabel);
  }
  $('#dpCalendarYearDropdown').appendChild(frag);
}

export function updateDateInput(dateComponent, ...newValues) {
  const currentDate = $('#inputDueDate').value; // `mm/dd/yy`
  const currentYear = currentDate.slice(6);
  const currentMonth = currentDate.slice(0, 2);
  const currentDay = currentDate.slice(3, 5);
  switch (dateComponent) {
    case 'month':
      const monthNum = monthsArr.findIndex((x) => x.name === newValues[0]);
      $('#inputDueDate').value = `${
        monthNum > 8 ? monthNum + 1 : `0${monthNum + 1}`
      }/${currentDay}/${currentYear}`;
      break;
    case 'day':
      $('#inputDueDate').value = `${currentMonth}/${
        newValues[0] > 9 ? newValues[0] : `0${newValues[0]}`
      }/${currentYear}`;
      break;
    case 'year':
      $(
        '#inputDueDate'
      ).value = `${currentMonth}/${currentDay}/${newValues[0].slice(2)}`;
      break;
    case 'all':
      const monthIndex = monthsArr.findIndex((x) => x.name === newValues[0]);
      $('#inputDueDate').value = `${
        monthIndex > 8 ? monthIndex + 1 : `0${monthIndex + 1}`
      }/${
        newValues[1] > 9 ? newValues[1] : `0${newValues[1]}`
      }/${newValues[2].slice(2)}`;
      break;
  }
}

export function selectMonth(e) {
  if (!e.target.classList.contains('dp-calendar__month')) return;
  const currentDueDate = $('#inputDueDate').value; // mm-dd-yy
  const dueMonthIndex = +currentDueDate.slice(0, 2) - 1;
  const dueMonth = monthsArr[dueMonthIndex].name;
  const dueDay = +currentDueDate.slice(3, 5);

  const prevSelectedMonth = $('input[name="month"]:checked').value;
  const monthDropdown = $('#dpCalendarMonthDropdown');
  const btnToggleMonthDropdown = $('#btnToggleMonthDropdown');
  const radioId = e.target.getAttribute('for');
  const radio = $(`#${radioId}`);
  radio.checked = true;
  const selectedMonth = radio.value;
  if (selectedMonth !== prevSelectedMonth) {
    $('#btnToggleMonthDropdown .btn-text').textContent = selectedMonth;
    populateCalendarDays(selectedMonth);

    if (selectedMonth === dueMonth) {
      $(
        `.dp-calendar__btn--select-day[value="${dueDay}"][data-month="${selectedMonth}"]`
      ).classList.add('is-selected');
    }
  }
  btnToggleMonthDropdown.classList.remove('is-active');
  monthDropdown.classList.remove('is-active');
}

export function selectYear(e) {
  if (!e.target.classList.contains('dp-calendar__year')) return;

  const currentDueDate = $('#inputDueDate').value; // mm-dd-yy
  const dueMonthIndex = +currentDueDate.slice(0, 2) - 1;
  const dueMonth = monthsArr[dueMonthIndex].name;
  const dueDay = +currentDueDate.slice(3, 5);
  const dueYear = `20${currentDueDate.slice(6)}`;

  const prevSelectedYear = $('input[name="year"]:checked').value;
  const btnToggleYearDropdown = $('#btnToggleYearDropdown');
  const yearDropdown = $('#dpCalendarYearDropdown');
  const radioId = e.target.getAttribute('for');
  const radio = $(`#${radioId}`);
  radio.checked = true;
  const selectedYear = radio.value;

  if (selectedYear !== prevSelectedYear) {
    $('#btnToggleYearDropdown .btn-text').textContent = selectedYear;
    populateCalendarDays(dueMonth);

    // Length of February depends on leap year
    if (selectedYear === dueYear) {
      $(
        `.dp-calendar__btn--select-day[value="${dueDay}"][data-month="${dueMonth}"]`
      ).classList.add('is-selected');
    }
  }
  btnToggleYearDropdown.classList.remove('is-active');
  yearDropdown.classList.remove('is-active');
}

export function populateCalendarDays(monthStr) {
  while ($('#dpCalendar').contains($('.dp-calendar__day'))) {
    $('.dp-calendar__day').remove();
  }

  const year = $('input[name="year"]:checked').value;
  const monthIndex = monthsArr.findIndex((month) => month.name === monthStr);
  const month = monthsArr[monthIndex];
  const monthStartingDate = new Date(year, monthIndex, 1);
  const monthStartingDayNum = monthStartingDate.getDay();
  const prevMonth =
    monthIndex !== 0 ? monthsArr[monthIndex - 1] : monthsArr[11];
  const nextMonth =
    monthIndex !== 11 ? monthsArr[monthIndex + 1] : monthsArr[0];

  if (monthStr === 'February') {
    month.daysTotal = isLeapYear(year) ? 29 : 28;
  }

  const frag = document.createDocumentFragment();

  if (monthStartingDayNum !== 0) {
    for (
      let j = prevMonth.daysTotal - monthStartingDayNum + 1;
      j <= prevMonth.daysTotal;
      j++
    ) {
      const btnDay = createNode(
        'button',
        {
          class: 'dp-calendar__btn--select-day dp-calendar__btn--prev-month',
          type: 'button',
          'data-month': prevMonth.name,
          'data-year': prevMonth.name === 'December' ? +year - 1 : year,
          'data-action': 'selectDay',
          value: j
        },
        `${j}`
      );
      const divDay = createNode(
        'div',
        {
          class: 'dp-calendar__day dp-calendar__day--prev-month'
        },
        btnDay
      );
      frag.appendChild(divDay);
    }
  }

  for (let i = 1; i <= month.daysTotal; i++) {
    const btnDay = createNode(
      'button',
      {
        class: 'dp-calendar__btn--select-day',
        type: 'button',
        'data-month': month.name,
        'data-year': year,
        'data-action': 'selectDay',
        'data-first': i === 1,
        'data-last': i === month.daysTotal,
        value: i
      },
      `${i}`
    );
    const divDay = createNode(
      'div',
      {
        class: 'dp-calendar__day'
      },
      btnDay
    );
    frag.appendChild(divDay);
  }

  if (frag.children.length % 7 !== 0) {
    for (let k = 1; k < 7; k++) {
      const btnDay = createNode(
        'button',
        {
          class: 'dp-calendar__btn--select-day dp-calendar__btn--next-month',
          type: 'button',
          'data-month': nextMonth.name,
          'data-year': nextMonth.name === 'January' ? +year + 1 : year,
          'data-action': 'selectDay',
          value: k
        },
        `${k}`
      );
      const divDay = createNode(
        'div',
        {
          class: 'dp-calendar__day dp-calendar__day--next-month'
        },
        btnDay
      );
      frag.appendChild(divDay);
      if (frag.children.length % 7 === 0) {
        break;
      }
    }
  }

  $('#dpCalendarDayPicker').appendChild(frag);
}

export function selectDay(e) {
  const el = e.target;
  if (el.dataset.action !== 'selectDay') return;

  $all('.dp-calendar__btn--select-day').forEach((x) => {
    if (x === el) {
      x.classList.add('is-selected');
    } else {
      x.classList.remove('is-selected');
    }
  });
  const selectedDay = el.value;
  const selectedMonth = el.dataset.month;
  const selectedYear = el.dataset.year;
  updateDateInput('all', selectedMonth, selectedDay, selectedYear);

  if (
    el.classList.contains('dp-calendar__btn--prev-month') ||
    el.classList.contains('dp-calendar__btn--next-month')
  ) {
    if (
      (el.classList.contains('dp-calendar__btn--prev-month') &&
        selectedMonth === 'December') ||
      (el.classList.contains('dp-calendar__btn--next-month') &&
        selectedMonth === 'January')
    ) {
      $(`input[name="year"][value="${selectedYear}"]`).checked = true;
      $('#btnToggleYearDropdown .btn-text').textContent = selectedYear;
    }

    $(`input[name="month"][value="${selectedMonth}"]`).checked = true;
    $('#btnToggleMonthDropdown .btn-text').textContent = selectedMonth;
    populateCalendarDays(selectedMonth);
    $(
      `.dp-calendar__btn--select-day[value="${selectedDay}"][data-month="${selectedMonth}"]`
    ).classList.add('is-selected');
  }
}


