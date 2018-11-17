import List, {
  createList,
  renderListOption,
  openList,
  updateList,
  deleteList,
  displayList,
  toggleContent,
  deleteTask
} from './components/List.js';
import Task from './components/Task.js';
import Subtask from './components/Subtask.js';
import { 
  uniqueID,
  camelCased, 
  $, 
  $all,
  clickTouch,
  createNode,
  autoHeightResize,
  filterTag
} from './lib/helpers.js';
import { 
  isLeapYear, 
  monthsArr, 
  weekdaysArr, 
  populateCalendarYears,
  updateDateInput,
  selectMonth,
  selectYear,
  populateCalendarDays,
  selectDay
} from './components/Calendar.js';
import {expandSearchBar} from './components/SearchBar.js';
import {
  toggleMenu,
displayPanel,
createNavItem,
renderNavItems
} from './components/Nav.js';
import {
  stickToolbar,
  initBulkEditing,
  highlightSelected,
  enableBulkActions
} from './components/BulkActionsToolbar.js'
import store from './store/index.js';
import * as selectors from './store/selectors.js';

function initClasses(arr) {
  return arr.map((item) => {
    const list = new List(null, null, item);
    list.tasks = item.tasks.map((task) => new Task(null, task));
    return list;
  });
}


(function app() {

  // Variables
  const divTodoApp = $('#todoApp');
  const formAddTodo = $('#addTodoForm');
  const formEditTodo = $('#editTodoForm');
  const formSearch = $('#searchForm');
  const searchBar = $('#searchBar');
  const inputSearch = $('#searchInput');
  const ulSubtasks = $('#subtaskList');
  const divViews = $('#views');
  const colorPicker = $('#colorPicker');
  const formNewList = $('#newListForm');
  const fieldsetFolders = $('#fieldsetFolders');
  const formEditList = $('#editListForm');
  const inputNewFolder = $('#newFolderInput');
  const todoAppContainer = $('#todoAppContainer');
  const taskDetails = $('#taskDetails');
  const hiddenTaskId = $('#taskId');
  const lemonade = JSON.parse(localStorage.getItem('lemonade')) || {};
  
  function saveToStorage() {
    const {lists, tasks, settings} = store.state;
    localStorage.setItem('lemonade', JSON.stringify({ lists, tasks, settings }));
  }

  const BACKSPACE_KEY = 8;
  const ENTER_KEY = 13;
  const state = {
    activeList: null,
    filteredList: null,
    nextOnboardingStep: null,
    onboarding: {
      currentStep: null,
      statusLog: [false, false, false],
      get isCompleted() {
        return this.statusLog.every((status) => status === true);
      },
      get nextStep() {
        return this.isCompleted
          ? 4
          : this.currentStep === 3
            ? this.statusLog.indexOf(false) + 1
            : this.statusLog.indexOf(false, this.currentStep) + 1;
      },
      set updateStatus(val) {
        this.statusLog[this.currentStep - 1] = val;
      }
    }
  };

  if (lemonade.settings && !lemonade.settings.isNewUser) {
    store.dispatch('loadLists', { lists: lemonade.lists });
  } else {
   // $('#onboarding').classList.add('is-active');
  }
  console.log(store.state.lists);
  const inbox = store.state.listsById['inbox'];
  // Populates inbox tasks on load
  // displayList(inbox);
  
  // Add toggleDone functionality to all prebuilt lists
  $all('.todo-list').forEach((list) => {
    list.addEventListener('click', toggleDone);
    list.addEventListener('click', toggleContent);
    list.addEventListener('click', setPriority);
    updateTaskCount(list.id);
  });

  // Creates list node for each list object, except for the inbox list
  /*
  todoLists.forEach((list, i) => {
    if (i !== 0) {
      createList(list);
    }
  });
  */

  // Adds new task object to current list array
  function addTodo(e) {
    e.preventDefault();
    const target = e.currentTarget;

    const ulActiveList = $('.is-active-list');

    const text = $('#todoInput').value;
    if (text !== '') {
      const todo = new Task(text);
      state.activeList.tasks.push(todo); // Add new item to bottom of the list
      populateList(state.activeList.tasks, ulActiveList);
      updateTaskCount(state.activeList.id);
    }
    target.reset();
    if (target.offsetTop >= window.innerHeight) {
      $('#todoInput').scrollIntoView(true);
      $('#todoInput').focus();
    }
  }

  // Renders todo objects as list items
  function populateList(itemsArray = [], itemsList) {
    itemsList.innerHTML = itemsArray
      .map(
        (item, i) => `<li class= "todo-list__item${
          item.isDone ? ' is-done' : ''
        }${item.isPriority ? ' is-priority' : ''}${
          item.dueDate ||
          (state.filteredList !== null && $('#searchInput').value === '')
            ? ' show-info'
            : ''
        }" data-index="${i}" id="${item.id}">
<input type="checkbox" id="item-${i}" data-index="${i}" value="${item.text}" ${
          item.isDone ? 'checked' : ''
        } />
<label for ="item-${i}" class="todo-list__checkbox"></label>
<textarea class="form__textarea todo-item__title" data-index="${i}" data-id="${
          item.id
        }">${item.text}</textarea>
<div class="todo-item__tag-labels"></div><span class="lemon" data-id="${
          item.id
        }"></span>${
          item.dueDate !== null
            ? `<span class="badge--due-date${
                item.isDueToday
                  ? ' badge--today'
                  : item.isDueTomorrow
                    ? ' badge--tomorrow'
                    : ''
              }">${
                item.isDueToday
                  ? 'Today'
                  : item.isDueTomorrow
                    ? 'Tomorrow'
                    : item.dueDateText
              }</span>`
            : ''
        }
</li>`
      )
      .join('');

    const itemsCollection = $all('.todo-list__item', itemsList);

    // Adds event listeners to each list item
    for (let i = 0; i < itemsCollection.length; i++) {
      let todoItem = itemsCollection[i];

      if (state.filteredList !== null) {
        todoItem.addEventListener(
          'click',
          (e) => {
            const id = e.currentTarget.id;
            state.activeList = getListByTaskId(id);
          },
          true
        );
      }
      
      const itemTitle = $('.todo-item__title', todoItem);
      itemTitle.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        state.activeList = getListByTaskId(id);
      });
      itemTitle.addEventListener('change', renameTodo);

      // Creates tag labels and badges for each todo item, if any
      const id = todoItem.id;

      for (let j = 0; j < itemsArray.length; j++) {
        if (itemsArray[j].id === id) {
          const taskObj = itemsArray[j];

          // Renders tag labels
          if (taskObj.tags.length > 0) {
            const tagLabels = $('.todo-item__tag-labels', todoItem);
            const tagsTooltipBtn = createNode(
              'button',
              {
                class: 'btn btn--tooltip tag-labels__btn--tooltip',
                'data-tooltip': `${taskObj.tagSummary}`,
                type: 'button'
              },
              '...'
            );
            tagsTooltipBtn.addEventListener('click', (e) => {
              e.currentTarget.classList.toggle('show-tooltip');
            });
            tagLabels.appendChild(tagsTooltipBtn);

            // Renders tag labels
            taskObj.tags.forEach((tag, i) => {
              const tagLabel = createNode(
                'span',
                {
                  class: `tag tag-label ${tag.color}`
                },
                tag.text
              );
              tagLabels.insertBefore(tagLabel, tagsTooltipBtn);
            });
          }
        }
      }
    }
  }

  function getListByTaskId(todoId) {
    return todoLists.find((list) =>
      list.tasks.find((task) => task.id === todoId)
    );
  }

  // Updates todo object's `done` property to reflect current `checked` state
  function toggleDone(e) {
    const el = e.target;
    if (
      !el.classList.contains('todo-list__checkbox') ||
      el.classList.contains('bulk-actions__checkbox')
    )
      return;

    const id = el.parentNode.id;

    state.activeList = getListByTaskId(id);

    const ulActiveList = $('.is-active-list');
    const listHeight = parseInt(window.getComputedStyle(ulActiveList).height);
    const index = state.activeList.findTaskIndex(id);
    const currentTask = state.activeList.getTask(id);
    const indexFirstCompleted = state.activeList.tasks.findIndex(
      (item) => item.isDone === true
    ); // Index of most recently completed task

    currentTask.isDone = !currentTask.isDone;

    if (currentTask.isDone && state.activeList.tasks.length !== 1) {
      // Moves completed task to bottom of todo list
      state.activeList.tasks.push(state.activeList.tasks.splice(index, 1)[0]);

      $all('.todo-list__item', ulActiveList).forEach((item, i) => {
        if (i === index) {
          item.style.transform = `translateY(${listHeight -
            item.offsetTop -
            58}px)`;
        } else if (i > index) {
          item.style.transform = `translateY(-58px)`;
        }
      });
    }
    if (!currentTask.isDone && index > 0 && indexFirstCompleted !== -1) {
      $all('.todo-list__item', ulActiveList).forEach((item, i) => {
        if (i === index) {
          const firstCompletedItem =
            state.activeList.tasks[indexFirstCompleted].elem;
          item.style.transform = `translateY(${firstCompletedItem.offsetTop -
            item.offsetTop}px)`;
        } else if (
          i === indexFirstCompleted ||
          (i < index && i > indexFirstCompleted)
        ) {
          item.style.transform = `translateY(58px)`;
        }
      });
      state.activeList.tasks.splice(
        indexFirstCompleted,
        0,
        state.activeList.tasks.splice(index, 1)[0]
      );
    }

    // Update active task count in sidebar
    updateTaskCount(state.activeList.id);

    const currentTasksList =
      state.filteredList === null ? state.activeList.tasks : state.filteredList;
    const activeFilter = (task) => !task.isDone;
    const completedFilter = (task) => task.isDone;
    const filteredArray = (arr, callback) =>
      arr.reduce((acc, list) => {
        const filteredTasks = list.filter(callback);
        if (filteredTasks.length > 0) {
          acc.push(filteredTasks);
        }
        return acc;
      }, []);

    const activeTodos = Array.isArray(currentTasksList[0])
      ? filteredArray(currentTasksList, activeFilter)
      : currentTasksList.filter((task) => !task.isDone);
    const completedTodos = Array.isArray(currentTasksList[0])
      ? filteredArray(currentTasksList, completedFilter)
      : currentTasksList.filter((task) => task.isDone);
    const action = divViews.querySelector('.is-selected').dataset.action;

    if (action === 'viewActive') {
      window.setTimeout(() => {
        renderList(activeTodos, ulActiveList);
      }, 300);
    } else if (action === 'viewCompleted') {
      window.setTimeout(() => {
        renderList(completedTodos, ulActiveList);
      }, 300);
    } else {
      window.setTimeout(() => {
        renderList(currentTasksList, ulActiveList);
      }, 300);
    }
  }

  // Updates subtask object's `done` property to reflect current `checked` state
  function toggleComplete(e) {
    if (!e.target.classList.contains('subtask-list__checkbox')) return;
    const id = formEditTodo.dataset.id;
    const todoIndex = state.activeList.tasks.findIndex(
      (task) => task.id === id
    );
    const currentTask = state.activeList.tasks.find((task) => task.id === id);
    const subtaskIndex = e.target.dataset.subIndex;
    currentTask.subtasks[subtaskIndex].isDone = !currentTask.subtasks[
      subtaskIndex
    ].isDone;
    populateSubtasks(state.activeList.tasks, 'subtasks', ulSubtasks, todoIndex);
  }

  // Empties todos array and removes all rendered todo items
  function clearAll(e) {
    while (todoLists.length > 1) {
      todoLists.pop(); // Remove all lists, except inbox
    }
    while (inbox.tasks.length > 0) {
      inbox.tasks.pop();
    }
    window.location.reload(true);
  }

  /**
   * Renders subtask objects as HTML list items
   * @param {Array} items
   * @param {Node} itemsList - the HTML <ul> element to contain the list items
   */
  function populateSubtasks(itemsArray = [], prop, itemsList, k) {
    itemsList.innerHTML = itemsArray[k][prop]
      .map(
        (subitem, i) => `<li class="subtask-list__item">
<input type="checkbox" id="i${k}--${i}" name="i${k}--${i}" data-index="${k}" data-sub-index="${i}" class="subtask-list__checkbox" ${
          subitem.isDone ? 'checked' : ''
        } />
<label for="i${k}--${i}" class="subtask-list__checkbox" data-index="${k}" data-sub-index="${i}"></label>
<textarea class="form__textarea edit-todo-form__textarea--subtask" data-index="${k}" data-sub-index=${i}>${
          subitem.text
        }</textarea>
</li>`
      )
      .join('');
  }


  function enableAutoHeightResize(e) {
    autoHeightResize(e.currentTarget);
  }


  function populateTaskDetails(id) {
    // Change state to current list object
    state.activeList = getListByTaskId(id);
    const ulActiveList = $('.is-active-list');
    const currentTask = state.activeList.getTask(id);
    const todoIndex = state.activeList.findTaskIndex(id);
    const todoItemTitle = $('#taskName');
    const todoItemNote = $('.todo-item__note', formEditTodo);
    const newTagInput = $('#newTagInput');
    const lemon = $('.task-details__lemon', taskDetails);
    todoItemTitle.value = currentTask.text;
    todoItemTitle.dataset.id = id;
    todoItemTitle.dataset.index = todoIndex;
    todoItemNote.value = currentTask.note;
    lemon.dataset.id = id;

    if (currentTask.isPriority) {
      taskDetails.classList.add('is-priority');
    } else {
      taskDetails.classList.remove('is-priority');
    }

    $('#btnCloseTaskDetails .list-name').textContent =
      ulActiveList.dataset.name;
    $('#taskDetailsBreadcrumbs .list-name').textContent = state.activeList.name;
    $('#taskDetailsBreadcrumbs .breadcrumbs__link').setAttribute(
      'href',
      `#${state.activeList.id}`
    );

    if (state.activeList.folder !== null) {
      $('#taskDetailsBreadcrumbs .folder-name').textContent =
        state.activeList.folder;
      $('#taskDetailsBreadcrumbs').classList.add('show-folder');
    } else {
      $('#taskDetailsBreadcrumbs').classList.remove('show-folder');
    }

    if (state.activeList.id === 'inbox') {
      $('#taskDetailsBreadcrumbs .feather-list').classList.add('is-hidden');
      $('#taskDetailsBreadcrumbs .feather-inbox').classList.remove('is-hidden');
    } else {
      $('#taskDetailsBreadcrumbs .feather-inbox').classList.add('is-hidden');
      $('#taskDetailsBreadcrumbs .feather-list').classList.remove('is-hidden');
    }

    if (currentTask.dueDate !== null) {
      $('#dueDateWrapper').classList.add('has-due-date');
      $('#dueDateWrapper .due-date-text').textContent = currentTask.dueDateText;
    } else {
      $('#dueDateWrapper').classList.remove('has-due-date');
      $('#dueDateWrapper .due-date-text').textContent = 'Set due date';
    }

    populateSubtasks(state.activeList.tasks, 'subtasks', ulSubtasks, todoIndex);
    const subtasks = $all('.edit-todo-form__textarea--subtask', ulSubtasks);
    formEditTodo.dataset.index = todoIndex;
    formEditTodo.dataset.id = id;
    colorPicker.dataset.index = todoIndex;
    colorPicker.dataset.id = id;

    // Readjust height of textareas to display all content within
    setTimeout(() => {
      autoHeightResize(todoItemTitle);
      if (!todoItemNote.value) {
        todoItemNote.style.height = '0px';
      } else {
        autoHeightResize(todoItemNote);
      }
      if (currentTask.subtasks.length > 0) {
        subtasks.forEach((subtask) => autoHeightResize(subtask));
      }
    }, 0);

    const tagsContainer = $('#tagsContainer');

    if (currentTask.tags.length > 0) {
      currentTask.tags.forEach((tag, i) => {
        const deleteTagBtn = createNode('button', {
          class: 'close-icon',
          type: 'button',
          value: 'false'
        });
        deleteTagBtn.addEventListener('click', (e) => {
          removeTag(todoIndex, i);
        });
        const newTagNode = createNode(
          'span',
          {
            class: 'tag',
            'data-tag-index': i
          },
          tag.text,
          deleteTagBtn
        );
        newTagNode.classList.add(tag.color);
        tagsContainer.insertBefore(newTagNode, newTagInput);
      });
    }
    feather.replace();
  }

  function updateView(e) {
    const ulActiveList = $('.is-active-list');
    const currentTasksList =
      state.filteredList !== null ? state.filteredList : state.activeList.tasks;

    const activeFilter = (task) => !task.isDone;
    const completedFilter = (task) => task.isDone;
    const filteredArray = (arr, callback) =>
      arr.reduce((acc, list) => {
        const filteredTasks = list.filter(callback);
        if (filteredTasks.length > 0) {
          acc.push(filteredTasks);
        }
        return acc;
      }, []);
    const activeTodos = Array.isArray(currentTasksList[0])
      ? filteredArray(currentTasksList, activeFilter)
      : currentTasksList.filter((task) => !task.isDone);
    const completedTodos = Array.isArray(currentTasksList[0])
      ? filteredArray(currentTasksList, completedFilter)
      : currentTasksList.filter((task) => task.isDone);
    const action = e.target.dataset.action;
    switch (action) {
      case 'viewAll':
        renderList(currentTasksList, ulActiveList);
        break;
      case 'viewActive':
        renderList(activeTodos, ulActiveList);
        break;
      case 'viewCompleted':
        renderList(completedTodos, ulActiveList);
        break;
    }
    const viewBtns = divViews.querySelectorAll('.views__btn');
    // Mark current view displayed by adding '.is-selected' class to corresponding button
    for (let i = 0; i < viewBtns.length; i++) {
      if (e.target !== viewBtns[i]) {
        viewBtns[i].classList.remove('is-selected');
      } else {
        viewBtns[i].classList.add('is-selected');
      }
    }
  }

  function createBreadcrumbs(listElement) {
    $all('.todo-list__item', listElement).forEach((item) => {
      const list = getListByTaskId(item.id);
      const folderName =
        list.folder !== null
          ? createNode(
              'span',
              { class: 'breadcrumbs__folder' },
              list.folder,
              createNode('i', { 'data-feather': 'chevron-right' })
            )
          : '';
      const listLink = createNode(
        'a',
        { class: 'breadcrumbs__link', href: `#${list.id}` },
        list.name
      );
      listLink.addEventListener('click', openList);
      const breadcrumbs = createNode(
        'div',
        { class: 'breadcrumbs' },
        folderName,
        listLink
      );
      item.appendChild(breadcrumbs);
      const badgeDueDate = $('.badge--due-date', item);
      if (badgeDueDate) {
        badgeDueDate.classList.add('is-hidden');
      }
    });
    feather.replace();
  }

  function renderList(itemsArray, itemsList) {
    const ulActiveList = $('.is-active-list');
    if (itemsList === $('#filteredList')) {
      $('#main').classList.add('show-search-results');
    } else {
      $('#main').classList.remove('show-search-results');
    }

    if ($('#bulkActionsToolbar').classList.contains('is-active')) {
      $('#bulkActionsToolbar').classList.remove('is-active');
      ulActiveList.removeEventListener('click', enableBulkActions);
      $('#main').removeEventListener('scroll', stickToolbar);
      ulActiveList.classList.remove('bulk-editing-list');
      $('#addTodoForm').classList.remove('is-hidden');
    }

    if (Array.isArray(itemsArray[0])) {
      $all('.todo-list').forEach((list) => (list.innerHTML = ''));

      const filterByDate = itemsList === $('#upcoming');
      itemsArray.forEach((list) => {
        const taskId = list[0].id;
        const listObj = getListByTaskId(taskId);
        const firstTask = listObj.getTask(taskId);

        const folderName =
          listObj.folder !== null
            ? createNode(
                'span',
                { class: 'filtered-list__folder-name' },
                listObj.folder,
                createNode('i', { 'data-feather': 'chevron-right' })
              )
            : '';
        // Create sub-list
        const ulSubList = createNode('ul', {
          class: 'filtered-list__sub-list'
        });
        // Create list link
        const subListTitle = filterByDate
          ? createNode(
              'h2',
              { class: 'filtered-list__date filtered-list__sub-list-name' },
              createNode(
                'span',
                { class: 'filtered-list__day-num' },
                firstTask.dueDayNumStr
              ),
              createNode(
                'span',
                { class: 'filtered-list__date-group' },
                createNode(
                  'span',
                  { class: 'filtered-list__month' },
                  firstTask.dueMonthAbbrev
                ),
                createNode(
                  'span',
                  { class: 'filtered-list__year' },
                  firstTask.dueYearStr
                )
              ),
              createNode(
                'span',
                { class: 'filtered-list__weekday' },
                firstTask.dueDayOfWeek
              )
            )
          : createNode(
              'a',
              {
                class: 'filtered-list__link filtered-list__sub-list-name',
                href: `#${listObj.id}`
              },
              listObj.name
            );

        if (filterByDate && firstTask.isDueToday) {
          subListTitle.classList.add('filtered-list__date--today');
        } else if (filterByDate && firstTask.isDueTomorrow) {
          subListTitle.classList.add('filtered-list__date--tomorrow');
        }

        // Create filtered list item
        const liFilteredListItem = createNode(
          'li',
          { class: 'filtered-list__item' },
          filterByDate ? '' : folderName,
          subListTitle,
          ulSubList
        );
        // Populate tasks for each sub-list
        populateList(list, ulSubList);
        if (!filterByDate) {
          subListTitle.addEventListener('click', openList);
        } else {
          createBreadcrumbs(ulSubList);
        }
        itemsList.appendChild(liFilteredListItem);
        feather.replace();
      });
    } else {
      populateList(itemsArray, itemsList);
      if (itemsList === $('#today')) {
        createBreadcrumbs(itemsList);
      }
    }
  }

  function filterTasks(e) {
    e.preventDefault();
    const query = inputSearch.value.toLowerCase();
    if (query !== '') {
      const filteredArray = todoLists.reduce((acc, list) => {
        const filteredTasks = list.tasks.filter((todo) =>
          Object.keys(todo).some((key) => {
            if (typeof todo[key] === 'string') {
              return todo[key].toLowerCase().includes(query);
            }
            if (Array.isArray(todo[key])) {
              return todo[key].some((item) =>
                item.text.toLowerCase().includes(query)
              );
            }
          })
        );
        if (filteredTasks.length > 0) {
          acc.push(filteredTasks);
        }
        return acc;
      }, []);

      const ulFilteredList = $('#filteredList');
      state.activeList = null;
      state.filteredList = filteredArray;
      renderList(filteredArray, ulFilteredList);

      const taskCount = filteredArray.reduce(
        (acc, list) => acc.concat(list),
        []
      ).length;
      $('.is-active-list').classList.remove('is-active-list');
      ulFilteredList.classList.add('is-active-list');
      $(
        '#activeListTitle'
      ).innerHTML = `${taskCount} search result(s) for <strong>${
        inputSearch.value
      }</strong>`;
      formAddTodo.classList.add('is-hidden');
      inputSearch.blur();
    }
  }

  function filterTasksByDueDate(dateObj) {
    const dateStr = dateObj.valueOf();
    return selectors.getTasksByDueDate[dateStr] || [];
  }

  function displayTaskSchedule(timeFrame, listElem) {
    let filteredArray = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (timeFrame === 'today') {
      filteredArray = filterTasksByDueDate(today);
      $(
        '#activeListTitle'
      ).innerHTML = `<span class="filtered-list__weekday--lg">Today,</span><span class="filtered-list__day-num">${today.getDate()}</span><span class="filtered-list__date-group"><span class="filtered-list__month">${
        monthsArr[today.getMonth()].abbrev
      }</span><span class="filtered-list__year">${today.getFullYear()}</span></span><span class="filtered-list__weekday">${
        weekdaysArr[today.getDay()].full
      }</span>`;
    } else if (timeFrame === 'upcoming') {
      const currentMonthIndex = today.getMonth();
      const currentYear = today.getFullYear();
      const nextYear = currentYear + 1;
      const currentMonth = monthsArr[currentMonthIndex];
      const nextMonthIndex =
        currentMonth.name !== 'December' ? currentMonthIndex + 1 : 0;

      if (currentMonth.name === 'February') {
        currentMonth.daysTotal = isLeapYear(currentYear) ? 29 : 28;
      }
      const daysInMonth = currentMonth.daysTotal;

      let currentDay = today.getDate();
      for (let i = 0; i < 7; i++) {
        let day =
          currentDay < daysInMonth
            ? new Date(currentYear, currentMonthIndex, currentDay)
            : nextMonthIndex !== 0
              ? new Date(currentYear, nextMonthIndex, currentDay - daysInMonth)
              : new Date(nextYear, nextMonthIndex, currentDay - daysInMonth);
        currentDay++;
        let tasksDue = filterTasksByDueDate(day);
        if (tasksDue.length > 0) {
          filteredArray.push(tasksDue);
        }
      }
      $('#activeListTitle').textContent = 'Upcoming';
    }

    if (todoAppContainer.classList.contains('show-task-details')) {
      todoAppContainer.classList.remove('show-task-details');
    }
    state.activeList = null;
    state.filteredList = filteredArray;
    renderList(filteredArray, listElem);

    $('.is-active-list').classList.remove('is-active-list');
    listElem.classList.add('is-active-list');
    formAddTodo.classList.add('is-hidden');

    // Closes sidebar if viewport is < 768px
    if (document.documentElement.clientWidth < 768) {
      $('#siteWrapper').classList.remove('show-nav');
    }
  }

  function setPriority(e) {
    if (!e.target.classList.contains('lemon')) return;
    const id = e.target.dataset.id;
    if (state.filteredList !== null) {
      state.activeList = getListByTaskId(id);
    }
    const currentTasksList =
      state.filteredList === null ? state.activeList.tasks : state.filteredList;
    const ulActiveList = $('.is-active-list');
    const currentTask = state.activeList.getTask(id);
    const todoItem = currentTask.elem;
    const taskIndex = state.activeList.findTaskIndex(id);
    currentTask.isPriority = !currentTask.isPriority;
    $(`#${id}`).classList.toggle('is-priority');

    if (e.currentTarget.id === 'taskDetailsLemon') {
      taskDetails.classList.toggle('is-priority');
    }

    const reverseIndex = state.activeList.tasks
      .slice()
      .reverse()
      .findIndex((task) => task.isPriority && !task.isDone);
    const lastIndex = state.activeList.tasks.length - 1;
    const indexLastPriority =
      reverseIndex >= 0 ? lastIndex - reverseIndex : reverseIndex;

    // Move priority items to top of list
    if (currentTask.isPriority === true && !currentTask.isDone && taskIndex > 0) {
      state.activeList.tasks.unshift(
        state.activeList.tasks.splice(taskIndex, 1)[0]
      );
      $all('.todo-list__item', ulActiveList).forEach((item, i) => {
        if (i < taskIndex) {
          item.style.transform = `translateY(58px)`;
        } else if (i === taskIndex) {
          item.style.transform = `translateY(-${item.offsetTop}px)`;
        }
      });

      setTimeout(() => {
        renderList(currentTasksList, ulActiveList);
        if (todoAppContainer.classList.contains('show-task-details')) {
          const activeTask = $(`#${hiddenTaskId.value}`);
          activeTask.classList.add('is-selected');
        }
      }, 300);
    }

    if (
      !currentTask.isPriority &&
      !currentTask.isDone &&
      taskIndex < indexLastPriority
    ) {
      state.activeList.tasks.splice(
        indexLastPriority,
        0,
        state.activeList.tasks.splice(taskIndex, 1)[0]
      );
      const itemsBetween = indexLastPriority - taskIndex;
      todoItem.style.transform = `translateY(${itemsBetween * 58}px)`;
      for (
        let i = indexLastPriority;
        i > indexLastPriority - itemsBetween;
        i--
      ) {
        $all('.todo-list__item', ulActiveList)[
          i
        ].style.transform = `translateY(-58px)`;
      }

      setTimeout(() => {
        renderList(currentTasksList, ulActiveList);
        if (todoAppContainer.classList.contains('show-task-details')) {
          const activeTask = $(`#${hiddenTaskId.value}`);
          activeTask.classList.add('is-selected');
        }
      }, 300);
    }

    // saveToStorage();
  }

  function setTagColor(e) {
    const el = e.target;
    if (!el.classList.contains('color-picker__swatch')) return;
    const currentColor = $(`#${el.getAttribute('for')}`);
    currentColor.checked = true;
    const tag = colorPicker.parentNode;
    tag.className = `tag ${currentColor.value}`;
    const id = colorPicker.dataset.id;
    const todoItem = state.activeList.tasks.find((task) => task.id === id);
    const tagIndex = tag.dataset.tagIndex;
    todoItem.tags[tagIndex].color = currentColor.value;
    const tagLabel = $all('.tag-label', $(`#${id}`))[tagIndex];
    tagLabel.className = `tag tag-label ${currentColor.value}`;
    // saveToStorage();
  }

  renderNavItems();

  function updateTaskCount(listId) {
    const navLink = $(`.sidebar__link[href="#${listId}"]`);
    switch (listId) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskCountDueToday = filterTasksByDueDate(today).length;
        $('.sidebar__task-count', navLink).textContent =
          taskCountDueToday > 0 ? '' + filterTasksByDueDate(today).length : '';
        if (taskCountDueToday > 0) {
          navLink.classList.add('has-active-tasks');
        } else {
          navLink.classList.remove('has-active-tasks');
        }
        break;
      case 'upcoming':
        return;
        break;
      case 'filteredList':
        return;
        break;
      default:
        const listObj = store.state.listsById[listId];
        $('.sidebar__task-count', navLink).textContent =
          listObj.activeTaskCount > 0 ? '' + listObj.activeTaskCount : '';
        if (listObj.activeTaskCount > 0) {
          navLink.classList.add('has-active-tasks');
        } else {
          navLink.classList.remove('has-active-tasks');
        }
        break;
    }
  }

  

  function renderFolderOption(text) {
    const folderRadio = createNode('input', {
      type: 'radio',
      id: `folder--${camelCased(text)}`,
      name: 'folder',
      value: text
    });
    const folderLabel = createNode(
      'label',
      {
        class: 'form__label--folder',
        for: `folder--${camelCased(text)}`
      },
      text
    );
    const customFolders = $('#fieldsetFolders .custom-folders');
    customFolders.appendChild(folderRadio);
    customFolders.appendChild(folderLabel);
  }

  function addList(e) {
    e.preventDefault();
    const newListName = $('#newListNameInput').value;
    if (newListName === '') {
      $('#errorNoListName').classList.add('show-msg');
    } else {
      const checkedRadio = $('input[name="folder"]:checked').value;
      const newFolder = $('#newFolderInput').value;
      const selectedFolder =
        checkedRadio !== 'new' && checkedRadio !== 'null'
          ? checkedRadio
          : newFolder !== ''
            ? newFolder
            : null;

      const newList = new List(newListName, selectedFolder);
      store.dispatch("addList", {list: newList});
      createList(newList);
      // Creates new folder accordion element
      if (newFolder) {
        const ulFolderPanel = createNode('ul', {
          class: 'accordion__panel',
          'data-folder': selectedFolder
        });
        const iFolderIcon = createNode('i', {
          'data-feather': 'folder'
        });
        const iChevronIcon = createNode('i', {
          class: 'chevron-icon',
          'data-feather': 'chevron-left'
        });
        const folder_li = createNode(
          'li',
          {
            class: 'sidebar__item accordion__item'
          },
          iFolderIcon,
          selectedFolder,
          iChevronIcon,
          ulFolderPanel
        );
        $('#sidebarMenu').insertBefore(folder_li, $('[data-folder="null"]'));

        renderFolderOption(selectedFolder);
        feather.replace();
      }
      createNavItem(newList);
      // saveToStorage();
      const navLinksAll = $all('.sidebar__link');
      navLinksAll.forEach((link) => {
        if (link.getAttribute('href') === `#${newList.id}`) {
          link.classList.add('is-active');
        } else {
          link.classList.remove('is-active');
        }
      });
      e.currentTarget.reset();
      $('#newListFormContainer').classList.remove('is-active');
      if ($('#transferTasksFormContainer').classList.contains('is-active')) {
        $(`input[name="list"][value=${newList.id}]`).checked = true;
      } else {
        displayList(newList);
      }
    }
  }

  function prepEditListForm(e) {
    // Attach folder options
    const btnUpdateList = $('#btnUpdateList');
    formEditList.insertBefore(fieldsetFolders, btnUpdateList);
    // Insert list name
    $('#editListNameInput').value = state.activeList.name;
    // Check radio for list folder
    $(
      `input[name="folder"][value="${state.activeList.folder}"]`
    ).checked = true;
    $('#editListFormContainer').classList.add('is-active');
  }

  populateCalendarYears();

  // Sets default month to current month

  
  function setDueDate(e) {
    const id = hiddenTaskId.value;
    const currentTask = state.activeList.getTask(id);
    const todoItem = currentTask.elem;
    const dueDate = $('#inputDueDate').value; // `mm/dd/yy`
    const dueYear = +`20${dueDate.slice(6)}`;
    const dueMonthIndex = +dueDate.slice(0, 2) - 1;
    const dueDay = +dueDate.slice(3, 5);
    const dueMonthAbbrev = monthsArr[dueMonthIndex].abbrev;
    const currentDueDate = new Date(currentTask.dueDate);
    const newDueDate = new Date(dueYear, dueMonthIndex, dueDay);

    if (currentDueDate.valueOf() !== newDueDate.valueOf()) {
      currentTask.dueDate = newDueDate;
      // saveToStorage();
      const dueDateLabel = $('.badge--due-date', todoItem)
        ? $('.badge--due-date', todoItem)
        : createNode('span');

      if (currentTask.isDueToday) {
        dueDateLabel.textContent = 'Today';
        dueDateLabel.className = 'badge--due-date badge--today';
        updateTaskCount('today');
      } else if (currentTask.isDueTomorrow) {
        dueDateLabel.textContent = 'Tomorrow';
        dueDateLabel.className = 'badge--due-date badge--tomorrow';
      } else {
        dueDateLabel.className = 'badge--due-date';
        dueDateLabel.textContent = currentTask.dueDateText;
      }

      if (!$('.badge--due-date', todoItem)) {
        todoItem.appendChild(dueDateLabel);
      }
      todoItem.classList.add('show-info');
    }

    $('#dueDateWrapper').classList.add('has-due-date');
    $('#dueDateWrapper .due-date-text').textContent = currentTask.dueDateText;
    $('#dueDateWrapper').classList.remove('show-input');
    $('#dueDateWrapper').parentNode.classList.remove('is-focused');
    $('#dpCalendar').classList.remove('is-active');
  }

  function closeModal(e) {
    if (!e.target.classList.contains('modal__btn--close')) return;
    e.currentTarget.classList.remove('is-active');
    const errors = $all('.error', e.currentTarget);
    errors.forEach((error) => {
      if (error.classList.contains('show-msg')) {
        error.classList.remove('show-msg');
      }
    });
    const form = $('form', e.currentTarget);
    if (e.currentTarget.contains(form)) {
      form.reset();
    }
  }

  function closeTooltip(e) {
    if (!e.target.classList.contains('tooltip__btn--close')) return;
    e.currentTarget.classList.remove('show-tooltip');
    if (e.currentTarget.classList.contains('onboarding__tooltip')) {
      $('#onboarding').classList.add('is-active');
    }
  }

  function hideError(e) {
    if (!e.target.classList.contains('error__btn--hide')) return;
    e.currentTarget.classList.remove('show-msg');
  }

  function initDpCalendar(e) {
    if (e.currentTarget.classList.contains('show-input')) return;

    const id = $('#dpCalendar').parentNode.dataset.id;
    const currentTask = state.activeList.tasks.find((task) => task.id === id);

    if (currentTask.dueDate !== null) {
      const dueDate = new Date(currentTask.dueDate);
      // month index starts at 0
      const dueMonthIndex = dueDate.getMonth();
      const dueMonth = monthsArr[dueMonthIndex].name;
      const dueDay = dueDate.getDate();
      const dueYear = `${dueDate.getFullYear()}`;

      updateDateInput('all', dueMonth, dueDay, dueYear);

      $(`input[name="year"][value="${dueYear}"]`).checked = true;
      $('#btnToggleYearDropdown .btn-text').textContent = dueYear;
      $(`input[name="month"][value="${dueMonth}"]`).checked = true;
      $('#btnToggleMonthDropdown .btn-text').textContent = dueMonth;
      populateCalendarDays(dueMonth);
      $(
        `.dp-calendar__btn--select-day[value="${dueDay}"][data-month="${dueMonth}"]`
      ).classList.add('is-selected');
    } else {
      const now = new Date();
      const currentMonthNum = now.getMonth();
      const currentMonth = monthsArr[currentMonthNum];
      const currentYear = `${now.getFullYear()}`;
      const currentDay = now.getDate();
      updateDateInput('all', currentMonth.name, currentDay, currentYear);

      // Set default month to current month
      $(
        `#dpCalendarMonthDropdown input[value="${currentMonth.name}"]`
      ).checked = true;
      $('#btnToggleMonthDropdown .btn-text').textContent = currentMonth.name;

      // Sets default year to current year
      $(`#dpCalendarYearDropdown input[value="${currentYear}"]`).checked = true;
      $('#btnToggleYearDropdown .btn-text').textContent = currentYear;
      populateCalendarDays(currentMonth.name);
      $(
        `.dp-calendar__btn--select-day[value="${currentDay}"][data-month="${
          currentMonth.name
        }"]`
      ).classList.add('is-selected');
    }
  }

  function transferTasks(e) {
    e.preventDefault();
    const ulActiveList = $('.is-active-list');
    const currentTasksList =
      state.filteredList === null ? state.activeList.tasks : state.filteredList;
    const checkedItems = $all('.bulk-actions__checkbox:checked', ulActiveList);
    const newListId = $('input[name="list"]:checked').value;
    const newListObj = todoLists.find((list) => list.id === newListId);

    // Remove tasks from current list and add to new list
    checkedItems.forEach((item) => {
      const taskId = item.dataset.id;
      const listObj = getListByTaskId(taskId);
      const taskIndex = listObj.tasks.findIndex((task) => task.id === taskId);
      const task = listObj.tasks.splice(taskIndex, 1)[0];
      newListObj.tasks.unshift(task);
    });

    // saveToStorage();

    // Update task count
    updateTaskCount(newListObj.id);
    updateTaskCount(ulActiveList.id);
    // Reload current list to reflect changes
    renderList(currentTasksList, ulActiveList);
    $('#transferTasksFormContainer').classList.remove('is-active');
  }

  function deleteSelected(e) {
    e.preventDefault();
    const ulActiveList = $('.is-active-list');
    const currentTasksList =
      state.filteredList === null ? state.activeList.tasks : state.filteredList;
    const checkedItems = $all('.bulk-actions__checkbox:checked', ulActiveList);
    checkedItems.forEach((item) => {
      listObj = getListByTaskId(item.dataset.id);
      deleteTask(listObj, item.dataset.id);
    });
    if (ulActiveList.id === 'upcoming') {
      displayTaskSchedule('upcoming', $('#upcoming'));
    } else if (ulActiveList.id === 'today') {
      displayTaskSchedule('today', $('#today'));
    } else {
      renderList(currentTasksList, ulActiveList);
    }
  }

  // Hides certain elements if you click outside of them
  function hideComponents(e) {
    if (
      colorPicker.classList.contains('is-visible') &&
      e.target !== $('#btnAddTag') &&
      e.target !== colorPicker &&
      !colorPicker.contains(e.target)
    ) {
      colorPicker.classList.remove('is-visible');
      formEditTodo.appendChild(colorPicker);
    }

    // Hides tag labels tooltip
    if (
      divTodoApp.contains($('.tag-labels__btn--tooltip.show-tooltip')) &&
      e.target !== $('.tag-labels__btn--tooltip.show-tooltip')
    ) {
      $('.tag-labels__btn--tooltip.show-tooltip').classList.remove(
        'show-tooltip'
      );
    }

    const monthDropdown = $('#dpCalendarMonthDropdown');
    const btnToggleMonthDropdown = $('#btnToggleMonthDropdown');
    const yearDropdown = $('#dpCalendarYearDropdown');
    const btnToggleYearDropdown = $('#btnToggleYearDropdown');

    // Hides monthDropdown
    if (
      monthDropdown.classList.contains('is-active') &&
      e.target !== monthDropdown &&
      e.target !== btnToggleMonthDropdown &&
      !monthDropdown.contains(e.target)
    ) {
      monthDropdown.classList.remove('is-active');
      btnToggleMonthDropdown.classList.remove('is-active');
    }

    // Hides yearDropdown
    if (
      yearDropdown.classList.contains('is-active') &&
      e.target !== yearDropdown &&
      e.target !== btnToggleYearDropdown &&
      !yearDropdown.contains(e.target)
    ) {
      yearDropdown.classList.remove('is-active');
      btnToggleYearDropdown.classList.remove('is-active');
    }

    // Hides searchBar input
    if (
      (searchBar.classList.contains('is-expanded') &&
        ((inputSearch.value === '' &&
          e.target !== searchBar &&
          !searchBar.contains(e.target)) ||
          e.target.classList.contains('sidebar__link') ||
          e.target.classList.contains('filtered-list__link'))) ||
      e.target.classList.contains('breadcrumbs__link')
    ) {
      formSearch.reset();
      inputSearch.blur();
      searchBar.classList.remove('is-expanded');
    }

    // Hides dropdown menus
    $all('.more-actions__wrapper').forEach((item) => {
      if (
        item.classList.contains('show-actions') &&
        e.target !== item &&
        !item.contains(e.target)
      ) {
        item.classList.remove('show-actions');
      }
    });
  }

  // Event Listeners

  window.addEventListener('unload', () => {
    saveToStorage();
  });

  $('#newListNameInput').addEventListener('input', (e) => {
    if ($('#errorNoListName').classList.contains('show-msg')) {
      $('#errorNoListName').classList.remove('show-msg');
    }
  });

  $('#taskDetailsBreadcrumbs .breadcrumbs__link').addEventListener(
    'click',
    openList
  );

  $('#taskDetailsLemon').addEventListener('click', setPriority);

  $('#taskName').addEventListener('input', enableAutoHeightResize);
  $('#todoItemNote').addEventListener('input', enableAutoHeightResize);

  $('#btnCloseTaskDetails').addEventListener('click', toggleContent);

  $('#taskName').addEventListener('change', renameTodo);

  const stepper = $('.onboarding__stepper');
  $all('.stepper__btn', stepper).forEach((btn) =>
    btn.addEventListener('click', selectStep)
  );

  $('#onboarding').addEventListener('click', continueTour);

  $('#transferTasksForm').addEventListener('submit', transferTasks);

  $('#newListInput').addEventListener('click', (e) => {
    $('input[id="listNew"]').checked = true;
  });

  $('#bulkActionsToolbar').addEventListener('click', (e) => {
    const el = e.target;
    const ulActiveList = $('.is-active-list');
    const currentListObj = state.activeList;
    const currentTasksList =
      state.filteredList === null ? state.activeList.tasks : state.filteredList;
    if (el.dataset.action === 'transferSelected') {
      $('#transferTasksFormContainer').classList.add('is-active');
    } else if (el.dataset.action === 'deleteSelected') {
      deleteSelected(e);
    } else if (el.dataset.action === 'closeBulkActionsToolbar') {
      ulActiveList.removeEventListener('click', enableBulkActions);
      $('#main').removeEventListener('scroll', stickToolbar);
      ulActiveList.classList.remove('bulk-editing-list');
      renderList(currentTasksList, ulActiveList);
    }
  });

  $('#masterCheckbox').addEventListener('change', (e) => {
    const checkedState = e.currentTarget.checked;
    const ulActiveList = $('.is-active-list');
    const checkedItems = $all('.bulk-actions__checkbox', ulActiveList);
    checkedItems.forEach((x) => {
      const todoItem = x.parentNode;
      x.checked = checkedState;
      if (x.checked === true) {
        todoItem.classList.add('is-checked');
      } else {
        todoItem.classList.remove('is-checked');
      }
    });
    const bulkActions = $all('.toolbar__btn[data-bulk-action="true"]');
    if (checkedState === true && checkedItems.length > 0) {
      // Enable bulk action buttons
      bulkActions.forEach((btn) => (btn.disabled = false));
    } else {
      // Disable bulk action buttons
      bulkActions.forEach((btn) => (btn.disabled = true));
    }
  });

  $('#btnDeleteList').addEventListener('click', (e) => {
    deleteList(state.activeList);
  });
  formEditList.addEventListener('submit', updateList);

  $('#listActionsWrapper').addEventListener('click', (e) => {
    if (!e.target.classList.contains('more-actions__item')) return;

    const action = e.target.dataset.action;

    switch (action) {
      case 'editList':
        prepEditListForm(e);
        break;
      case 'initBulkEditing':
        initBulkEditing(e);
        break;
      case 'clearAll':
        $('#alertWarningClearAll').classList.add('is-active');
        break;
      case 'deleteList':
        $('#alertWarningDeleteList .list-name').textContent =
          state.activeList.name;
        $('#alertWarningDeleteList').classList.add('is-active');
        break;
    }
    e.currentTarget.classList.remove('show-actions');
  });

  $('#helpActionsWrapper').addEventListener('click', (e) => {
    if (!e.target.classList.contains('more-actions__item')) return;
    const action = e.target.dataset.action;
    switch (action) {
      case 'openTour':
        $('#siteWrapper').classList.remove('show-nav');
        $('#onboarding').classList.add('is-active');
        break;
    }
    e.currentTarget.classList.remove('show-actions');
  });

  $('#clearAllBtn').addEventListener('click', clearAll);

  $all('.more-actions__btn--toggle').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const moreActionsWrapper = e.currentTarget.parentNode;
      if (btn.classList.contains('list-actions__btn--toggle')) {
        if (todoAppContainer.classList.contains('show-task-details')) {
          todoAppContainer.classList.remove('show-task-details');
        }

        // Disables bulk editing button if toolbar is active
        if ($('#bulkActionsToolbar').classList.contains('is-active')) {
          $('#btnInitBulkEditing').disabled = true;
        } else {
          $('#btnInitBulkEditing').disabled = false;
        }

        $all('button[data-required="custom-list"]', moreActionsWrapper).forEach(
          (item) => {
            if (
              state.activeList === null ||
              state.activeList.name === 'Inbox'
            ) {
              item.disabled = true;
            } else {
              item.disabled = false;
            }
          }
        );
      }
      moreActionsWrapper.classList.toggle('show-actions');
    });
  });

  searchBar.addEventListener('click', expandSearchBar);

  $('#btnAddTag').addEventListener('click', addTag);

  document.querySelectorAll('.sidebar__btn--toggle').forEach((btn) => {
    btn.addEventListener('click', toggleMenu, true);
  });
  divViews.addEventListener('click', updateView);
  formAddTodo.addEventListener('submit', addTodo);
  $('#todoInput').addEventListener('focus', (e) => {
    e.currentTarget.parentNode.classList.add('is-focused');
  });
  ulSubtasks.addEventListener('click', toggleComplete);
  ulSubtasks.addEventListener('input', (e) => {
    if (!e.target.classList.contains('edit-todo-form__textarea--subtask'))
      return;
    autoHeightResize(e.target);
  });
  formEditTodo.addEventListener('submit', addSubtask);
  $('#btnAddSubtask').addEventListener('click', addSubtask);
  colorPicker.addEventListener('click', setTagColor);

  formEditTodo.addEventListener('keyup', (e) => {
    if (e.keyCode === ENTER_KEY) {
      if (e.target === $('#newSubtaskInput')) {
        addSubtask(e);
      }
      if (e.target === $('#newTagInput')) {
        addTag(e);
      }
    }
  });

  $('#todoItemNote').addEventListener('change', addNote);
  formEditTodo.addEventListener('change', editSubtask);

  // Delete tag on double backspace
  formEditTodo.addEventListener('keyup', (e) => {
    const newTagInput = $('#newTagInput');
    if (e.target !== newTagInput) return;
    const id = e.currentTarget.dataset.id;
    const todoIndex = state.activeList.tasks.findIndex(
      (task) => task.id === id
    );
    const currentTask = state.activeList.tasks.find((task) => task.id === id);
    if (currentTask.tags.length > 0) {
      const lastIndex = currentTask.tags.length - 1;
      const lastTag = formEditTodo.querySelectorAll('#tagsContainer .tag')[
        lastIndex
      ];
      const lastTagBtn = lastTag.querySelector('.close-icon');
      if (e.keyCode === BACKSPACE_KEY && !newTagInput.value) {
        lastTag.classList.add('is-focused');
        // Removes tag when backspace key is hit consecutively
        setTimeout(() => {
          lastTagBtn.value = 'true';
        }, 10);
        if (lastTagBtn.value === 'true') {
          if (lastTag.contains(colorPicker)) {
            formEditTodo.appendChild(colorPicker);
            colorPicker.classList.remove('is-visible');
          }
          removeTag(todoIndex, lastIndex);
          lastTag.classList.remove('is-focused');
        }
        lastTagBtn.value = 'false';
      } else if (e.keyCode !== BACKSPACE_KEY) {
        lastTag.classList.remove('is-focused');
        lastTagBtn.value = 'false';
      }
    }
  });

  formSearch.addEventListener('submit', filterTasks);

  inputSearch.addEventListener('click', (e) => e.currentTarget.select());

  document.body.addEventListener(clickTouch(), hideComponents);

  $all("[data-action='openListForm']").forEach((btn) => {
    btn.addEventListener('click', (e) => {
      if (document.documentElement.clientWidth < 768) {
        $('#siteWrapper').classList.remove('show-nav');
      }
      if (!formNewList.contains(fieldsetFolders)) {
        formNewList.insertBefore(fieldsetFolders, $('#addListBtn'));
      }
      $('#newListFormContainer').classList.add('is-active');
      window.setTimeout(() => {
        $('#newListNameInput').focus();
      }, 200);
    });
  });

  formNewList.addEventListener('submit', addList);
  inputNewFolder.addEventListener('click', (e) => {
    const newFolderRadio = $('input[id="folderNew"]');
    newFolderRadio.checked = true;
  });

  inputNewFolder.addEventListener('input', (e) => {
    if (e.currentTarget.value !== '') {
      $('#formGroupCreateFolder').classList.add('is-active');
    } else {
      $('#formGroupCreateFolder').classList.remove('is-active');
    }
  });

  // Prevents empty folder names from being created
  inputNewFolder.addEventListener('blur', (e) => {
    const noFolderRadio = $('input[id="folderNone"]');
    if (e.currentTarget.value === '') {
      noFolderRadio.checked = true;
    }
  });

  $all('.modal').forEach((modal) =>
    modal.addEventListener('click', closeModal)
  );

  $all('.tooltip').forEach((tooltip) =>
    tooltip.addEventListener('click', closeTooltip)
  );
  $all('.error').forEach((error) => error.addEventListener('click', hideError));

  $all('.dp-calendar__toggle-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.currentTarget.nextElementSibling.classList.toggle('is-active');
      e.currentTarget.classList.toggle('is-active');
    });
  });

  $all('.dp-calendar__dropdown').forEach((x) => {
    if (x.dataset.name === 'month') {
      x.addEventListener('click', selectMonth);
    } else if (x.dataset.name == 'year') {
      x.addEventListener('click', selectYear);
    }
  });

  function selectPrevNext(e) {
    const action = e.target.dataset.action;
    const selectedMonth = $('input[name="month"]:checked').value;
    const selectedYear = $('input[name="year"]:checked').value;
    const selectedMonthIndex = monthsArr.findIndex(
      (x) => x.name === selectedMonth
    );
    const prevMonth =
      selectedMonthIndex !== 0
        ? monthsArr[selectedMonthIndex - 1].name
        : 'December';
    const nextMonth =
      selectedMonthIndex !== 11
        ? monthsArr[selectedMonthIndex + 1].name
        : 'January';
    const currentDueDate = $('#inputDueDate').value; // mm/dd/yy
    const dueMonthIndex = +currentDueDate.slice(0, 2) - 1;
    const dueMonth = monthsArr[dueMonthIndex].name;
    const dueDay = +currentDueDate.slice(3, 5);
    const dueYear = `20${currentDueDate.slice(6)}`;
    console.log({ dueDay });

    if (action === 'selectNextMonth') {
      if (nextMonth === 'January') {
        const nextYear = +selectedYear + 1;
        $(`input[value="${nextYear}"]`).checked = true;
        $('#btnToggleYearDropdown .btn-text').textContent = nextYear;
      }
      $(`input[value="${nextMonth}"]`).checked = true;
      $('#btnToggleMonthDropdown .btn-text').textContent = nextMonth;
      populateCalendarDays(nextMonth);
      if (nextMonth === dueMonth && selectedYear === dueYear) {
        $(
          `.dp-calendar__btn--select-day[value="${dueDay}"][data-month="${dueMonth}"]`
        ).classList.add('is-selected');
      }
    }

    if (action === 'selectPrevMonth') {
      if (prevMonth === 'December') {
        const prevYear = +selectedYear - 1;
        $(`input[value="${prevYear}"]`).checked = true;
        $('#btnToggleYearDropdown .btn-text').textContent = prevYear;
      }
      $(`input[value="${prevMonth}"]`).checked = true;
      $('#btnToggleMonthDropdown .btn-text').textContent = prevMonth;
      populateCalendarDays(prevMonth);
      if (prevMonth === dueMonth && selectedYear === dueYear) {
        console.log({ selectedYear });
        $(
          `.dp-calendar__btn--select-day[value="${dueDay}"][data-month="${dueMonth}"]`
        ).classList.add('is-selected');
      }
    }
  }
  // Select previous or next month on click
  $all('.dp-calendar__btn-prevnext').forEach((x) =>
    x.addEventListener('click', selectPrevNext)
  );

  $('#dpCalendarDayPicker').addEventListener('click', selectDay);
  $('#btnSetDueDate').addEventListener('click', setDueDate);

  $('#dueDateWrapper').addEventListener('click', (e) => {
    initDpCalendar(e);
    e.currentTarget.parentNode.classList.add('is-focused');
    e.currentTarget.classList.add('show-input');
    $('#dpCalendar').classList.add('is-active');
  });

  $('#inputDueDate').addEventListener('change', (e) => {
    const dateRegex = /[01][0-9]\/[0-3][0-9]\/[12][0-9]/; // mm/dd/yy

    if (!dateRegex.test(e.target.value)) {
      // Returns value for month as a double digit
      if (/^[0-9]\//.test(e.target.value)) {
        const foo = e.target.value;
        e.target.value = `0${foo}`;
      }

      // Returns value for day as a double digit
      if (/^[01][0-9]\/[0-9]-/.test(e.target.value)) {
        const foo = e.target.value;
        e.target.value = `${foo.slice(0, 3)}0${foo.slice(3)}`;
      }
    }

    if (dateRegex.test(e.target.value)) {
      const dateStr = $('#inputDueDate').value; // mm/dd/yy
      console.log({ dateStr });

      const selectedDay = $('.dp-calendar__btn--select-day.is-selected');
      const year = `20${dateStr.slice(6)}`;
      console.log({ year });
      const monthNum = +dateStr.slice(0, 2) - 1;
      const month = monthsArr[monthNum];
      const monthText = month.name;
      if (monthText === 'February') {
        month.daysTotal = isLeapYear(+year) ? 29 : 28;
      }

      const lastDay = month.daysTotal;
      const day =
        +dateStr.slice(3, 5) > lastDay
          ? (updateDateInput('day', lastDay), lastDay)
          : +dateStr.slice(3, 5);

      if ($(`input[name="year"]:checked`).value !== year) {
        $(`input[value="${year}"]`).checked = true;
        $('#btnToggleYearDropdown .btn-text').textContent = year;
        populateCalendarDays(monthText);
        $(
          `.dp-calendar__btn--select-day[value="${day}"][data-month="${monthText}"]`
        ).classList.add('is-selected');
      }

      if ($(`input[name="month"]:checked`).value !== monthText) {
        $(`input[value="${monthText}"]`).checked = true;
        $('#btnToggleMonthDropdown .btn-text').textContent = monthText;
        populateCalendarDays(monthText);
      }

      if (selectedDay && selectedDay.value !== day) {
        $all('.dp-calendar__btn--select-day').forEach((x) => {
          if (
            x.value == day &&
            !x.classList.contains('dp-calendar__btn--prev-month') &&
            !x.classList.contains('dp-calendar__btn--next-month')
          ) {
            x.classList.add('is-selected');
          } else {
            x.classList.remove('is-selected');
          }
        });
      }
    }
  });

  $('#todayNavLink').addEventListener('click', (e) => {
    displayTaskSchedule('today', $('#today'));
  });

  $('#upcomingNavLink').addEventListener('click', (e) => {
    displayTaskSchedule('upcoming', $('#upcoming'));
  });

  $('#btnClearDueDate').addEventListener('click', (e) => {
    const id = hiddenTaskId.value;
    const currentTask = state.activeList.getTask(id);
    const todoItem = $(`#${id}`);
    currentTask.dueDate = null;
    saveToStorage();
    const dueDateWrapper = $('#dueDateWrapper');
    dueDateWrapper.classList.remove('has-due-date');
    $('.due-date-text', dueDateWrapper).textContent = 'Set due date';
    dueDateWrapper.classList.remove('show-input');
    dueDateWrapper.parentNode.classList.remove('is-focused');
    $('#dpCalendar').classList.remove('is-active');
    $('.badge--due-date', todoItem).remove();
  });

  $('#btnResetDueDate').addEventListener('click', (e) => {
    $('#dueDateWrapper').classList.remove('show-input');
    $('#dueDateWrapper').parentNode.classList.remove('is-focused');
    $('#dpCalendar').classList.remove('is-active');
  });

  $all('.edit-todo-form__control').forEach((x) => {
    x.addEventListener('focus', (e) => {
      const parent = e.currentTarget.parentNode;
      const grandparent = parent.parentNode;
      if (grandparent.classList.contains('edit-todo-form__form-group')) {
        grandparent.classList.add('is-focused');
      } else {
        parent.classList.add('is-focused');
      }
    });
    x.addEventListener('focusout', (e) => {
      const parent = e.currentTarget.parentNode;
      const grandparent = parent.parentNode;
      if (grandparent.classList.contains('edit-todo-form__form-group')) {
        grandparent.classList.remove('is-focused');
      } else {
        parent.classList.remove('is-focused');
      }
    });
  });

  $('#btnTriggerWarningDeleteTask').addEventListener('click', (e) => {
    const taskId = hiddenTaskId.value;
    const currentTask = state.activeList.getTask(taskId);
    $('#alertWarningDeleteTask .task-text').textContent = currentTask.text;
    $('#alertWarningDeleteTask').classList.add('is-active');
  });

  $('#btnDeleteTask').addEventListener('click', (e) => {
    const taskId = hiddenTaskId.value;
    deleteTask(state.activeList, taskId);
  });

  $('#sidebarMenu').addEventListener('click', displayPanel);
})();
