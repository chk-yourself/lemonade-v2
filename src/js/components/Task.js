import { uniqueID } from '../lib/helpers.js';
import { isLeapYear, monthsArr, weekdaysArr } from './Calendar.js';

export default class Task {
  constructor(text, obj = null) {
    if (!obj) {
      this.text = text;
      this.isDone = false;
      this.subtasks = [];
      this.note = '';
      this.tags = [];
      this.id = uniqueID();
      this.dueDate = null;
      this.isPriority = false;
      this.dateCreated = new Date();
      this.lastModified = null;
    } else {
      this.text = obj.text;
      this.isDone = obj.isDone;
      this.subtasks = obj.subtasks;
      this.note = obj.note;
      this.tags = obj.tags;
      this.id = obj.id;
      this.dueDate = obj.dueDate;
      this.isPriority = obj.isPriority;
      this.dateCreated = obj.dateCreated;
      this.lastModified = obj.lastModified;
    }
  }

  get elem() {
    return document.getElementById(this.id);
  }

  get tagSummary() {
    return this.tags.map((tag) => tag.text).join(', ');
  }

  get isDueToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(this.dueDate).valueOf() === today.valueOf();
  }

  get isDueTomorrow() {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonthIndex = today.getMonth();
    const currentYear = today.getFullYear();
    const nextYear = currentYear + 1;
    const currentMonth = monthsArr[currentMonthIndex];
    const nextMonthIndex =
      currentMonth.name !== 'December' ? currentMonthIndex + 1 : 0;
    if (currentMonth.name === 'February') {
      currentMonth.daysTotal = isLeapYear(currentYear) ? 29 : 28;
    }
    const tomorrow =
      currentDay < currentMonth.daysTotal
        ? new Date(currentYear, currentMonthIndex, currentDay + 1)
        : nextMonthIndex !== 0
          ? new Date(currentYear, nextMonthIndex, 1)
          : new Date(nextYear, nextMonthIndex, 1);
    return new Date(this.dueDate).valueOf() === tomorrow.valueOf();
  }

  get dueDateText() {
    const dueDate = new Date(this.dueDate);
    const dueMonthIndex = dueDate.getMonth();
    const dueMonthAbbrev = monthsArr[dueMonthIndex].abbrev;
    const dueDay = dueDate.getDate();
    return `${dueMonthAbbrev} ${dueDay}`;
  }

  get dueMonthAbbrev() {
    const dueDate = new Date(this.dueDate);
    const dueMonthIndex = dueDate.getMonth();
    return monthsArr[dueMonthIndex].abbrev;
  }

  get dueDayNumStr() {
    const dueDate = new Date(this.dueDate);
    const dayNum = dueDate.getDate();
    return dayNum > 9 ? '' + dayNum : '0' + dayNum;
  }

  get dueYearStr() {
    const dueDate = new Date(this.dueDate);
    return '' + dueDate.getFullYear();
  }

  get dueDayOfWeek() {
    const dueDate = new Date(this.dueDate);
    return this.isDueToday
      ? 'Today'
      : this.isDueTomorrow
        ? 'Tomorrow'
        : weekdaysArr[dueDate.getDay()].full;
  }

  toggleDone() {
    this.isDone = !this.isDone;
  }

  addNote(note) {
    this.note = note;
  }

  editSubtask(subtaskIndex, text) {
    this.subtasks[subtaskIndex].text = text.trim();
  }

}