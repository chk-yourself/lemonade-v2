import List from './components/List.js';
import Task from './components/Task.js';
import Subtask from './components/Subtask.js';
import { 
  uniqueID,
  camelCased, 
  $, 
  $all,
  clickTouch,
  createNode,
  autoHeightResize
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
} from './components/DatePicker.js';
import expandSearchBar from './components/SearchBar.js';
import {
  toggleMenu,
displayPanel
} from './components/Nav.js';
import {
  stickToolbar,
  initBulkEditing,
  highlightSelected,
  enableBulkActions
} from './components/BulkActionsToolbar.js'
import { initClasses } from './store/state.js';



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
  const todoLists = localStorage.getItem('todoLists')
    ? initClasses(JSON.parse(localStorage.getItem('todoLists')))
    : [];
    const saveToStorage = () =>
  localStorage.setItem('todoLists', JSON.stringify(todoLists));

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

  if (!todoLists.find((list) => list.name === 'Inbox')) {
    $('#onboarding').classList.add('is-active');
    const initInbox = new List('Inbox', null);
    todoLists.push(initInbox);
    saveToStorage();
  }

  const inbox = todoLists.find((list) => list.name === 'Inbox');
  inbox.id = 'inbox';
  // Populates inbox tasks on load
  displayList(inbox);

  // Add toggleDone functionality to all prebuilt lists
  $all('.todo-list').forEach((list) => {
    list.addEventListener('click', toggleDone);
    list.addEventListener('click', toggleContent)
    updateTaskCount(list.id);
  });

  // Creates list node for each list object, except for the inbox list
  todoLists.forEach((list, i) => {
    if (i !== 0) {
      createList(list);
    }
  });

  // Adds new task object to current list array
  function addTodo(e) {
    e.preventDefault();
    const target = e.currentTarget;

    const ulActiveList = $('.is-active-list');

    const text = $('#todoInput').value;
    if (text !== '') {
      const todo = new Task(text);
      state.activeList.tasks.push(todo); // Add new item to bottom of the list
      saveToStorage();
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
     
      todoItem.addEventListener('click', setPriority);

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

    saveToStorage();

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
    saveToStorage();
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
    saveToStorage();
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

  /**
   * Adds subtask
   */
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
      saveToStorage();
      $('#newSubtaskInput').value = '';
    }
  }

  function enableAutoHeightResize(e) {
    autoHeightResize(e.currentTarget);
  }

  /**
   * Adds note
   */
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
      saveToStorage();

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
    saveToStorage();
  }

  function toggleContent(e) {
    if (
      !e.target.classList.contains('todo-list__item') 
      && e.target.dataset.action !== 'toggleContent'
      || e.target.contains($('.bulk-actions__checkbox-label', e.target))
      )
       return;
    let todoItem = e.target;
    const id = todoItem.id;
    const dueDateLabel = $('.badge--due-date', todoItem);
    const todoItemTitle = $('.todo-item__title', todoItem);
    const ulActiveList = $('.is-active-list');

    if (e.currentTarget.id === 'btnCloseTaskDetails') {
      todoItem = $(`#${hiddenTaskId.value}`);
    }

    if (todoAppContainer.classList.contains('show-task-details')) {
      todoItem.classList.remove('is-selected');
      todoAppContainer.classList.remove('show-task-details');
      // Reset task details pane
      const tags = $all('#tagsContainer .tag', taskDetails);
      tags.forEach((x) => x.remove());
      $('#dueDateWrapper').classList.remove('has-due-date');
      $('#dueDateWrapper').classList.remove('show-input');
      $('#dueDateWrapper').parentNode.classList.remove('is-focused');
      $('#dpCalendar').classList.remove('is-active');
      $all('.todo-list__item', ulActiveList).forEach((item) =>
        item.classList.remove('is-selected')
      );
    }

    if (
      !todoAppContainer.classList.contains('show-task-details') &&
      e.currentTarget.id !== 'btnCloseTaskDetails'
    ) {
      hiddenTaskId.value = id;
      populateTaskDetails(id);
      $all('.todo-list__item', ulActiveList).forEach((item) => {
        if (item === todoItem) {
          item.classList.add('is-selected');
        } else {
          item.classList.remove('is-selected');
        }
      });
      if (document.documentElement.clientWidth < 768) {
        $('.todo-item__title', todoItem).blur();
      }
      todoAppContainer.classList.add('show-task-details');
    }
  }

  function deleteTask(listObj, taskId) {
    const currentTask = listObj.getTask(taskId);
    const todoItem = currentTask.elem;
    const taskIndex = listObj.findTaskIndex(taskId);
    const ulActiveList = $('.is-active-list');
    listObj.tasks.splice(taskIndex, 1);
    saveToStorage();

    const currentTasksList =
      state.filteredList === null ? state.activeList.tasks : state.filteredList;
    if (todoAppContainer.classList.contains('show-task-details')) {
      todoAppContainer.classList.remove('show-task-details');
    }
    if (!todoItem.classList.contains('bulk-editing-list__item')) {
      switch (ulActiveList.id) {
        case 'upcoming':
          displayTaskSchedule('upcoming', $('#upcoming'));
          break;
        case 'today':
          displayTaskSchedule('today', $('#today'));
          break;
        default:
          renderList(currentTasksList, ulActiveList);
          break;
      }
    }
    updateTaskCount(listObj.id);
    if (currentTask.isDueToday) {
      updateTaskCount('today');
    }
    $('#alertWarningDeleteTask').classList.remove('is-active');
  }

  function filterTag(tag) {
    return tag
      .trim()
      .replace(/  +/g, ' ')
      .replace(/[^\w -]/g, '');
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

  function removeTag(todoIndex, tagIndex) {
    const currentTask = state.activeList.tasks[todoIndex];
    const id = currentTask.id;
    const todoItem = $(`#${id}`);
    $all('#tagsContainer .tag', formEditTodo)[tagIndex].remove();
    $all('.todo-item__tag-labels .tag-label', todoItem)[tagIndex].remove();
    currentTask.tags.splice(tagIndex, 1);
    saveToStorage();
    const tagsTooltipBtn = $('.tag-labels__btn--tooltip', todoItem);
    if (currentTask.tags.length > 0) {
      // Update tags tooltip
      tagsTooltipBtn.dataset.tooltip = currentTask.tagSummary;
    } else {
      tagsTooltipBtn.remove();
    }
  }

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
        saveToStorage();
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
    return todoLists.reduce(
      (acc, list) =>
        acc.concat(
          list.tasks.filter(
            (task) => new Date(task.dueDate).valueOf() === dateObj.valueOf()
          )
        ),
      []
    );
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

    saveToStorage();
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
    saveToStorage();
  }

  function createList(listObj) {
    const list_ul = createNode('ul', {
      class: 'todo-list custom-list',
      id: listObj.id,
      'data-name': listObj.name
    });
    list_ul.addEventListener('click', toggleDone);
    list_ul.addEventListener('click', toggleContent)
    $('#main').insertBefore(list_ul, formAddTodo);
    renderListOption(listObj);
  }

  const createNavItem = (listObj, parentNode = $('#sidebarMenu')) => {
    const iListIcon = createNode('i', {
      'data-feather': 'list'
    });
    const spanListName = createNode(
      'span',
      {
        class: 'sidebar__list-name'
      },
      listObj.name
    );
    const spanTaskCount = createNode(
      'span',
      {
        class: 'sidebar__task-count'
      },
      listObj.activeTaskCount > 0 ? '' + listObj.activeTaskCount : ''
    );
    const aListLink = createNode(
      'a',
      {
        class: `sidebar__link${
          listObj.activeTaskCount > 0 ? ' has-active-tasks' : ''
        }`,
        href: `#${listObj.id}`
      },
      iListIcon,
      spanListName,
      spanTaskCount
    );
    aListLink.addEventListener('click', openList);
    const liItem = createNode(
      'li',
      {
        class: `${
          listObj.folder === null ? 'sidebar__item' : 'accordion__sub-item'
        }`
      },
      aListLink
    );
    if (listObj.folder === null) {
      parentNode.appendChild(liItem);
    } else {
      $(`[data-folder="${listObj.folder}"]`, parentNode).appendChild(liItem);
    }
    // Render feather icons
    feather.replace();
  };

  function renderNavItems() {
    // Array of folder names
    const foldersArr = todoLists
      .map((list) => list.folder)
      .filter(
        (folder, i, arr) => folder !== null && arr.indexOf(folder) === i
      );
    const frag = document.createDocumentFragment();
    foldersArr.forEach((folder) => {
      const ulFolderPanel = createNode('ul', {
        class: 'accordion__panel',
        'data-folder': folder
      });
      renderFolderOption(folder);
      const iFolderIcon = createNode('i', {
        'data-feather': 'folder'
      });
      const iChevronIcon = createNode('i', {
        class: 'chevron-icon',
        'data-feather': 'chevron-left'
      });
      const liFolder = createNode(
        'li',
        {
          class: 'sidebar__item accordion__item'
        },
        iFolderIcon,
        folder,
        iChevronIcon,
        ulFolderPanel
      );

      liFolder.addEventListener('click', displayPanel);
      frag.appendChild(liFolder);

      // Creates accordion panel for each folder, with links to children underneath
      const folderItems = todoLists.filter((list) => list.folder === folder);
      folderItems.forEach((item) => createNavItem(item, frag));
    });

    // Creates regular nav items for miscellaneous lists
    const miscLists = todoLists.filter((list) => list.folder === null);
    miscLists.forEach((item) => {
      if (item.id !== 'inbox') {
        createNavItem(item, frag);
      }
    });
    $('#sidebarMenu').appendChild(frag);

    // Render feather icons
    feather.replace();

    // Displays list on click
    const navLinksAll = $all('.sidebar__link');
    navLinksAll.forEach((link) => link.addEventListener('click', openList));
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
        const listObj = todoLists.find((list) => list.id === listId);
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

  function openList(e) {
    e.preventDefault();
    const navLinksAll = $all('.sidebar__link');
    navLinksAll.forEach((link) => {
      if (link === e.target) {
        link.classList.add('is-active');
      } else {
        link.classList.remove('is-active');
      }
    });
    if (e.target.id !== 'todayNavLink' && e.target.id !== 'upcomingNavLink') {
      const id = e.target.getAttribute('href').slice(1);
      const listObj = todoLists.find((list) => list.id === id);
      displayList(listObj);
      if (document.documentElement.clientWidth < 768) {
        $('#siteWrapper').classList.remove('show-nav');
      }
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

  function renderListOption(listObj) {
    const listRadio = createNode('input', {
      type: 'radio',
      id: `list--${listObj.id}`,
      name: 'list',
      value: listObj.id
    });
    const listLabel = createNode(
      'label',
      {
        class: 'form__label--list',
        for: `list--${listObj.id}`
      },
      listObj.name
    );
    const fieldsetLists = $('#fieldsetLists');
    fieldsetLists.appendChild(listRadio);
    fieldsetLists.appendChild(listLabel);
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
        checkedRadio !== 'new'
          ? checkedRadio
          : newFolder !== ''
            ? newFolder
            : null;
      const newList = new List(newListName, selectedFolder);
      todoLists.push(newList);
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
        folder_li.addEventListener('click', displayPanel);
        $('#sidebarMenu').insertBefore(folder_li, $('[data-folder="null"]'));

        renderFolderOption(selectedFolder);
        feather.replace();
      }
      createNavItem(newList);
      saveToStorage();
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

  function updateList(e) {
    e.preventDefault();
    const newListName = $('#editListNameInput').value;
    const checkedRadio = $('input[name="folder"]:checked').value;
    const selectedFolder =
      checkedRadio === 'new' ? $('#newFolderInput').value : checkedRadio;
    const listNavLink = $(`a[href="#${state.activeList.id}"]`);
    const listNavItem = listNavLink.parentNode;
    // Rename list
    if (newListName !== '' && newListName !== state.activeList.name) {
      state.activeList.name = newListName;

      // Update list nav link
      $('.sidebar__list-name', listNavLink).textContent = newListName;
      $('#activeListTitle').textContent = newListName;
    }
    // Create new folder
    if (checkedRadio === 'new' && selectedFolder !== '') {
      console.log({ selectedFolder });
      const ulFolderPanel = createNode('ul', {
        class: 'accordion__panel',
        'data-folder': selectedFolder
      });
      const iFolderIcon = createNode('i', {
        'data-feather': 'folder'
      });
      const folder_li = createNode(
        'li',
        {
          class: 'sidebar__item accordion__item'
        },
        iFolderIcon,
        selectedFolder,
        ulFolderPanel
      );
      folder_li.addEventListener('click', displayPanel);
      $('#sidebarMenu').insertBefore(folder_li, $('[data-folder="null"]'));

      renderFolderOption(selectedFolder);
      feather.replace();
    }
    // Set different/new folder
    if (state.activeList.folder !== selectedFolder && selectedFolder !== '') {
      state.activeList.folder = selectedFolder;

      // Append list nav item to sidebar
      if (selectedFolder === null) {
        listNavItem.className = 'sidebar__item';
        listNavItem.dataset.folder = null;
        $('#sidebarMenu').appendChild(listNavItem);
      } else {
        // Append list nav item to different/new folder
        listNavItem.className = 'accordion__sub-item';
        listNavItem.removeAttribute('data-folder');
        $(`[data-folder="${selectedFolder}"]`).appendChild(listNavItem);
      }
    }
    // Save changes to storage
    saveToStorage();
    e.currentTarget.reset();
    $('#editListFormContainer').classList.remove('is-active');
  }

  function deleteList(listObj) {
    const listNavLink = $(`a[href="#${listObj.id}"]`);
    const listNavItem = listNavLink.parentNode;
    const listElement = listObj.elem;

    // Delete list object
    const listIndex = todoLists.indexOf(listObj);
    todoLists.splice(listIndex, 1);
    saveToStorage();

    // Delete list nav item
    listNavItem.remove();

    // Delete folder elements if list is the only item in folder
    const folder = listObj.folder;
    if (
      folder !== null &&
      todoLists.filter((list) => list.folder === folder).length === 0
    ) {
      // Delete nav folder item
      $(`[data-folder="${listObj.folder}"]`).parentNode.remove();
      // Delete folder radio
      const folderRadio = $(`input[name="folder"][value="${folder}"]`);
      folderRadio.remove();
      $(`.form__label--folder[for=${folderRadio.id}]`).remove();
    }

    // Delete list `ul` element
    listElement.remove();

    // Delete list option from transfer tasks form
    const listRadio = $(`input[name="list"][value=${listObj.id}]`);
    listRadio.remove();
    $(`.form__label--list[for=${listRadio.id}]`).remove();

    // Reload inbox
    const inbox = todoLists.find((list) => list.name === 'Inbox');
    displayList(inbox);

    if ($('#alertWarningDeleteList').classList.contains('is-active')) {
      $('#alertWarningDeleteList').classList.remove('is-active');
    }
  }

  function displayList(listObj) {
    const ulActiveList = $('.is-active-list');
    const list_ul = $(`#${listObj.id}`);

    // Updates state
    state.activeList = listObj;
    state.filteredList = null;

    if ($('#bulkActionsToolbar').classList.contains('is-active')) {
      $('#bulkActionsToolbar').classList.remove('is-active');
      ulActiveList.removeEventListener('click', enableBulkActions);
      $('#main').removeEventListener('scroll', stickToolbar);
      ulActiveList.classList.remove('bulk-editing-list');
    }

    if ($('#main').classList.contains('show-search-results')) {
      $('#main').classList.remove('show-search-results');
    }

    if (todoAppContainer.classList.contains('show-task-details')) {
      todoAppContainer.classList.remove('show-task-details');
    }

    $('#activeListTitle').textContent = listObj.name;
    populateList(listObj.tasks, list_ul);

    $all('.todo-list').forEach((x) => {
      if (x !== list_ul) {
        x.classList.remove('is-active-list');
      } else {
        x.classList.add('is-active-list');
      }
    });
    formAddTodo.classList.remove('is-hidden');
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
      saveToStorage();
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

    saveToStorage();

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

  function continueTour(e) {
    const el = e.target;
    if (!el.classList.contains('onboarding__btn')) return;
    const modal = e.currentTarget;
    const action = el.dataset.action;
    const ulActiveList = $('.is-active-list');

    if (action === 'beginTour') {
      $('.onboarding__footer', modal).classList.add('is-active');
      // Refresh completion status for all steps if tour is retaken
      $all('.onboarding__stepper .stepper__btn').forEach((btn) =>
        btn.classList.remove('is-completed')
      );
      state.onboarding.statusLog.forEach((status, i, arr) => (arr[i] = false));
      state.onboarding.currentStep = 0;
    }

    const currentStep = state.onboarding.currentStep;
    const nextStep = state.onboarding.nextStep;

    if (action === 'endTour') {
      state.onboarding.currentStep = null;
      // Delete dummy tasks created in Step 3
      const noDummyTasks = state.activeList.tasks.filter(
        (task) => task.text !== 'Delete Me!'
      );
      state.activeList.tasks = noDummyTasks;
      renderList(state.activeList.tasks, ulActiveList);
      $all('.onboarding__step').forEach((section) => {
        let step = +section.dataset.onboardingStep;
        if (step === 0) {
          section.classList.add('is-active');
        } else {
          section.classList.remove('is-active');
        }
      });
      $('.onboarding__footer', modal).classList.remove('is-active');
    } else {
      if (action === 'activateTooltips') {
        modal.classList.remove('is-active');
        if (currentStep === 1) {
          formAddTodo.appendChild($('#onboardingTooltip_1-1'));
        }
        $(
          `.onboarding__tooltip[data-onboarding-step="${currentStep}"][data-order="0"]`
        ).classList.add('show-tooltip');
        const target = $(`[data-onboarding-target="${currentStep}"]`);
        // Set up first interaction point for current onboarding step
        if (target.tagName === 'FORM') {
          target.addEventListener('submit', trackTourProgress);
        } else {
          target.addEventListener('click', trackTourProgress);
        }
      } else {
        console.log({ nextStep });
        // Show next section
        $all('.onboarding__step').forEach((section) => {
          let step = +section.dataset.onboardingStep;
          if (step === nextStep) {
            section.classList.add('is-active');
          } else {
            section.classList.remove('is-active');
          }
        });

        // Set stepper btn to active

        $all('.onboarding__stepper .stepper__btn').forEach((btn, i) => {
          if (i === nextStep - 1) {
            btn.classList.add('is-active');
          } else {
            btn.classList.remove('is-active');
          }
        });
        // Updates state, looping the tour back to the beginning, if it reaches the end (step 4)
        state.onboarding.currentStep = state.onboarding.nextStep;
      }
    }
  }

  function trackTourProgress(e) {
    console.log(state.onboarding.nextStep);
    const target = e.currentTarget;
    const tooltip = $('.onboarding__tooltip.show-tooltip');
    const currentStep = state.onboarding.currentStep;
    const ulActiveList = $('.is-active-list');
    const tooltipSet = Array.prototype.slice
      .call($all(`.onboarding__tooltip[data-onboarding-step="${currentStep}"]`))
      .sort((a, b) => {
        return +a.dataset.order - +b.dataset.order;
      });

    target.removeEventListener(e.type, trackTourProgress);

    if (currentStep === null) return;

    // Set up interaction points
    /**
     * Step 1
     */
    // Part 1
    if (target === formAddTodo) {
      // Attach tooltip for Step 2 to first todo item
      const firstTask = $('.is-active-list .todo-list__item');
      firstTask.appendChild($('#onboardingTooltip_1-2'));
      firstTask.addEventListener('click', trackTourProgress);
    }
    // Part 2
    if (target.classList.contains('todo-list__item')) {
      $('.task-details__header').appendChild($('#onboardingTooltip_1-3'));
      $('#btnCloseTaskDetails').addEventListener('click', trackTourProgress);
    }

    /**
     *  Step 2
     */
    // Part 1
    if (target.classList.contains('sidebar__btn--toggle-open')) {
      $('.sidebar__buttons').insertBefore(
        $('#onboardingTooltip_2-2'),
        $('#helpActionsWrapper')
      );
      $('#openListFormBtn').addEventListener('click', trackTourProgress);
    }

    // Part 2

    if (target === $('#openListFormBtn')) {
      $('#fieldsetNewListInput').appendChild($('#onboardingTooltip_2-3'));
      $('#newListNameInput').addEventListener('input', trackTourProgress);
    }

    // Part 3
    if (target === $('#newListNameInput')) {
      $('#fieldsetFolders').appendChild($('#onboardingTooltip_2-4'));
      $('#newListForm').addEventListener('submit', trackTourProgress);
    }

    // Part 4

    if (target === $('#newListForm')) {
      $('#listActionsWrapper').appendChild($('#onboardingTooltip_3-1'));
    }

    /**
     *  Step 3
     */
    // Part 1
    if (target.classList.contains('list-actions__btn--toggle')) {
      $('#bulkActionsToolbar').appendChild($('#onboardingTooltip_3-2'));
      $('#onboardingTooltip_3-2').classList.add('show-tooltip');
      $('#btnInitBulkEditing').addEventListener('click', trackTourProgress);
    }
    // Part 2

    if (target === $('#btnInitBulkEditing')) {
      // Create dummy tasks for user to delete
      for (let i = 0; i < 3; i++) {
        let dummyTask = new Task('Delete Me!');
        state.activeList.tasks.push(dummyTask);
      }
      populateList(state.activeList.tasks, ulActiveList);
      $('#masterCheckbox').addEventListener('change', trackTourProgress);
      return;
    }

    if (target === $('#masterCheckbox')) {
      $('#bulkActionsToolbar').appendChild($('#onboardingTooltip_3-3'));
      $('#btnDeleteSelected').addEventListener('click', trackTourProgress);
    }

    // Close active tooltip
    tooltip.classList.remove('show-tooltip');
    // Ensure tooltip doesn't get deleted
    divTodoApp.appendChild(tooltip);

    // If current tooltip is not the last one in the set, activate the next one
    if (tooltip !== tooltipSet[tooltipSet.length - 1]) {
      tooltipSet.forEach((item, i, arr) => {
        if (item === tooltip) {
          arr[i + 1].classList.add('show-tooltip');
        }
      });
      return;
    }

    const nextStep = state.onboarding.nextStep;

    // Mark step as completed
    $all('.onboarding__stepper .stepper__btn').forEach((btn, i) => {
      if (i === currentStep - 1) {
        btn.classList.remove('is-active');
        btn.classList.add('is-completed');
      } else if (i === nextStep - 1) {
        btn.classList.add('is-active');
      }
    });

    // Update step status
    state.onboarding.updateStatus = true;
    if (state.onboarding.isCompleted) {
      $('.onboarding__footer').classList.remove('is-active');
    }

    // Proceed to next step of tour
    $all('.onboarding__step').forEach((section, i) => {
      if (i === state.onboarding.nextStep) {
        section.classList.add('is-active');
      } else {
        section.classList.remove('is-active');
      }
    });

    // Reopen modal
    $('#onboarding').classList.add('is-active');

    // Update state
    state.onboarding.currentStep = state.onboarding.nextStep;
  }

  function selectStep(e) {
    $all('.onboarding__stepper .stepper__btn').forEach((btn, i) => {
      if (e.target === btn) {
        state.onboarding.currentStep = i + 1;

        $all('.onboarding__step').forEach((section) => {
          let step = +section.dataset.onboardingStep;
          if (step === state.onboarding.currentStep) {
            section.classList.add('is-active');
          } else {
            section.classList.remove('is-active');
          }
        });
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });
  }

  // Event Listeners

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
})();
