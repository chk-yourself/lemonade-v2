import { uniqueID } from '../lib/helpers.js';
import { isLeapYear, monthsArr, weekdaysArr } from './Calendar.js';

export default class Task {
  constructor(text, listId, obj = null) {
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
      this.listId = listId;
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
      this.listId = obj.listId;
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

function addSubtask(e) {
  e.preventDefault();

  if (e.target.dataset.action !== 'addSubtask') return;
  const id = hiddenTaskId.value;

  const currentTask = state.activeList.getTask(id);
  const todoIndex = state.activeList.findTaskIndex(id);
  const currentList = state.activeList;

  const text = $('#newSubtaskInput').value;
  if (text) {
    const newSubtask = new Subtask(text);
    currentTask.subtasks.push(newSubtask);
    populateSubtasks(currentList.tasks, 'subtasks', ulSubtasks, todoIndex);
    $all('.edit-todo-form__textarea--subtask', ulSubtasks).forEach(
      (subtask) => autoHeightResize(subtask)
    );
    $('#newSubtaskInput').value = '';
  }
}

function addNote(e) {
  if (!e.target.classList.contains('todo-item__note')) return;
  const id = formEditTodo.dataset.id;
  const currentTask = state.activeList.getTask(id);
  const todoIndex = state.activeList.findTaskIndex(id); // index of todo object with matching ID in TODOS array
  const text = e.target.value;
  if (!/^\s+$/.test(text)) {
    currentTask.note = text;
    saveToStorage();
  }
}

function renameTodo(e) {
  if (!e.target.classList.contains('todo-item__title')) return;
  const id = e.target.dataset.id;
  const newText = e.target.value.trim();
  const currentTask = state.activeList.getTask(id);
  const todoItem = $(`#${id}`);
  if (newText !== '') {
    currentTask.text = newText;
    // saveToStorage();

    if (e.currentTarget === $('#taskName')) {
      $('.todo-item__title', todoItem).value = newText;
    } else {
      if (todoAppContainer.classList.contains('show-task-details')) {
        $('#taskName').value = newText;
      }
    }
  }
}

function editSubtask(e) {
  if (!e.target.classList.contains('edit-todo-form__textarea--subtask'))
    return;
  const id = e.currentTarget.dataset.id;
  const currentTask = state.activeList.getTask(id);
  const newSubtaskText = e.target.value;
  const subtaskIndex = e.target.dataset.subIndex;
  currentTask.subtasks[subtaskIndex].text = newSubtaskText.trim();
  // saveToStorage();
}

// Tags
function addTag(e) {
  if (e.target.dataset.action !== 'addTag' && $('#newTagInput').value === '')
    return;
  e.preventDefault();
  const tagsContainer = $('#tagsContainer');
  const newTagInput = $('#newTagInput');
  const id = formEditTodo.dataset.id;
  const todoIndex = state.activeList.findTaskIndex(id);
  const currentTask = state.activeList.getTask(id);
  const todoItem = $(`#${id}`);
  const tagLabels = $('.todo-item__tag-labels', todoItem);
  const tagsTooltipBtn =
    tagLabels.querySelector('.btn--tooltip') ||
    createNode(
      'button',
      {
        class: 'btn btn--tooltip tag-labels__btn--tooltip',
        'data-tooltip': '',
        type: 'button'
      },
      '...'
    );
  if (!tagLabels.contains(tagsTooltipBtn)) {
    tagLabels.appendChild(tagsTooltipBtn);
  }
  if (newTagInput.value !== '') {
    const text = filterTag(newTagInput.value);

    // Prevents duplicating existing tags for a todo item
    if (findExistingTag(text, todoIndex)) return;

    if (text.length > 0) {
      const existingTag = findExistingTag(text);
      const tag = {
        text,
        // Assigns color of previously created tag that matches text, if exists
        color: existingTag !== undefined ? existingTag.color : 'bg--default'
      };
      state.activeList.tasks[todoIndex].tags.push(tag);
      // saveToStorage();
      const deleteTagBtn = createNode('button', {
        class: 'close-icon',
        type: 'button',
        value: 'false'
      });
      deleteTagBtn.addEventListener(
        'click',
        (e) => {
          removeTag(
            todoIndex,
            state.activeList.tasks[todoIndex].tags.indexOf(tag)
          );
        },
        false
      );
      const newTagNode = createNode(
        'span',
        {
          class: `tag ${tag.color}`,
          'data-tag-index': state.activeList.tasks[todoIndex].tags.indexOf(
            tag
          )
        },
        tag.text,
        deleteTagBtn
      );
      tagsContainer.insertBefore(newTagNode, newTagInput);
      const tagLabel = createNode(
        'span',
        {
          class: `tag tag-label ${tag.color}`
        },
        tag.text
      );

      // Updates tooltip data
      tagsTooltipBtn.dataset.tooltip = currentTask.tagSummary;
      tagLabels.insertBefore(tagLabel, tagsTooltipBtn);
      newTagInput.value = '';

      // Appends color picker to tag node if there are no existing tags that matches text
      if (existingTag === undefined) {
        newTagNode.appendChild(colorPicker);
        $('#colorDefault', colorPicker).checked = true;
        colorPicker.classList.add('is-visible');
      }
    }
  }
}

function removeTag(todoIndex, tagIndex) {
  const currentTask = state.activeList.tasks[todoIndex];
  const id = currentTask.id;
  const todoItem = $(`#${id}`);
  $all('#tagsContainer .tag', formEditTodo)[tagIndex].remove();
  $all('.todo-item__tag-labels .tag-label', todoItem)[tagIndex].remove();
  currentTask.tags.splice(tagIndex, 1);
  // saveToStorage();
  const tagsTooltipBtn = $('.tag-labels__btn--tooltip', todoItem);
  if (currentTask.tags.length > 0) {
    // Update tags tooltip
    tagsTooltipBtn.dataset.tooltip = currentTask.tagSummary;
  } else {
    tagsTooltipBtn.remove();
  }
}

 /**
   * Returns first existing tag that matches string and undefined if it doesn't exist
   * @param {num} [todoIndex =0] - limits the search of an existing tag to the todo object at the index provided
   */
  function findExistingTag(text, todoIndex = undefined) {
    let existingTag;
    const currentList = state.activeList;
    if (todoIndex !== undefined) {
      existingTag = currentList.tasks[todoIndex].tags.find(
        (tag) => tag.text === text
      );
    } else {
      for (let i = 0; i < todoLists.length; i++) {
        for (let j = 0; j < todoLists[i].tasks.length; j++) {
          existingTag = todoLists[i].tasks[j].tags.find(
            (tag) => tag.text === text
          );
          if (existingTag !== undefined) {
            break;
          }
        }
        if (existingTag !== undefined) {
          break;
        }
      }
    }
    return existingTag;
  }