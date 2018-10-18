'use strict';

var _List = require('./List.js');

var _List2 = _interopRequireDefault(_List);

var _Task = require('./Task.js');

var _Task2 = _interopRequireDefault(_Task);

var _Subtask = require('./Subtask.js');

var _Subtask2 = _interopRequireDefault(_Subtask);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(function app() {
  // for feather icons

  /*
  Helper Functions
  */

  /**
   * Selects single DOM element by id or class name(s)
   * @param {string} selector - selector(s) using valid CSS syntax to match against element
   * @param {Node} [context =document] - optional baseElement, of which the element is a descendant
   * @param {boolean} [all =false] - false to match single element; true to match all elements
   * @returns {Node} The first element found that matches the selector(s)
   */
  function $(selector) {
    var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

    // Checks if selector matches single CSS id selector syntax and context is set to document
    return (/^#[\w-]+$/.test(selector) && context === document ? context.getElementById(selector.slice(1)) : context.querySelector(selector)
    );
  }

  function $all(selector) {
    var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

    return context.querySelectorAll(selector);
  }

  // Variables
  var divTodoApp = $('#todoApp');
  var formAddTodo = $('#addTodoForm');
  var formEditTodo = $('#editTodoForm');
  var formSearch = $('#searchForm');
  var searchBar = $('#searchBar');
  var inputSearch = $('#searchInput');
  var ulSubtasks = $('#subtaskList');
  var divViews = $('#views');
  var colorPicker = $('#colorPicker');
  var formNewList = $('#newListForm');
  var fieldsetFolders = $('#fieldsetFolders');
  var formEditList = $('#editListForm');
  var inputNewFolder = $('#newFolderInput');
  var todoAppContainer = $('#todoAppContainer');
  var taskDetails = $('#taskDetails');
  var hiddenTaskId = $('#taskId');
  var todoLists = localStorage.getItem('todoLists') ? initClasses(JSON.parse(localStorage.getItem('todoLists'))) : [];

  // Converts JSON list and task objects back to instances of original classes
  function initClasses(arr) {
    return arr.map(function (item) {
      var list = new _List2.default(null, null, item);
      list.tasks = item.tasks.map(function (task) {
        return new _Task2.default(null, task);
      });
      return list;
    });
  }

  var saveToStorage = function saveToStorage() {
    return localStorage.setItem('todoLists', JSON.stringify(todoLists));
  };

  var BACKSPACE_KEY = 8;
  var ENTER_KEY = 13;
  var state = {
    activeList: null,
    filteredList: null,
    nextOnboardingStep: null,
    onboarding: {
      currentStep: null,
      statusLog: [false, false, false],
      get isCompleted() {
        return this.statusLog.every(function (status) {
          return status === true;
        });
      },
      get nextStep() {
        return this.isCompleted ? 4 : this.currentStep === 3 ? this.statusLog.indexOf(false) + 1 : this.statusLog.indexOf(false, this.currentStep) + 1;
      },
      set updateStatus(val) {
        this.statusLog[this.currentStep - 1] = val;
      }
    }
  };

  var clickTouch = function clickTouch() {
    return 'ontouchstart' in document === true ? 'touchstart' : 'click';
  };

  var now = new Date();
  var currentDate = now.getDate();
  var currentYear = now.getFullYear();

  var isLeapYear = function isLeapYear(year) {
    return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
  };

  var monthsArr = [{
    name: 'January',
    daysTotal: 31,
    abbrev: 'Jan'
  }, {
    name: 'February',
    daysTotal: isLeapYear(currentYear) ? 29 : 28,
    abbrev: 'Feb'
  }, {
    name: 'March',
    daysTotal: 31,
    abbrev: 'Mar'
  }, {
    name: 'April',
    daysTotal: 30,
    abbrev: 'Apr'
  }, {
    name: 'May',
    daysTotal: 31,
    abbrev: 'May'
  }, {
    name: 'June',
    daysTotal: 30,
    abbrev: 'Jun'
  }, {
    name: 'July',
    daysTotal: 31,
    abbrev: 'Jul'
  }, {
    name: 'August',
    daysTotal: 31,
    abbrev: 'Aug'
  }, {
    name: 'September',
    daysTotal: 30,
    abbrev: 'Sep'
  }, {
    name: 'October',
    daysTotal: 31,
    abbrev: 'Oct'
  }, {
    name: 'November',
    daysTotal: 30,
    abbrev: 'Nov'
  }, {
    name: 'December',
    daysTotal: 31,
    abbrev: 'Dec'
  }];

  var weekdaysArr = [{ full: 'Sunday', short: 'Sun' }, { full: 'Monday', short: 'Mon' }, { full: 'Tuesday', short: 'Tue' }, { full: 'Wednesday', short: 'Wed' }, { full: 'Thursday', short: 'Thu' }, { full: 'Friday', short: 'Fri' }, { full: 'Saturday', short: 'Sat' }];

  // Generates unique ID string, used for identifying todo items.
  var uniqueID = function uniqueID() {
    return +Date.now() + Math.random().toString(36).slice(2);
  };

  var camelCased = function camelCased(text) {
    return text.trim().replace(/[^A-Za-z0-9 ]/g, '').split(' ').map(function (str, i) {
      return i === 0 ? str.toLowerCase() : str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }).join('');
  };

  /**
   * Creates HTML element with specified tagName, attributes and child nodes.
   * @param {string} tagName - The type of HTML element to create
   * @param {Object} attributes - HTML attributes, written as key/value pairs, including:
   *   - CSS classes (separate multiple classes with a single space)
   *   - data-* attributes (remember to enclose data- attribute name in quotes)
   * @param {string|Node} ...children - Child nodes to append; a string represents a Text node
   * @returns {Node} The new HTML element
   * @example
   * // `recipe` represents the following:
   * `<ul class="recipe" id="recipe-01">
   *    <li class="li ingredient" data-unit="tsp">1 tsp salt</li>
   * </ul>`
   * let ingredient = createNode('li', {class: 'li ingredient', 'data-unit': 'tsp'}, '1 tsp salt');
   * let recipe = createNode('ul', {class: 'recipe', id: 'recipe-01'}, ingredient);
   */
  var createNode = function createNode(tagName, attributes) {
    for (var _len = arguments.length, children = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      children[_key - 2] = arguments[_key];
    }

    var node = document.createElement(tagName);

    if (attributes) {
      Object.keys(attributes).forEach(function (key) {
        if (key === 'class') {
          var classes = attributes[key].split(' ');
          classes.forEach(function (x) {
            return node.classList.add(x);
          });
        } else if (/^data-/.test(key)) {
          var dataProp = key.slice(5) // removes `data-`
          .split('-').map(function (str, i) {
            return i === 0 ? str : str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
          }).join('');
          node.dataset[dataProp] = attributes[key];
        } else {
          node.setAttribute(key, attributes[key]);
        }
      });
    }

    children.forEach(function (child) {
      if (typeof child === 'undefined' || child === null) {
        return;
      }
      if (typeof child === 'string') {
        node.appendChild(document.createTextNode(child));
      } else {
        node.appendChild(child);
      }
    });

    return node;
  };

  if (!todoLists.find(function (list) {
    return list.name === 'Inbox';
  })) {
    $('#onboarding').classList.add('is-active');
    var initInbox = new _List2.default('Inbox', 'null');
    todoLists.push(initInbox);
    saveToStorage();
  }

  var inbox = todoLists.find(function (list) {
    return list.name === 'Inbox';
  });
  inbox.id = 'inbox';
  // Populates inbox tasks on load
  displayList(inbox);

  // Add toggleDone functionality to all prebuilt lists
  $all('.todo-list').forEach(function (list) {
    list.addEventListener('click', toggleDone);
    updateTaskCount(list.id);
  });

  // Creates list node for each list object, except for the inbox list
  todoLists.forEach(function (list, i) {
    if (i !== 0) {
      createList(list);
    }
  });

  // Adds new task object to current list array
  function addTodo(e) {
    e.preventDefault();
    var target = e.currentTarget;

    var ulActiveList = $('.is-active-list');

    var text = $('#todoInput').value;
    if (text !== '') {
      var todo = new _Task2.default(text);
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
  function populateList() {
    var itemsArray = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var itemsList = arguments[1];

    itemsList.innerHTML = itemsArray.map(function (item, i) {
      return '<li class= "todo-list__item' + (item.done ? ' is-done' : '') + (item.isPriority ? ' is-priority' : '') + (item.dueDate || state.filteredList !== null && $('#searchInput').value === '' ? ' show-info' : '') + '" data-index="' + i + '" id="' + item.id + '">\n<input type="checkbox" id="item-' + i + '" data-index="' + i + '" value="' + item.text + '" ' + (item.done ? 'checked' : '') + ' />\n<label for ="item-' + i + '" class="todo-list__checkbox"></label>\n<textarea class="form__textarea todo-item__title" data-index="' + i + '" data-id="' + item.id + '">' + item.text + '</textarea>\n<div class="todo-item__tag-labels"></div><span class="lemon" data-id="' + item.id + '"></span>' + (item.dueDate !== null ? '<span class="badge--due-date' + (item.isDueToday ? ' badge--today' : item.isDueTomorrow ? ' badge--tomorrow' : '') + '">' + (item.isDueToday ? 'Today' : item.isDueTomorrow ? 'Tomorrow' : item.dueDateText) + '</span>' : '') + '\n</li>';
    }).join('');

    var itemsCollection = $all('.todo-list__item', itemsList);

    // Adds event listeners to each list item
    for (var i = 0; i < itemsCollection.length; i++) {
      var todoItem = itemsCollection[i];
      todoItem.addEventListener('click', toggleContent, true);

      if (state.filteredList !== null) {
        todoItem.addEventListener('click', function (e) {
          var id = e.currentTarget.id;
          state.activeList = getListByTaskId(id);
        }, true);
      }

      var lemon = $('.lemon', todoItem);
      lemon.addEventListener('click', setPriority);
      var itemTitle = $('.todo-item__title', todoItem);
      itemTitle.addEventListener('click', function (e) {
        var id = e.currentTarget.dataset.id;
        state.activeList = getListByTaskId(id);
      });
      itemTitle.addEventListener('change', renameTodo);

      // Creates tag labels and badges for each todo item, if any
      var id = todoItem.id;

      for (var j = 0; j < itemsArray.length; j++) {
        if (itemsArray[j].id === id) {
          var taskObj = itemsArray[j];

          // Renders tag labels
          if (taskObj.tags.length > 0) {
            (function () {
              var tagLabels = $('.todo-item__tag-labels', todoItem);
              var tagsTooltipBtn = createNode('button', {
                class: 'btn btn--tooltip tag-labels__btn--tooltip',
                'data-tooltip': '',
                type: 'button'
              }, '...');
              tagsTooltipBtn.dataset.tooltip = itemsArray[j].tagSummary;
              tagsTooltipBtn.addEventListener('click', function (e) {
                e.currentTarget.classList.toggle('show-tooltip');
              });
              tagLabels.appendChild(tagsTooltipBtn);

              // Renders tag labels
              taskObj.tags.forEach(function (tag, i) {
                var tagLabel = createNode('span', {
                  class: 'tag tag-label ' + tag.color
                }, tag.text);
                tagLabels.insertBefore(tagLabel, tagsTooltipBtn);
              });
            })();
          }
        }
      }
    }
  }

  function getListByTaskId(todoId) {
    return todoLists.find(function (list) {
      return list.tasks.find(function (task) {
        return task.id === todoId;
      });
    });
  }

  // Updates todo object's `done` property to reflect current `checked` state
  function toggleDone(e) {
    var el = e.target;
    if (!el.classList.contains('todo-list__checkbox') || el.classList.contains('bulk-actions__checkbox')) return;

    var id = el.parentNode.id;

    state.activeList = getListByTaskId(id);

    var ulActiveList = $('.is-active-list');
    var listHeight = parseInt(window.getComputedStyle(ulActiveList).height);
    var index = state.activeList.findTaskIndex(id);
    var currentTask = state.activeList.getTask(id);
    var indexFirstCompleted = state.activeList.tasks.findIndex(function (item) {
      return item.done === true;
    }); // Index of most recently completed task

    currentTask.done = !currentTask.done;

    if (currentTask.done && state.activeList.tasks.length !== 1) {
      // Moves completed task to bottom of todo list
      state.activeList.tasks.push(state.activeList.tasks.splice(index, 1)[0]);

      $all('.todo-list__item', ulActiveList).forEach(function (item, i) {
        if (i === index) {
          item.style.transform = 'translateY(' + (listHeight - item.offsetTop - 58) + 'px)';
        } else if (i > index) {
          item.style.transform = 'translateY(-58px)';
        }
      });
    }
    if (!currentTask.done && index > 0 && indexFirstCompleted !== -1) {
      $all('.todo-list__item', ulActiveList).forEach(function (item, i) {
        if (i === index) {
          var firstCompletedItem = state.activeList.tasks[indexFirstCompleted].elem;
          item.style.transform = 'translateY(' + (firstCompletedItem.offsetTop - item.offsetTop) + 'px)';
        } else if (i === indexFirstCompleted || i < index && i > indexFirstCompleted) {
          item.style.transform = 'translateY(58px)';
        }
      });
      state.activeList.tasks.splice(indexFirstCompleted, 0, state.activeList.tasks.splice(index, 1)[0]);
    }

    saveToStorage();

    // Update active task count in sidebar
    updateTaskCount(state.activeList.id);

    var currentTasksList = state.filteredList === null ? state.activeList.tasks : state.filteredList;
    var activeFilter = function activeFilter(task) {
      return !task.done;
    };
    var completedFilter = function completedFilter(task) {
      return task.done;
    };
    var filteredArray = function filteredArray(arr, callback) {
      return arr.reduce(function (acc, list) {
        var filteredTasks = list.filter(callback);
        if (filteredTasks.length > 0) {
          acc.push(filteredTasks);
        }
        return acc;
      }, []);
    };

    var activeTodos = Array.isArray(currentTasksList[0]) ? filteredArray(currentTasksList, activeFilter) : currentTasksList.filter(function (task) {
      return !task.done;
    });
    var completedTodos = Array.isArray(currentTasksList[0]) ? filteredArray(currentTasksList, completedFilter) : currentTasksList.filter(function (task) {
      return task.done;
    });
    var action = divViews.querySelector('.is-selected').dataset.action;

    if (action === 'viewActive') {
      window.setTimeout(function () {
        renderList(activeTodos, ulActiveList);
      }, 300);
    } else if (action === 'viewCompleted') {
      window.setTimeout(function () {
        renderList(completedTodos, ulActiveList);
      }, 300);
    } else {
      window.setTimeout(function () {
        renderList(currentTasksList, ulActiveList);
      }, 300);
    }
  }

  // Updates subtask object's `done` property to reflect current `checked` state
  function toggleComplete(e) {
    if (!e.target.classList.contains('subtask-list__checkbox')) return;
    var id = formEditTodo.dataset.id;
    var todoIndex = state.activeList.tasks.findIndex(function (task) {
      return task.id === id;
    });
    var currentTask = state.activeList.tasks.find(function (task) {
      return task.id === id;
    });
    var subtaskIndex = e.target.dataset.subIndex;
    currentTask.subtasks[subtaskIndex].done = !currentTask.subtasks[subtaskIndex].done;
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
  function populateSubtasks() {
    var itemsArray = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var prop = arguments[1];
    var itemsList = arguments[2];
    var k = arguments[3];

    itemsList.innerHTML = itemsArray[k][prop].map(function (subitem, i) {
      return '<li class="subtask-list__item">\n<input type="checkbox" id="i' + k + '--' + i + '" name="i' + k + '--' + i + '" data-index="' + k + '" data-sub-index="' + i + '" class="subtask-list__checkbox" ' + (subitem.done ? 'checked' : '') + ' />\n<label for="i' + k + '--' + i + '" class="subtask-list__checkbox" data-index="' + k + '" data-sub-index="' + i + '"></label>\n<textarea class="form__textarea edit-todo-form__textarea--subtask" data-index="' + k + '" data-sub-index=' + i + '>' + subitem.text + '</textarea>\n</li>';
    }).join('');
  }

  /**
   * Adds subtask
   */
  function addSubtask(e) {
    e.preventDefault();

    if (e.target.dataset.action !== 'addSubtask') return;
    var id = hiddenTaskId.value;

    var currentTask = state.activeList.getTask(id);
    var todoIndex = state.activeList.findTaskIndex(id);
    var currentList = state.activeList;

    var text = $('#newSubtaskInput').value;
    if (text) {
      var newSubtask = new _Subtask2.default(text);
      currentTask.subtasks.push(newSubtask);
      populateSubtasks(currentList.tasks, 'subtasks', ulSubtasks, todoIndex);
      $all('.edit-todo-form__textarea--subtask', ulSubtasks).forEach(function (subtask) {
        return autoHeightResize(subtask);
      });
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
    var id = formEditTodo.dataset.id;
    var currentTask = state.activeList.getTask(id);
    var todoIndex = state.activeList.findTaskIndex(id); // index of todo object with matching ID in TODOS array
    var text = e.target.value;
    if (!/^\s+$/.test(text)) {
      currentTask.note = text;
      saveToStorage();
    }
  }

  // Resizes text inputs and textareas to show all content within
  function autoHeightResize(elem) {
    elem.style.height = '0px';
    elem.style.height = elem.scrollHeight + 'px';
  }

  function renameTodo(e) {
    if (!e.target.classList.contains('todo-item__title')) return;
    var id = e.target.dataset.id;
    var newText = e.target.value.trim();
    var currentTask = state.activeList.getTask(id);
    var todoItem = $('#' + id);
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
    if (!e.target.classList.contains('edit-todo-form__textarea--subtask')) return;
    var id = e.currentTarget.dataset.id;
    var currentTask = state.activeList.getTask(id);
    var newSubtaskText = e.target.value;
    var subtaskIndex = e.target.dataset.subIndex;
    currentTask.subtasks[subtaskIndex].text = newSubtaskText.trim();
    saveToStorage();
  }

  function toggleContent(e) {
    if (e.target.classList.contains('lemon') || e.target.classList.contains('todo-list__checkbox') || e.target.getAttribute('type') === 'checkbox' || e.currentTarget.contains($('.bulk-actions__checkbox-label', e.currentTarget)) || e.target.classList.contains('tag-labels__btn--tooltip')) return;
    var todoItem = e.currentTarget;
    var id = todoItem.id;
    var dueDateLabel = $('.badge--due-date', todoItem);
    var todoItemTitle = $('.todo-item__title', todoItem);
    var ulActiveList = $('.is-active-list');

    if (e.currentTarget.id === 'btnCloseTaskDetails') {
      todoItem = $('#' + hiddenTaskId.value);
    }

    if (todoAppContainer.classList.contains('show-task-details')) {
      todoItem.classList.remove('is-selected');
      todoAppContainer.classList.remove('show-task-details');
      // Reset task details pane
      var tags = $all('#tagsContainer .tag', taskDetails);
      tags.forEach(function (x) {
        return x.remove();
      });
      $('#dueDateWrapper').classList.remove('has-due-date');
      $('#dueDateWrapper').classList.remove('show-input');
      $('#dueDateWrapper').parentNode.classList.remove('is-focused');
      $('#dpCalendar').classList.remove('is-active');
      $all('.todo-list__item', ulActiveList).forEach(function (item) {
        return item.classList.remove('is-selected');
      });
    }

    if (!todoAppContainer.classList.contains('show-task-details') && e.currentTarget.id !== 'btnCloseTaskDetails') {
      hiddenTaskId.value = id;
      populateTaskDetails(id);
      $all('.todo-list__item', ulActiveList).forEach(function (item) {
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
    var currentTask = listObj.getTask(taskId);
    var todoItem = currentTask.elem;
    var taskIndex = listObj.findTaskIndex(taskId);
    var ulActiveList = $('.is-active-list');
    listObj.tasks.splice(taskIndex, 1);
    saveToStorage();

    var currentTasksList = state.filteredList === null ? state.activeList.tasks : state.filteredList;
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
    return tag.trim().replace(/  +/g, ' ').replace(/[^\w -]/g, '');
  }

  /**
   * Returns first existing tag that matches string and undefined if it doesn't exist
   * @param {num} [todoIndex =0] - limits the search of an existing tag to the todo object at the index provided
   */
  function findExistingTag(text) {
    var todoIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

    var existingTag = void 0;
    var ulActiveList = $('.is-active-list');
    var currentList = state.activeList;
    if (todoIndex !== undefined) {
      existingTag = currentList.tasks[todoIndex].tags.find(function (tag) {
        return tag.text === text;
      });
    } else {
      for (var i = 0; i < todoLists.length; i++) {
        for (var j = 0; j < todoLists[i].tasks.length; j++) {
          existingTag = todoLists[i].tasks[j].tags.find(function (tag) {
            return tag.text === text;
          });
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
    var currentTask = state.activeList.tasks[todoIndex];
    var id = currentTask.id;
    var todoItem = $('#' + id);
    $all('#tagsContainer .tag', formEditTodo)[tagIndex].remove();
    $all('.todo-item__tag-labels .tag-label', todoItem)[tagIndex].remove();
    currentTask.tags.splice(tagIndex, 1);
    saveToStorage();
    var tagsTooltipBtn = $('.tag-labels__btn--tooltip', todoItem);
    if (currentTask.tags.length > 0) {
      // Update tags tooltip
      tagsTooltipBtn.dataset.tooltip = currentTask.tagSummary;
    } else {
      tagsTooltipBtn.remove();
    }
  }

  function addTag(e) {
    if (e.target.dataset.action !== 'addTag' && $('#newTagInput').value === '') return;
    e.preventDefault();
    var tagsContainer = $('#tagsContainer');
    var newTagInput = $('#newTagInput');
    var id = formEditTodo.dataset.id;
    var todoIndex = state.activeList.findTaskIndex(id);
    var currentTask = state.activeList.getTask(id);
    var todoItem = $('#' + id);
    var tagLabels = $('.todo-item__tag-labels', todoItem);
    var tagsTooltipBtn = tagLabels.querySelector('.btn--tooltip') || createNode('button', {
      class: 'btn btn--tooltip tag-labels__btn--tooltip',
      'data-tooltip': '',
      type: 'button'
    }, '...');
    if (!tagLabels.contains(tagsTooltipBtn)) {
      tagLabels.appendChild(tagsTooltipBtn);
    }
    if (newTagInput.value !== '') {
      var text = filterTag(newTagInput.value);

      // Prevents duplicating existing tags for a todo item
      if (findExistingTag(text, todoIndex)) return;

      if (text.length > 0) {
        var existingTag = findExistingTag(text);
        var tag = {
          text: text,
          // Assigns color of previously created tag that matches text, if exists
          color: existingTag !== undefined ? existingTag.color : 'bg--default'
        };
        state.activeList.tasks[todoIndex].tags.push(tag);
        saveToStorage();
        var deleteTagBtn = createNode('button', {
          class: 'close-icon',
          type: 'button',
          value: 'false'
        });
        deleteTagBtn.addEventListener('click', function (e) {
          removeTag(todoIndex, state.activeList.tasks[todoIndex].tags.indexOf(tag));
        }, false);
        var newTagNode = createNode('span', {
          class: 'tag ' + tag.color,
          'data-tag-index': state.activeList.tasks[todoIndex].tags.indexOf(tag)
        }, tag.text, deleteTagBtn);
        tagsContainer.insertBefore(newTagNode, newTagInput);
        var tagLabel = createNode('span', {
          class: 'tag tag-label ' + tag.color
        }, tag.text);

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
    var todoItem = $('#' + id);
    // Change state to current list object
    state.activeList = getListByTaskId(id);
    var ulActiveList = $('.is-active-list');
    var currentTask = state.activeList.getTask(id);
    var todoIndex = state.activeList.findTaskIndex(id);
    var todoItemTitle = $('#taskName');
    var todoItemNote = $('.todo-item__note', formEditTodo);
    var newTagInput = $('#newTagInput');
    var lemon = $('.task-details__lemon', taskDetails);
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

    $('#btnCloseTaskDetails .list-name').textContent = ulActiveList.dataset.name;
    $('#taskDetailsBreadcrumbs .list-name').textContent = state.activeList.name;
    $('#taskDetailsBreadcrumbs .breadcrumbs__link').setAttribute('href', '#' + state.activeList.id);

    if (state.activeList.folder !== 'null') {
      $('#taskDetailsBreadcrumbs .folder-name').textContent = state.activeList.folder;
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
    var subtasks = $all('.edit-todo-form__textarea--subtask', ulSubtasks);
    formEditTodo.dataset.index = todoIndex;
    formEditTodo.dataset.id = id;
    colorPicker.dataset.index = todoIndex;
    colorPicker.dataset.id = id;

    // Readjust height of textareas to display all content within
    setTimeout(function () {
      autoHeightResize(todoItemTitle);
      if (!todoItemNote.value) {
        todoItemNote.style.height = '0px';
      } else {
        autoHeightResize(todoItemNote);
      }
      if (currentTask.subtasks.length > 0) {
        subtasks.forEach(function (subtask) {
          return autoHeightResize(subtask);
        });
      }
    }, 0);

    var tagsContainer = $('#tagsContainer');

    if (currentTask.tags.length > 0) {
      currentTask.tags.forEach(function (tag, i) {
        var deleteTagBtn = createNode('button', {
          class: 'close-icon',
          type: 'button',
          value: 'false'
        });
        deleteTagBtn.addEventListener('click', function (e) {
          removeTag(todoIndex, i);
        });
        var newTagNode = createNode('span', {
          class: 'tag',
          'data-tag-index': i
        }, tag.text, deleteTagBtn);
        newTagNode.classList.add(tag.color);
        tagsContainer.insertBefore(newTagNode, newTagInput);
      });
    }
    feather.replace();
  }

  function updateView(e) {
    var ulActiveList = $('.is-active-list');
    var currentTasksList = state.filteredList !== null ? state.filteredList : state.activeList.tasks;

    var activeFilter = function activeFilter(task) {
      return !task.done;
    };
    var completedFilter = function completedFilter(task) {
      return task.done;
    };
    var filteredArray = function filteredArray(arr, callback) {
      return arr.reduce(function (acc, list) {
        var filteredTasks = list.filter(callback);
        if (filteredTasks.length > 0) {
          acc.push(filteredTasks);
        }
        return acc;
      }, []);
    };
    var activeTodos = Array.isArray(currentTasksList[0]) ? filteredArray(currentTasksList, activeFilter) : currentTasksList.filter(function (task) {
      return !task.done;
    });
    var completedTodos = Array.isArray(currentTasksList[0]) ? filteredArray(currentTasksList, completedFilter) : currentTasksList.filter(function (task) {
      return task.done;
    });
    var action = e.target.dataset.action;
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
    var viewBtns = divViews.querySelectorAll('.views__btn');
    // Mark current view displayed by adding '.is-selected' class to corresponding button
    for (var i = 0; i < viewBtns.length; i++) {
      if (e.target !== viewBtns[i]) {
        viewBtns[i].classList.remove('is-selected');
      } else {
        viewBtns[i].classList.add('is-selected');
      }
    }
  }

  function createBreadcrumbs(listElement) {
    $all('.todo-list__item', listElement).forEach(function (item) {
      var list = getListByTaskId(item.id);
      var folderName = list.folder !== 'null' ? createNode('span', { class: 'breadcrumbs__folder' }, list.folder, createNode('i', { 'data-feather': 'chevron-right' })) : '';
      var listLink = createNode('a', { class: 'breadcrumbs__link', href: '#' + list.id }, list.name);
      listLink.addEventListener('click', openList);
      var breadcrumbs = createNode('div', { class: 'breadcrumbs' }, folderName, listLink);
      item.appendChild(breadcrumbs);
      var badgeDueDate = $('.badge--due-date', item);
      if (badgeDueDate) {
        badgeDueDate.classList.add('is-hidden');
      }
    });
    feather.replace();
  }

  function renderList(itemsArray, itemsList) {
    var ulActiveList = $('.is-active-list');
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
      $all('.todo-list').forEach(function (list) {
        return list.innerHTML = '';
      });

      var filterByDate = itemsList === $('#upcoming');
      itemsArray.forEach(function (list) {
        var taskId = list[0].id;
        var listObj = getListByTaskId(taskId);
        var firstTask = listObj.getTask(taskId);

        var folderName = listObj.folder !== 'null' ? createNode('span', { class: 'filtered-list__folder-name' }, listObj.folder, createNode('i', { 'data-feather': 'chevron-right' })) : '';
        // Create sub-list
        var ulSubList = createNode('ul', {
          class: 'filtered-list__sub-list'
        });
        // Create list link
        var subListTitle = filterByDate ? createNode('h2', { class: 'filtered-list__date filtered-list__sub-list-name' }, createNode('span', { class: 'filtered-list__day-num' }, firstTask.dueDayNumStr), createNode('span', { class: 'filtered-list__date-group' }, createNode('span', { class: 'filtered-list__month' }, firstTask.dueMonthAbbrev), createNode('span', { class: 'filtered-list__year' }, firstTask.dueYearStr)), createNode('span', { class: 'filtered-list__weekday' }, firstTask.dueDayOfWeek)) : createNode('a', {
          class: 'filtered-list__link filtered-list__sub-list-name',
          href: '#' + listObj.id
        }, listObj.name);

        if (filterByDate && firstTask.isDueToday) {
          subListTitle.classList.add('filtered-list__date--today');
        } else if (filterByDate && firstTask.isDueTomorrow) {
          subListTitle.classList.add('filtered-list__date--tomorrow');
        }

        // Create filtered list item
        var liFilteredListItem = createNode('li', { class: 'filtered-list__item' }, filterByDate ? '' : folderName, subListTitle, ulSubList);
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
    var query = inputSearch.value.toLowerCase();
    if (query !== '') {
      var filteredArray = todoLists.reduce(function (acc, list) {
        var filteredTasks = list.tasks.filter(function (todo) {
          return Object.keys(todo).some(function (key) {
            if (typeof todo[key] === 'string') {
              return todo[key].toLowerCase().includes(query);
            }
            if (Array.isArray(todo[key])) {
              return todo[key].some(function (item) {
                return item.text.toLowerCase().includes(query);
              });
            }
          });
        });
        if (filteredTasks.length > 0) {
          acc.push(filteredTasks);
        }
        return acc;
      }, []);

      var ulFilteredList = $('#filteredList');
      state.activeList = null;
      state.filteredList = filteredArray;
      renderList(filteredArray, ulFilteredList);

      var taskCount = filteredArray.reduce(function (acc, list) {
        return acc.concat(list);
      }, []).length;
      $('.is-active-list').classList.remove('is-active-list');
      ulFilteredList.classList.add('is-active-list');
      $('#activeListTitle').innerHTML = taskCount + ' search result(s) for <strong>' + inputSearch.value + '</strong>';
      formAddTodo.classList.add('is-hidden');
      inputSearch.blur();
    }
  }

  function filterTasksByDueDate(dateObj) {
    return todoLists.reduce(function (acc, list) {
      return acc.concat(list.tasks.filter(function (task) {
        return new Date(task.dueDate).valueOf() === dateObj.valueOf();
      }));
    }, []);
  }

  function displayTaskSchedule(timeFrame, listElem) {
    var filteredArray = [];
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    if (timeFrame === 'today') {
      filteredArray = filterTasksByDueDate(today);
      $('#activeListTitle').innerHTML = '<span class="filtered-list__weekday--lg">Today,</span><span class="filtered-list__day-num">' + today.getDate() + '</span><span class="filtered-list__date-group"><span class="filtered-list__month">' + monthsArr[today.getMonth()].abbrev + '</span><span class="filtered-list__year">' + today.getFullYear() + '</span></span><span class="filtered-list__weekday">' + weekdaysArr[today.getDay()].full + '</span>';
    } else if (timeFrame === 'upcoming') {
      var currentMonthIndex = today.getMonth();
      var _currentYear = today.getFullYear();
      var nextYear = _currentYear + 1;
      var currentMonth = monthsArr[currentMonthIndex];
      var nextMonthIndex = currentMonth.name !== 'December' ? currentMonthIndex + 1 : 0;

      if (currentMonth.name === 'February') {
        currentMonth.daysTotal = isLeapYear(_currentYear) ? 29 : 28;
      }
      var daysInMonth = currentMonth.daysTotal;

      var currentDay = today.getDate();
      for (var i = 0; i < 7; i++) {
        var day = currentDay < daysInMonth ? new Date(_currentYear, currentMonthIndex, currentDay) : nextMonthIndex !== 0 ? new Date(_currentYear, nextMonthIndex, currentDay - daysInMonth) : new Date(nextYear, nextMonthIndex, currentDay - daysInMonth);
        currentDay++;
        var tasksDue = filterTasksByDueDate(day);
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
    var id = e.currentTarget.dataset.id;
    if (state.filteredList !== null) {
      state.activeList = getListByTaskId(id);
    }
    var currentTasksList = state.filteredList === null ? state.activeList.tasks : state.filteredList;
    var ulActiveList = $('.is-active-list');
    var currentTask = state.activeList.getTask(id);
    var todoItem = currentTask.elem;
    var taskIndex = state.activeList.findTaskIndex(id);
    currentTask.isPriority = !currentTask.isPriority;
    $('#' + id).classList.toggle('is-priority');

    if (e.currentTarget.id === 'taskDetailsLemon') {
      taskDetails.classList.toggle('is-priority');
    }

    var reverseIndex = state.activeList.tasks.slice().reverse().findIndex(function (task) {
      return task.isPriority && !task.done;
    });
    var lastIndex = state.activeList.tasks.length - 1;
    var indexLastPriority = reverseIndex >= 0 ? lastIndex - reverseIndex : reverseIndex;

    // Move priority items to top of list
    if (currentTask.isPriority === true && !currentTask.done && taskIndex > 0) {
      state.activeList.tasks.unshift(state.activeList.tasks.splice(taskIndex, 1)[0]);
      $all('.todo-list__item', ulActiveList).forEach(function (item, i) {
        if (i < taskIndex) {
          item.style.transform = 'translateY(58px)';
        } else if (i === taskIndex) {
          item.style.transform = 'translateY(-' + item.offsetTop + 'px)';
        }
      });

      setTimeout(function () {
        renderList(currentTasksList, ulActiveList);
        if (todoAppContainer.classList.contains('show-task-details')) {
          var activeTask = $('#' + hiddenTaskId.value);
          activeTask.classList.add('is-selected');
        }
      }, 300);
    }

    if (!currentTask.isPriority && !currentTask.done && taskIndex < indexLastPriority) {
      state.activeList.tasks.splice(indexLastPriority, 0, state.activeList.tasks.splice(taskIndex, 1)[0]);
      var itemsBetween = indexLastPriority - taskIndex;
      todoItem.style.transform = 'translateY(' + itemsBetween * 58 + 'px)';
      for (var i = indexLastPriority; i > indexLastPriority - itemsBetween; i--) {
        $all('.todo-list__item', ulActiveList)[i].style.transform = 'translateY(-58px)';
      }

      setTimeout(function () {
        renderList(currentTasksList, ulActiveList);
        if (todoAppContainer.classList.contains('show-task-details')) {
          var activeTask = $('#' + hiddenTaskId.value);
          activeTask.classList.add('is-selected');
        }
      }, 300);
    }

    saveToStorage();
  }

  function toggleMenu() {
    var siteWrapper = document.getElementById('siteWrapper');

    if (siteWrapper.classList.contains('show-nav')) {
      siteWrapper.classList.remove('show-nav');
    } else {
      siteWrapper.classList.add('show-nav');
    }
  }

  function setTagColor(e) {
    var el = e.target;
    if (!el.classList.contains('color-picker__swatch')) return;
    var currentColor = $('#' + el.getAttribute('for'));
    currentColor.checked = true;
    var tag = colorPicker.parentNode;
    tag.className = 'tag ' + currentColor.value;
    var id = colorPicker.dataset.id;
    var todoItem = state.activeList.tasks.find(function (task) {
      return task.id === id;
    });
    var tagIndex = tag.dataset.tagIndex;
    todoItem.tags[tagIndex].color = currentColor.value;
    var tagLabel = $all('.tag-label', $('#' + id))[tagIndex];
    tagLabel.className = 'tag tag-label ' + currentColor.value;
    saveToStorage();
  }

  function createList(listObj) {
    var list_ul = createNode('ul', {
      class: 'todo-list custom-list',
      id: listObj.id,
      'data-name': listObj.name
    });
    list_ul.addEventListener('click', toggleDone);
    $('#main').insertBefore(list_ul, formAddTodo);
    renderListOption(listObj);
  }

  // Sidebar accordion

  function displayPanel(e) {
    if (!e.target.classList.contains('accordion__item')) return;
    var accordion = $('.accordion');
    var accordionItems = accordion.getElementsByClassName('accordion__item');
    var selectedPanel = e.currentTarget.querySelector('.accordion__panel');
    for (var i = 0; i < accordionItems.length; i++) {
      if (accordionItems[i] === selectedPanel.parentNode) {
        accordionItems[i].classList.toggle('is-active');
      }
    }
  }

  var createNavItem = function createNavItem(listObj) {
    var parentNode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : $('#sidebarMenu');

    var iListIcon = createNode('i', {
      'data-feather': 'list'
    });
    var spanListName = createNode('span', {
      class: 'sidebar__list-name'
    }, listObj.name);
    var spanTaskCount = createNode('span', {
      class: 'sidebar__task-count'
    }, listObj.activeTaskCount > 0 ? '' + listObj.activeTaskCount : '');
    var aListLink = createNode('a', {
      class: 'sidebar__link' + (listObj.activeTaskCount > 0 ? ' has-active-tasks' : ''),
      href: '#' + listObj.id
    }, iListIcon, spanListName, spanTaskCount);
    aListLink.addEventListener('click', openList);
    var liItem = createNode('li', {
      class: '' + (listObj.folder === 'null' ? 'sidebar__item' : 'accordion__sub-item')
    }, aListLink);
    if (listObj.folder === 'null') {
      parentNode.appendChild(liItem);
    } else {
      $('[data-folder="' + listObj.folder + '"]', parentNode).appendChild(liItem);
    }
    // Render feather icons
    feather.replace();
  };

  function renderNavItems() {
    // Array of folder names
    var foldersArr = todoLists.map(function (list) {
      return list.folder;
    }).filter(function (folder, i, arr) {
      return folder !== 'null' && arr.indexOf(folder) === i;
    });
    var frag = document.createDocumentFragment();
    foldersArr.forEach(function (folder) {
      var ulFolderPanel = createNode('ul', {
        class: 'accordion__panel',
        'data-folder': folder
      });
      renderFolderOption(folder);
      var iFolderIcon = createNode('i', {
        'data-feather': 'folder'
      });
      var iChevronIcon = createNode('i', {
        class: 'chevron-icon',
        'data-feather': 'chevron-left'
      });
      var liFolder = createNode('li', {
        class: 'sidebar__item accordion__item'
      }, iFolderIcon, folder, iChevronIcon, ulFolderPanel);

      liFolder.addEventListener('click', displayPanel);
      frag.appendChild(liFolder);

      // Creates accordion panel for each folder, with links to children underneath
      var folderItems = todoLists.filter(function (list) {
        return list.folder === folder;
      });
      folderItems.forEach(function (item) {
        return createNavItem(item, frag);
      });
    });

    // Creates regular nav items for miscellaneous lists
    var miscLists = todoLists.filter(function (list) {
      return list.folder === 'null';
    });
    miscLists.forEach(function (item) {
      if (item.id !== 'inbox') {
        createNavItem(item, frag);
      }
    });
    $('#sidebarMenu').appendChild(frag);

    // Render feather icons
    feather.replace();

    // Displays list on click
    var navLinksAll = $all('.sidebar__link');
    navLinksAll.forEach(function (link) {
      return link.addEventListener('click', openList);
    });
  }

  renderNavItems();

  function updateTaskCount(listId) {
    var navLink = $('.sidebar__link[href="#' + listId + '"]');
    switch (listId) {
      case 'today':
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var taskCountDueToday = filterTasksByDueDate(today).length;
        $('.sidebar__task-count', navLink).textContent = taskCountDueToday > 0 ? '' + filterTasksByDueDate(today).length : '';
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
        var _listObj = todoLists.find(function (list) {
          return list.id === listId;
        });
        $('.sidebar__task-count', navLink).textContent = _listObj.activeTaskCount > 0 ? '' + _listObj.activeTaskCount : '';
        if (_listObj.activeTaskCount > 0) {
          navLink.classList.add('has-active-tasks');
        } else {
          navLink.classList.remove('has-active-tasks');
        }
        break;
    }
  }

  function openList(e) {
    e.preventDefault();
    var navLinksAll = $all('.sidebar__link');
    navLinksAll.forEach(function (link) {
      if (link === e.target) {
        link.classList.add('is-active');
      } else {
        link.classList.remove('is-active');
      }
    });
    if (e.target.id !== 'todayNavLink' && e.target.id !== 'upcomingNavLink') {
      var id = e.target.getAttribute('href').slice(1);
      var _listObj2 = todoLists.find(function (list) {
        return list.id === id;
      });
      displayList(_listObj2);
      if (document.documentElement.clientWidth < 768) {
        $('#siteWrapper').classList.remove('show-nav');
      }
    }
  }

  function renderFolderOption(text) {
    var folderRadio = createNode('input', {
      type: 'radio',
      id: 'folder--' + camelCased(text),
      name: 'folder',
      value: text
    });
    var folderLabel = createNode('label', {
      class: 'form__label--folder',
      for: 'folder--' + camelCased(text)
    }, text);
    var customFolders = $('#fieldsetFolders .custom-folders');
    customFolders.appendChild(folderRadio);
    customFolders.appendChild(folderLabel);
  }

  function renderListOption(listObj) {
    var listRadio = createNode('input', {
      type: 'radio',
      id: 'list--' + listObj.id,
      name: 'list',
      value: listObj.id
    });
    var listLabel = createNode('label', {
      class: 'form__label--list',
      for: 'list--' + listObj.id
    }, listObj.name);
    var fieldsetLists = $('#fieldsetLists');
    fieldsetLists.appendChild(listRadio);
    fieldsetLists.appendChild(listLabel);
  }

  function addList(e) {
    e.preventDefault();
    var newListName = $('#newListNameInput').value;
    if (newListName === '') {
      $('#errorNoListName').classList.add('show-msg');
    } else {
      var checkedRadio = $('input[name="folder"]:checked').value;
      var newFolder = $('#newFolderInput').value;
      var selectedFolder = checkedRadio !== 'new' ? checkedRadio : newFolder !== '' ? newFolder : 'null';
      var newList = new _List2.default(newListName, selectedFolder);
      todoLists.push(newList);
      createList(newList);
      // Creates new folder accordion element
      if (newFolder) {
        var ulFolderPanel = createNode('ul', {
          class: 'accordion__panel',
          'data-folder': selectedFolder
        });
        var iFolderIcon = createNode('i', {
          'data-feather': 'folder'
        });
        var iChevronIcon = createNode('i', {
          class: 'chevron-icon',
          'data-feather': 'chevron-left'
        });
        var folder_li = createNode('li', {
          class: 'sidebar__item accordion__item'
        }, iFolderIcon, selectedFolder, iChevronIcon, ulFolderPanel);
        folder_li.addEventListener('click', displayPanel);
        $('#sidebarMenu').insertBefore(folder_li, $('[data-folder="null"]'));

        renderFolderOption(selectedFolder);
        feather.replace();
      }
      createNavItem(newList);
      saveToStorage();
      var navLinksAll = $all('.sidebar__link');
      navLinksAll.forEach(function (link) {
        if (link.getAttribute('href') === '#' + newList.id) {
          link.classList.add('is-active');
        } else {
          link.classList.remove('is-active');
        }
      });
      e.currentTarget.reset();
      $('#newListFormContainer').classList.remove('is-active');
      if ($('#transferTasksFormContainer').classList.contains('is-active')) {
        $('input[name="list"][value=' + newList.id + ']').checked = true;
      } else {
        displayList(newList);
      }
    }
  }

  function prepEditListForm(e) {
    // Attach folder options
    var btnUpdateList = $('#btnUpdateList');
    formEditList.insertBefore(fieldsetFolders, btnUpdateList);
    // Insert list name
    $('#editListNameInput').value = state.activeList.name;
    // Check radio for list folder
    $('input[name="folder"][value="' + state.activeList.folder + '"]').checked = true;
    $('#editListFormContainer').classList.add('is-active');
  }

  function updateList(e) {
    e.preventDefault();
    var newListName = $('#editListNameInput').value;
    var checkedRadio = $('input[name="folder"]:checked').value;
    var selectedFolder = checkedRadio === 'new' ? $('#newFolderInput').value : checkedRadio;
    var listNavLink = $('a[href="#' + state.activeList.id + '"]');
    var listNavItem = listNavLink.parentNode;
    // Rename list
    if (newListName !== '' && newListName !== state.activeList.name) {
      state.activeList.name = newListName;

      // Update list nav link
      $('.sidebar__list-name', listNavLink).textContent = newListName;
      $('#activeListTitle').textContent = newListName;
    }
    // Create new folder
    if (checkedRadio === 'new' && selectedFolder !== '') {
      console.log({ selectedFolder: selectedFolder });
      var ulFolderPanel = createNode('ul', {
        class: 'accordion__panel',
        'data-folder': selectedFolder
      });
      var iFolderIcon = createNode('i', {
        'data-feather': 'folder'
      });
      var folder_li = createNode('li', {
        class: 'sidebar__item accordion__item'
      }, iFolderIcon, selectedFolder, ulFolderPanel);
      folder_li.addEventListener('click', displayPanel);
      $('#sidebarMenu').insertBefore(folder_li, $('[data-folder="null"]'));

      renderFolderOption(selectedFolder);
      feather.replace();
    }
    // Set different/new folder
    if (state.activeList.folder !== selectedFolder && selectedFolder !== '') {
      state.activeList.folder = selectedFolder;

      // Append list nav item to sidebar
      if (selectedFolder === 'null') {
        listNavItem.className = 'sidebar__item';
        listNavItem.dataset.folder = 'null';
        $('#sidebarMenu').appendChild(listNavItem);
      } else {
        // Append list nav item to different/new folder
        listNavItem.className = 'accordion__sub-item';
        listNavItem.removeAttribute('data-folder');
        $('[data-folder="' + selectedFolder + '"]').appendChild(listNavItem);
      }
    }
    // Save changes to storage
    saveToStorage();
    e.currentTarget.reset();
    $('#editListFormContainer').classList.remove('is-active');
  }

  function deleteList(listObj) {
    var listNavLink = $('a[href="#' + listObj.id + '"]');
    var listNavItem = listNavLink.parentNode;
    var listElement = listObj.elem;

    // Delete list object
    var listIndex = todoLists.indexOf(listObj);
    todoLists.splice(listIndex, 1);
    saveToStorage();

    // Delete list nav item
    listNavItem.remove();

    // Delete folder elements if list is the only item in folder
    var folder = listObj.folder;
    if (folder !== 'null' && todoLists.filter(function (list) {
      return list.folder === folder;
    }).length === 0) {
      // Delete nav folder item
      $('[data-folder="' + listObj.folder + '"]').parentNode.remove();
      // Delete folder radio
      var folderRadio = $('input[name="folder"][value="' + folder + '"]');
      folderRadio.remove();
      $('.form__label--folder[for=' + folderRadio.id + ']').remove();
    }

    // Delete list `ul` element
    listElement.remove();

    // Delete list option from transfer tasks form
    var listRadio = $('input[name="list"][value=' + listObj.id + ']');
    listRadio.remove();
    $('.form__label--list[for=' + listRadio.id + ']').remove();

    // Reload inbox
    var inbox = todoLists.find(function (list) {
      return list.name === 'Inbox';
    });
    displayList(inbox);

    if ($('#alertWarningDeleteList').classList.contains('is-active')) {
      $('#alertWarningDeleteList').classList.remove('is-active');
    }
  }

  function displayList(listObj) {
    var ulActiveList = $('.is-active-list');
    var list_ul = $('#' + listObj.id);

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

    $all('.todo-list').forEach(function (x) {
      if (x !== list_ul) {
        x.classList.remove('is-active-list');
      } else {
        x.classList.add('is-active-list');
      }
    });
    formAddTodo.classList.remove('is-hidden');
  }

  function populateCalendarYears() {
    var date = new Date();
    var year = date.getFullYear();
    var frag = document.createDocumentFragment();
    // Adds current and next 2 years as radio options for year picker
    for (var i = 0; i <= 3; i++) {
      var yearRadio = createNode('input', {
        type: 'radio',
        name: 'year',
        value: '' + (year + i),
        id: '' + (year + i),
        class: 'dp-calendar__radio'
      });
      frag.appendChild(yearRadio);
      var yearLabel = createNode('label', {
        for: '' + (year + i),
        class: 'dp-calendar__year'
      }, '' + (year + i));
      frag.appendChild(yearLabel);
    }
    $('#dpCalendarYearDropdown').appendChild(frag);
  }

  populateCalendarYears();

  // Sets default month to current month

  function updateDateInput(dateComponent) {
    for (var _len2 = arguments.length, newValues = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      newValues[_key2 - 1] = arguments[_key2];
    }

    var currentDate = $('#inputDueDate').value; // `mm/dd/yy`
    var currentYear = currentDate.slice(6);
    var currentMonth = currentDate.slice(0, 2);
    var currentDay = currentDate.slice(3, 5);
    switch (dateComponent) {
      case 'month':
        var monthNum = monthsArr.findIndex(function (x) {
          return x.name === newValues[0];
        });
        $('#inputDueDate').value = (monthNum > 8 ? monthNum + 1 : '0' + (monthNum + 1)) + '/' + currentDay + '/' + currentYear;
        break;
      case 'day':
        $('#inputDueDate').value = currentMonth + '/' + (newValues[0] > 9 ? newValues[0] : '0' + newValues[0]) + '/' + currentYear;
        break;
      case 'year':
        $('#inputDueDate').value = currentMonth + '/' + currentDay + '/' + newValues[0].slice(2);
        break;
      case 'all':
        var monthIndex = monthsArr.findIndex(function (x) {
          return x.name === newValues[0];
        });
        $('#inputDueDate').value = (monthIndex > 8 ? monthIndex + 1 : '0' + (monthIndex + 1)) + '/' + (newValues[1] > 9 ? newValues[1] : '0' + newValues[1]) + '/' + newValues[2].slice(2);
        break;
    }
  }

  function selectMonth(e) {
    if (!e.target.classList.contains('dp-calendar__month')) return;
    var currentDueDate = $('#inputDueDate').value; // mm-dd-yy
    var dueMonthIndex = +currentDueDate.slice(0, 2) - 1;
    var dueMonth = monthsArr[dueMonthIndex].name;
    var dueDay = +currentDueDate.slice(3, 5);

    var prevSelectedMonth = $('input[name="month"]:checked').value;
    var monthDropdown = $('#dpCalendarMonthDropdown');
    var btnToggleMonthDropdown = $('#btnToggleMonthDropdown');
    var radioId = e.target.getAttribute('for');
    var radio = $('#' + radioId);
    radio.checked = true;
    var selectedMonth = radio.value;
    if (selectedMonth !== prevSelectedMonth) {
      $('#btnToggleMonthDropdown .btn-text').textContent = selectedMonth;
      populateCalendarDays(selectedMonth);

      if (selectedMonth === dueMonth) {
        $('.dp-calendar__btn--select-day[value="' + dueDay + '"][data-month="' + selectedMonth + '"]').classList.add('is-selected');
      }
    }
    btnToggleMonthDropdown.classList.remove('is-active');
    monthDropdown.classList.remove('is-active');
  }

  function selectYear(e) {
    if (!e.target.classList.contains('dp-calendar__year')) return;

    var currentDueDate = $('#inputDueDate').value; // mm-dd-yy
    var dueMonthIndex = +currentDueDate.slice(0, 2) - 1;
    var dueMonth = monthsArr[dueMonthIndex].name;
    var dueDay = +currentDueDate.slice(3, 5);
    var dueYear = '20' + currentDueDate.slice(6);

    var prevSelectedYear = $('input[name="year"]:checked').value;
    var btnToggleYearDropdown = $('#btnToggleYearDropdown');
    var yearDropdown = $('#dpCalendarYearDropdown');
    var radioId = e.target.getAttribute('for');
    var radio = $('#' + radioId);
    radio.checked = true;
    var selectedYear = radio.value;

    if (selectedYear !== prevSelectedYear) {
      $('#btnToggleYearDropdown .btn-text').textContent = selectedYear;
      populateCalendarDays(dueMonth);

      // Length of February depends on leap year
      if (selectedYear === dueYear) {
        $('.dp-calendar__btn--select-day[value="' + dueDay + '"][data-month="' + dueMonth + '"]').classList.add('is-selected');
      }
    }
    btnToggleYearDropdown.classList.remove('is-active');
    yearDropdown.classList.remove('is-active');
  }

  function populateCalendarDays(monthStr) {
    while ($('#dpCalendar').contains($('.dp-calendar__day'))) {
      $('.dp-calendar__day').remove();
    }

    var year = $('input[name="year"]:checked').value;
    var monthIndex = monthsArr.findIndex(function (month) {
      return month.name === monthStr;
    });
    var month = monthsArr[monthIndex];
    var monthStartingDate = new Date(year, monthIndex, 1);
    var monthStartingDayNum = monthStartingDate.getDay();
    var prevMonth = monthIndex !== 0 ? monthsArr[monthIndex - 1] : monthsArr[11];
    var nextMonth = monthIndex !== 11 ? monthsArr[monthIndex + 1] : monthsArr[0];

    if (monthStr === 'February') {
      month.daysTotal = isLeapYear(year) ? 29 : 28;
    }

    var frag = document.createDocumentFragment();

    if (monthStartingDayNum !== 0) {
      for (var j = prevMonth.daysTotal - monthStartingDayNum + 1; j <= prevMonth.daysTotal; j++) {
        var btnDay = createNode('button', {
          class: 'dp-calendar__btn--select-day dp-calendar__btn--prev-month',
          type: 'button',
          'data-month': prevMonth.name,
          'data-year': prevMonth.name === 'December' ? +year - 1 : year,
          'data-action': 'selectDay',
          value: j
        }, '' + j);
        var divDay = createNode('div', {
          class: 'dp-calendar__day dp-calendar__day--prev-month'
        }, btnDay);
        frag.appendChild(divDay);
      }
    }

    for (var i = 1; i <= month.daysTotal; i++) {
      var _btnDay = createNode('button', {
        class: 'dp-calendar__btn--select-day',
        type: 'button',
        'data-month': month.name,
        'data-year': year,
        'data-action': 'selectDay',
        'data-first': i === 1,
        'data-last': i === month.daysTotal,
        value: i
      }, '' + i);
      var _divDay = createNode('div', {
        class: 'dp-calendar__day'
      }, _btnDay);
      frag.appendChild(_divDay);
    }

    if (frag.children.length % 7 !== 0) {
      for (var k = 1; k < 7; k++) {
        var _btnDay2 = createNode('button', {
          class: 'dp-calendar__btn--select-day dp-calendar__btn--next-month',
          type: 'button',
          'data-month': nextMonth.name,
          'data-year': nextMonth.name === 'January' ? +year + 1 : year,
          'data-action': 'selectDay',
          value: k
        }, '' + k);
        var _divDay2 = createNode('div', {
          class: 'dp-calendar__day dp-calendar__day--next-month'
        }, _btnDay2);
        frag.appendChild(_divDay2);
        if (frag.children.length % 7 === 0) {
          break;
        }
      }
    }

    $('#dpCalendarDayPicker').appendChild(frag);
  }

  function selectDay(e) {
    var el = e.target;
    if (el.dataset.action !== 'selectDay') return;

    $all('.dp-calendar__btn--select-day').forEach(function (x) {
      if (x === el) {
        x.classList.add('is-selected');
      } else {
        x.classList.remove('is-selected');
      }
    });
    var selectedDay = el.value;
    var selectedMonth = el.dataset.month;
    var selectedYear = el.dataset.year;
    updateDateInput('all', selectedMonth, selectedDay, selectedYear);

    if (el.classList.contains('dp-calendar__btn--prev-month') || el.classList.contains('dp-calendar__btn--next-month')) {
      if (el.classList.contains('dp-calendar__btn--prev-month') && selectedMonth === 'December' || el.classList.contains('dp-calendar__btn--next-month') && selectedMonth === 'January') {
        $('input[name="year"][value="' + selectedYear + '"]').checked = true;
        $('#btnToggleYearDropdown .btn-text').textContent = selectedYear;
      }

      $('input[name="month"][value="' + selectedMonth + '"]').checked = true;
      $('#btnToggleMonthDropdown .btn-text').textContent = selectedMonth;
      populateCalendarDays(selectedMonth);
      $('.dp-calendar__btn--select-day[value="' + selectedDay + '"][data-month="' + selectedMonth + '"]').classList.add('is-selected');
    }
  }

  function setDueDate(e) {
    var id = hiddenTaskId.value;
    var currentTask = state.activeList.getTask(id);
    var todoItem = currentTask.elem;

    var dueDate = $('#inputDueDate').value; // `mm/dd/yy`
    var dueYear = +('20' + dueDate.slice(6));
    var dueMonthIndex = +dueDate.slice(0, 2) - 1;
    var dueDay = +dueDate.slice(3, 5);
    var dueMonthAbbrev = monthsArr[dueMonthIndex].abbrev;
    var currentDueDate = new Date(currentTask.dueDate);
    var newDueDate = new Date(dueYear, dueMonthIndex, dueDay);

    if (currentDueDate.valueOf() !== newDueDate.valueOf()) {
      currentTask.dueDate = newDueDate;
      saveToStorage();
      var dueDateLabel = $('.badge--due-date', todoItem) ? $('.badge--due-date', todoItem) : createNode('span');

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
    var errors = $all('.error', e.currentTarget);
    errors.forEach(function (error) {
      if (error.classList.contains('show-msg')) {
        error.classList.remove('show-msg');
      }
    });
    var form = $('form', e.currentTarget);
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

    var id = $('#dpCalendar').parentNode.dataset.id;
    var currentTask = state.activeList.tasks.find(function (task) {
      return task.id === id;
    });

    if (currentTask.dueDate !== null) {
      var dueDate = new Date(currentTask.dueDate);
      // month index starts at 0
      var dueMonthIndex = dueDate.getMonth();
      var dueMonth = monthsArr[dueMonthIndex].name;
      var dueDay = dueDate.getDate();
      var dueYear = '' + dueDate.getFullYear();

      updateDateInput('all', dueMonth, dueDay, dueYear);

      $('input[name="year"][value="' + dueYear + '"]').checked = true;
      $('#btnToggleYearDropdown .btn-text').textContent = dueYear;
      $('input[name="month"][value="' + dueMonth + '"]').checked = true;
      $('#btnToggleMonthDropdown .btn-text').textContent = dueMonth;
      populateCalendarDays(dueMonth);
      $('.dp-calendar__btn--select-day[value="' + dueDay + '"][data-month="' + dueMonth + '"]').classList.add('is-selected');
    } else {
      var _now = new Date();
      var currentMonthNum = _now.getMonth();
      var currentMonth = monthsArr[currentMonthNum];
      var _currentYear2 = '' + _now.getFullYear();
      var currentDay = _now.getDate();
      updateDateInput('all', currentMonth.name, currentDay, _currentYear2);

      // Set default month to current month
      $('#dpCalendarMonthDropdown input[value="' + currentMonth.name + '"]').checked = true;
      $('#btnToggleMonthDropdown .btn-text').textContent = currentMonth.name;

      // Sets default year to current year
      $('#dpCalendarYearDropdown input[value="' + _currentYear2 + '"]').checked = true;
      $('#btnToggleYearDropdown .btn-text').textContent = _currentYear2;
      populateCalendarDays(currentMonth.name);
      $('.dp-calendar__btn--select-day[value="' + currentDay + '"][data-month="' + currentMonth.name + '"]').classList.add('is-selected');
    }
  }

  function expandSearchBar(e) {
    e.stopPropagation();
    if (e.target === searchInput) return;
    if (!searchBar.classList.contains('is-expanded')) {
      e.preventDefault();
      searchBar.classList.add('is-expanded');
      $('#searchInput').focus();
    } else if (searchBar.classList.contains('is-expanded') && searchInput.value == '') {
      searchBar.classList.remove('is-expanded');
    }
  }

  // Disables/Enables bulk action buttons, depending on if items are checked
  function enableBulkActions(e) {
    var ulActiveList = $('.is-active-list');
    var checkedItems = $all('.bulk-actions__checkbox:checked', ulActiveList);
    var allItems = $all('.bulk-actions__checkbox', ulActiveList);
    var bulkActions = $all('.toolbar__btn[data-bulk-action="true"]');
    var masterCheckbox = $('#masterCheckbox');
    // If no items are selected...
    if (checkedItems.length === 0) {
      // Disable bulk action buttons
      bulkActions.forEach(function (btn) {
        return btn.disabled = true;
      });
      // Uncheck master checkbox
      if (masterCheckbox.checked === true) {
        masterCheckbox.checked = false;
      }
    } else {
      // Enable bulk action buttons
      bulkActions.forEach(function (btn) {
        return btn.disabled = false;
      });
      // If all items are selected, change state of master checkbox to true if unchecked
      if (checkedItems.length === allItems.length && masterCheckbox.checked === false) {
        masterCheckbox.checked = true;
      }
    }
  }

  function initBulkEditing(e) {
    // Hide add todo form
    $('#addTodoForm').classList.add('is-hidden');
    // Uncheck master bulk editing checkbox
    $('#masterCheckbox').checked = false;
    // Reveal bulk editing toolbar
    $('#bulkActionsToolbar').classList.add('is-active');
    // Add bulk-editing checkboxes and hide regular checkboxes for toggling completeness
    var ulActiveList = $('.is-active-list');
    ulActiveList.classList.add('bulk-editing-list');
    $all('.todo-list__item', ulActiveList).forEach(function (x, i) {
      var frag = document.createDocumentFragment();
      var checkbox = createNode('input', {
        type: 'checkbox',
        id: 'bulk-item-' + i,
        'data-index': i,
        'data-id': x.id,
        class: 'bulk-actions__checkbox'
      });
      checkbox.addEventListener('change', highlightSelected);
      var checkboxLabel = createNode('label', {
        class: 'bulk-actions__checkbox-label',
        for: 'bulk-item-' + i
      });
      frag.appendChild(checkbox);
      frag.appendChild(checkboxLabel);
      x.insertBefore(frag, $('input[type="checkbox"]', x));
      $('.todo-list__checkbox', x).classList.add('is-hidden');
      x.classList.add('bulk-editing-list__item');
    });
    // Disable bulk action buttons
    $all('.toolbar__btn[data-bulk-action="true"]').forEach(function (btn) {
      return btn.disabled = true;
    });
    ulActiveList.addEventListener('click', enableBulkActions);
    $('#main').addEventListener('scroll', stickToolbar);
  }

  function highlightSelected(e) {
    var todoItem = e.currentTarget.parentNode;
    if (e.currentTarget.checked === true) {
      todoItem.classList.add('is-checked');
    } else {
      todoItem.classList.remove('is-checked');
    }
  }

  function transferTasks(e) {
    e.preventDefault();
    var ulActiveList = $('.is-active-list');
    var currentTasksList = state.filteredList === null ? state.activeList.tasks : state.filteredList;
    var checkedItems = $all('.bulk-actions__checkbox:checked', ulActiveList);
    var newListId = $('input[name="list"]:checked').value;
    var newListObj = todoLists.find(function (list) {
      return list.id === newListId;
    });

    // Remove tasks from current list and add to new list
    checkedItems.forEach(function (item) {
      var taskId = item.dataset.id;
      var listObj = getListByTaskId(taskId);
      var taskIndex = listObj.tasks.findIndex(function (task) {
        return task.id === taskId;
      });
      var task = listObj.tasks.splice(taskIndex, 1)[0];
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
    var ulActiveList = $('.is-active-list');
    var currentTasksList = state.filteredList === null ? state.activeList.tasks : state.filteredList;
    var checkedItems = $all('.bulk-actions__checkbox:checked', ulActiveList);
    checkedItems.forEach(function (item) {
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
    if (colorPicker.classList.contains('is-visible') && e.target !== $('#btnAddTag') && e.target !== colorPicker && !colorPicker.contains(e.target)) {
      colorPicker.classList.remove('is-visible');
      formEditTodo.appendChild(colorPicker);
    }

    // Hides tag labels tooltip
    if (divTodoApp.contains($('.tag-labels__btn--tooltip.show-tooltip')) && e.target !== $('.tag-labels__btn--tooltip.show-tooltip')) {
      $('.tag-labels__btn--tooltip.show-tooltip').classList.remove('show-tooltip');
    }

    var monthDropdown = $('#dpCalendarMonthDropdown');
    var btnToggleMonthDropdown = $('#btnToggleMonthDropdown');
    var yearDropdown = $('#dpCalendarYearDropdown');
    var btnToggleYearDropdown = $('#btnToggleYearDropdown');

    // Hides monthDropdown
    if (monthDropdown.classList.contains('is-active') && e.target !== monthDropdown && e.target !== btnToggleMonthDropdown && !monthDropdown.contains(e.target)) {
      monthDropdown.classList.remove('is-active');
      btnToggleMonthDropdown.classList.remove('is-active');
    }

    // Hides yearDropdown
    if (yearDropdown.classList.contains('is-active') && e.target !== yearDropdown && e.target !== btnToggleYearDropdown && !yearDropdown.contains(e.target)) {
      yearDropdown.classList.remove('is-active');
      btnToggleYearDropdown.classList.remove('is-active');
    }

    // Hides searchBar input
    if (searchBar.classList.contains('is-expanded') && (searchInput.value === '' && e.target !== searchBar && !searchBar.contains(e.target) || e.target.classList.contains('sidebar__link') || e.target.classList.contains('filtered-list__link')) || e.target.classList.contains('breadcrumbs__link')) {
      formSearch.reset();
      inputSearch.blur();
      searchBar.classList.remove('is-expanded');
    }

    // Hides dropdown menus
    $all('.more-actions__wrapper').forEach(function (item) {
      if (item.classList.contains('show-actions') && e.target !== item && !item.contains(e.target)) {
        item.classList.remove('show-actions');
      }
    });
  }

  function continueTour(e) {
    var el = e.target;
    if (!el.classList.contains('onboarding__btn')) return;
    var modal = e.currentTarget;
    var action = el.dataset.action;
    var ulActiveList = $('.is-active-list');

    if (action === 'beginTour') {
      $('.onboarding__footer', modal).classList.add('is-active');
      // Refresh completion status for all steps if tour is retaken
      $all('.onboarding__stepper .stepper__btn').forEach(function (btn) {
        return btn.classList.remove('is-completed');
      });
      state.onboarding.statusLog.forEach(function (status, i, arr) {
        return arr[i] = false;
      });
      state.onboarding.currentStep = 0;
    }

    var currentStep = state.onboarding.currentStep;
    var nextStep = state.onboarding.nextStep;

    if (action === 'endTour') {
      state.onboarding.currentStep = null;
      // Delete dummy tasks created in Step 3
      var noDummyTasks = state.activeList.tasks.filter(function (task) {
        return task.text !== 'Delete Me!';
      });
      state.activeList.tasks = noDummyTasks;
      renderList(state.activeList.tasks, ulActiveList);
      $all('.onboarding__step').forEach(function (section) {
        var step = +section.dataset.onboardingStep;
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
        $('.onboarding__tooltip[data-onboarding-step="' + currentStep + '"][data-order="0"]').classList.add('show-tooltip');
        var target = $('[data-onboarding-target="' + currentStep + '"]');
        // Set up first interaction point for current onboarding step
        if (target.tagName === 'FORM') {
          target.addEventListener('submit', trackTourProgress);
        } else {
          target.addEventListener('click', trackTourProgress);
        }
      } else {
        console.log({ nextStep: nextStep });
        // Show next section
        $all('.onboarding__step').forEach(function (section) {
          var step = +section.dataset.onboardingStep;
          if (step === nextStep) {
            section.classList.add('is-active');
          } else {
            section.classList.remove('is-active');
          }
        });

        // Set stepper btn to active

        $all('.onboarding__stepper .stepper__btn').forEach(function (btn, i) {
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
    var target = e.currentTarget;
    var tooltip = $('.onboarding__tooltip.show-tooltip');
    var currentStep = state.onboarding.currentStep;
    var ulActiveList = $('.is-active-list');
    var tooltipSet = Array.prototype.slice.call($all('.onboarding__tooltip[data-onboarding-step="' + currentStep + '"]')).sort(function (a, b) {
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
      var firstTask = $('.is-active-list .todo-list__item');
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
      $('.sidebar__buttons').insertBefore($('#onboardingTooltip_2-2'), $('#helpActionsWrapper'));
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
      for (var i = 0; i < 3; i++) {
        var dummyTask = new _Task2.default('Delete Me!');
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
      tooltipSet.forEach(function (item, i, arr) {
        if (item === tooltip) {
          arr[i + 1].classList.add('show-tooltip');
        }
      });
      return;
    }

    var nextStep = state.onboarding.nextStep;

    // Mark step as completed
    $all('.onboarding__stepper .stepper__btn').forEach(function (btn, i) {
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
    $all('.onboarding__step').forEach(function (section, i) {
      if (i === state.onboarding.nextStep) {
        section.classList.add('is-active');
      } else {
        section.classList.remove('is-active');
      }
    });

    console.log(state.onboarding.currentStep);
    console.log(state.onboarding.nextStep);

    // Reopen modal
    $('#onboarding').classList.add('is-active');

    // Update state
    state.onboarding.currentStep = state.onboarding.nextStep;
  }

  function selectStep(e) {
    $all('.onboarding__stepper .stepper__btn').forEach(function (btn, i) {
      if (e.target === btn) {
        state.onboarding.currentStep = i + 1;
        console.log(state.onboarding.currentStep);
        console.log(state.onboarding.nextStep);

        $all('.onboarding__step').forEach(function (section) {
          var step = +section.dataset.onboardingStep;
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

  function stickToolbar(e) {
    var toolbar = $('#bulkActionsToolbar');
    var main = $('#main');
    if (main.scrollTop >= toolbar.offsetTop) {
      main.classList.add('sticky-toolbar');
    } else {
      main.classList.remove('sticky-toolbar');
    }
  }

  // Event Listeners

  $('#newListNameInput').addEventListener('input', function (e) {
    if ($('#errorNoListName').classList.contains('show-msg')) {
      $('#errorNoListName').classList.remove('show-msg');
    }
  });

  $('#taskDetailsBreadcrumbs .breadcrumbs__link').addEventListener('click', openList);

  $('#taskDetailsLemon').addEventListener('click', setPriority);

  $('#taskName').addEventListener('input', enableAutoHeightResize);
  $('#todoItemNote').addEventListener('input', enableAutoHeightResize);

  $('#btnCloseTaskDetails').addEventListener('click', toggleContent);

  $('#taskName').addEventListener('change', renameTodo);

  var stepper = $('.onboarding__stepper');
  $all('.stepper__btn', stepper).forEach(function (btn) {
    return btn.addEventListener('click', selectStep);
  });

  $('#onboarding').addEventListener('click', continueTour);

  $('#transferTasksForm').addEventListener('submit', transferTasks);

  $('#newListInput').addEventListener('click', function (e) {
    $('input[id="listNew"]').checked = true;
  });

  $('#bulkActionsToolbar').addEventListener('click', function (e) {
    var el = e.target;
    var ulActiveList = $('.is-active-list');
    var currentListObj = state.activeList;
    var currentTasksList = state.filteredList === null ? state.activeList.tasks : state.filteredList;
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

  $('#masterCheckbox').addEventListener('change', function (e) {
    var checkedState = e.currentTarget.checked;
    var ulActiveList = $('.is-active-list');
    var checkedItems = $all('.bulk-actions__checkbox', ulActiveList);
    checkedItems.forEach(function (x) {
      var todoItem = x.parentNode;
      x.checked = checkedState;
      if (x.checked === true) {
        todoItem.classList.add('is-checked');
      } else {
        todoItem.classList.remove('is-checked');
      }
    });
    var bulkActions = $all('.toolbar__btn[data-bulk-action="true"]');
    if (checkedState === true && checkedItems.length > 0) {
      // Enable bulk action buttons
      bulkActions.forEach(function (btn) {
        return btn.disabled = false;
      });
    } else {
      // Disable bulk action buttons
      bulkActions.forEach(function (btn) {
        return btn.disabled = true;
      });
    }
  });

  $('#btnDeleteList').addEventListener('click', function (e) {
    deleteList(state.activeList);
  });
  formEditList.addEventListener('submit', updateList);

  $('#listActionsWrapper').addEventListener('click', function (e) {
    if (!e.target.classList.contains('more-actions__item')) return;

    var action = e.target.dataset.action;

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
        $('#alertWarningDeleteList .list-name').textContent = state.activeList.name;
        $('#alertWarningDeleteList').classList.add('is-active');
        break;
    }
    e.currentTarget.classList.remove('show-actions');
  });

  $('#helpActionsWrapper').addEventListener('click', function (e) {
    if (!e.target.classList.contains('more-actions__item')) return;
    var action = e.target.dataset.action;
    switch (action) {
      case 'openTour':
        $('#siteWrapper').classList.remove('show-nav');
        $('#onboarding').classList.add('is-active');
        break;
    }
    e.currentTarget.classList.remove('show-actions');
  });

  $('#clearAllBtn').addEventListener('click', clearAll);

  $all('.more-actions__btn--toggle').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var moreActionsWrapper = e.currentTarget.parentNode;
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

        $all('button[data-required="custom-list"]', moreActionsWrapper).forEach(function (item) {
          if (state.activeList === null || state.activeList.name === 'Inbox') {
            item.disabled = true;
          } else {
            item.disabled = false;
          }
        });
      }
      moreActionsWrapper.classList.toggle('show-actions');
    });
  });

  searchBar.addEventListener('click', expandSearchBar);

  $('#btnAddTag').addEventListener('click', addTag);

  document.querySelectorAll('.sidebar__btn--toggle').forEach(function (btn) {
    btn.addEventListener('click', toggleMenu, true);
  });
  divViews.addEventListener('click', updateView);
  formAddTodo.addEventListener('submit', addTodo);
  $('#todoInput').addEventListener('focus', function (e) {
    e.currentTarget.parentNode.classList.add('is-focused');
  });
  ulSubtasks.addEventListener('click', toggleComplete);
  ulSubtasks.addEventListener('input', function (e) {
    if (!e.target.classList.contains('edit-todo-form__textarea--subtask')) return;
    autoHeightResize(e.target);
  });
  formEditTodo.addEventListener('submit', addSubtask);
  $('#btnAddSubtask').addEventListener('click', addSubtask);
  colorPicker.addEventListener('click', setTagColor);

  formEditTodo.addEventListener('keyup', function (e) {
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
  formEditTodo.addEventListener('keyup', function (e) {
    var newTagInput = $('#newTagInput');
    if (e.target !== newTagInput) return;
    var id = e.currentTarget.dataset.id;
    var todoIndex = state.activeList.tasks.findIndex(function (task) {
      return task.id === id;
    });
    var currentTask = state.activeList.tasks.find(function (task) {
      return task.id === id;
    });
    if (currentTask.tags.length > 0) {
      var lastIndex = currentTask.tags.length - 1;
      var lastTag = formEditTodo.querySelectorAll('#tagsContainer .tag')[lastIndex];
      var lastTagBtn = lastTag.querySelector('.close-icon');
      if (e.keyCode === BACKSPACE_KEY && !newTagInput.value) {
        lastTag.classList.add('is-focused');
        // Removes tag when backspace key is hit consecutively
        setTimeout(function () {
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

  inputSearch.addEventListener('click', function (e) {
    return e.currentTarget.select();
  });

  document.body.addEventListener(clickTouch(), hideComponents);

  $all("[data-action='openListForm']").forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      if (document.documentElement.clientWidth < 768) {
        $('#siteWrapper').classList.remove('show-nav');
      }
      if (!formNewList.contains(fieldsetFolders)) {
        formNewList.insertBefore(fieldsetFolders, $('#addListBtn'));
      }
      $('#newListFormContainer').classList.add('is-active');
      window.setTimeout(function () {
        $('#newListNameInput').focus();
      }, 200);
    });
  });

  formNewList.addEventListener('submit', addList);
  inputNewFolder.addEventListener('click', function (e) {
    var newFolderRadio = $('input[id="folderNew"]');
    newFolderRadio.checked = true;
  });

  inputNewFolder.addEventListener('input', function (e) {
    if (e.currentTarget.value !== '') {
      $('#formGroupCreateFolder').classList.add('is-active');
    } else {
      $('#formGroupCreateFolder').classList.remove('is-active');
    }
  });

  // Prevents empty folder names from being created
  inputNewFolder.addEventListener('blur', function (e) {
    var noFolderRadio = $('input[id="folderNone"]');
    if (e.currentTarget.value === '') {
      noFolderRadio.checked = true;
    }
  });

  $all('.modal').forEach(function (modal) {
    return modal.addEventListener('click', closeModal);
  });

  $all('.tooltip').forEach(function (tooltip) {
    return tooltip.addEventListener('click', closeTooltip);
  });
  $all('.error').forEach(function (error) {
    return error.addEventListener('click', hideError);
  });

  $all('.dp-calendar__toggle-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.currentTarget.nextElementSibling.classList.toggle('is-active');
      e.currentTarget.classList.toggle('is-active');
    });
  });

  $all('.dp-calendar__dropdown').forEach(function (x) {
    if (x.dataset.name === 'month') {
      x.addEventListener('click', selectMonth);
    } else if (x.dataset.name == 'year') {
      x.addEventListener('click', selectYear);
    }
  });

  function selectPrevNext(e) {
    var action = e.target.dataset.action;
    var selectedMonth = $('input[name="month"]:checked').value;
    var selectedYear = $('input[name="year"]:checked').value;
    var selectedMonthIndex = monthsArr.findIndex(function (x) {
      return x.name === selectedMonth;
    });
    var prevMonth = selectedMonthIndex !== 0 ? monthsArr[selectedMonthIndex - 1].name : 'December';
    var nextMonth = selectedMonthIndex !== 11 ? monthsArr[selectedMonthIndex + 1].name : 'January';
    var currentDueDate = $('#inputDueDate').value; // mm/dd/yy
    var dueMonthIndex = +currentDueDate.slice(0, 2) - 1;
    var dueMonth = monthsArr[dueMonthIndex].name;
    var dueDay = +currentDueDate.slice(3, 5);
    var dueYear = '20' + currentDueDate.slice(6);
    console.log({ dueDay: dueDay });

    if (action === 'selectNextMonth') {
      if (nextMonth === 'January') {
        var nextYear = +selectedYear + 1;
        $('input[value="' + nextYear + '"]').checked = true;
        $('#btnToggleYearDropdown .btn-text').textContent = nextYear;
      }
      $('input[value="' + nextMonth + '"]').checked = true;
      $('#btnToggleMonthDropdown .btn-text').textContent = nextMonth;
      populateCalendarDays(nextMonth);
      if (nextMonth === dueMonth && selectedYear === dueYear) {
        $('.dp-calendar__btn--select-day[value="' + dueDay + '"][data-month="' + dueMonth + '"]').classList.add('is-selected');
      }
    }

    if (action === 'selectPrevMonth') {
      if (prevMonth === 'December') {
        var prevYear = +selectedYear - 1;
        $('input[value="' + prevYear + '"]').checked = true;
        $('#btnToggleYearDropdown .btn-text').textContent = prevYear;
      }
      $('input[value="' + prevMonth + '"]').checked = true;
      $('#btnToggleMonthDropdown .btn-text').textContent = prevMonth;
      populateCalendarDays(prevMonth);
      if (prevMonth === dueMonth && selectedYear === dueYear) {
        console.log({ selectedYear: selectedYear });
        $('.dp-calendar__btn--select-day[value="' + dueDay + '"][data-month="' + dueMonth + '"]').classList.add('is-selected');
      }
    }
  }
  // Select previous or next month on click
  $all('.dp-calendar__btn-prevnext').forEach(function (x) {
    return x.addEventListener('click', selectPrevNext);
  });

  $('#dpCalendarDayPicker').addEventListener('click', selectDay);
  $('#btnSetDueDate').addEventListener('click', setDueDate);

  $('#dueDateWrapper').addEventListener('click', function (e) {
    initDpCalendar(e);
    e.currentTarget.parentNode.classList.add('is-focused');
    e.currentTarget.classList.add('show-input');
    $('#dpCalendar').classList.add('is-active');
  });

  $('#inputDueDate').addEventListener('change', function (e) {
    var dateRegex = /[01][0-9]\/[0-3][0-9]\/[12][0-9]/; // mm/dd/yy

    if (!dateRegex.test(e.target.value)) {
      // Returns value for month as a double digit
      if (/^[0-9]\//.test(e.target.value)) {
        var foo = e.target.value;
        e.target.value = '0' + foo;
      }

      // Returns value for day as a double digit
      if (/^[01][0-9]\/[0-9]-/.test(e.target.value)) {
        var _foo = e.target.value;
        e.target.value = _foo.slice(0, 3) + '0' + _foo.slice(3);
      }
    }

    if (dateRegex.test(e.target.value)) {
      var dateStr = $('#inputDueDate').value; // mm/dd/yy
      console.log({ dateStr: dateStr });

      var selectedDay = $('.dp-calendar__btn--select-day.is-selected');
      var year = '20' + dateStr.slice(6);
      console.log({ year: year });
      var monthNum = +dateStr.slice(0, 2) - 1;
      var month = monthsArr[monthNum];
      var monthText = month.name;
      if (monthText === 'February') {
        month.daysTotal = isLeapYear(+year) ? 29 : 28;
      }

      var lastDay = month.daysTotal;
      var day = +dateStr.slice(3, 5) > lastDay ? (updateDateInput('day', lastDay), lastDay) : +dateStr.slice(3, 5);

      console.log({ day: day });

      if ($('input[name="year"]:checked').value !== year) {
        $('input[value="' + year + '"]').checked = true;
        $('#btnToggleYearDropdown .btn-text').textContent = year;
        populateCalendarDays(monthText);
        $('.dp-calendar__btn--select-day[value="' + day + '"][data-month="' + monthText + '"]').classList.add('is-selected');
      }

      if ($('input[name="month"]:checked').value !== monthText) {
        $('input[value="' + monthText + '"]').checked = true;
        $('#btnToggleMonthDropdown .btn-text').textContent = monthText;
        populateCalendarDays(monthText);
      }

      if (selectedDay && selectedDay.value !== day) {
        $all('.dp-calendar__btn--select-day').forEach(function (x) {
          if (x.value == day && !x.classList.contains('dp-calendar__btn--prev-month') && !x.classList.contains('dp-calendar__btn--next-month')) {
            x.classList.add('is-selected');
          } else {
            x.classList.remove('is-selected');
          }
        });
      }
    }
  });

  $('#todayNavLink').addEventListener('click', function (e) {
    displayTaskSchedule('today', $('#today'));
  });

  $('#upcomingNavLink').addEventListener('click', function (e) {
    displayTaskSchedule('upcoming', $('#upcoming'));
  });

  $('#btnClearDueDate').addEventListener('click', function (e) {
    var id = hiddenTaskId.value;
    var currentTask = state.activeList.getTask(id);
    var todoItem = $('#' + id);
    currentTask.dueDate = null;
    saveToStorage();
    var dueDateWrapper = $('#dueDateWrapper');
    dueDateWrapper.classList.remove('has-due-date');
    $('.due-date-text', dueDateWrapper).textContent = 'Set due date';
    dueDateWrapper.classList.remove('show-input');
    dueDateWrapper.parentNode.classList.remove('is-focused');
    $('#dpCalendar').classList.remove('is-active');
    $('.badge--due-date', todoItem).remove();
  });

  $('#btnResetDueDate').addEventListener('click', function (e) {
    $('#dueDateWrapper').classList.remove('show-input');
    $('#dueDateWrapper').parentNode.classList.remove('is-focused');
    $('#dpCalendar').classList.remove('is-active');
  });

  $all('.edit-todo-form__control').forEach(function (x) {
    x.addEventListener('focus', function (e) {
      var parent = e.currentTarget.parentNode;
      var grandparent = parent.parentNode;
      if (grandparent.classList.contains('edit-todo-form__form-group')) {
        grandparent.classList.add('is-focused');
      } else {
        parent.classList.add('is-focused');
      }
    });
    x.addEventListener('focusout', function (e) {
      var parent = e.currentTarget.parentNode;
      var grandparent = parent.parentNode;
      if (grandparent.classList.contains('edit-todo-form__form-group')) {
        grandparent.classList.remove('is-focused');
      } else {
        parent.classList.remove('is-focused');
      }
    });
  });

  $('#btnTriggerWarningDeleteTask').addEventListener('click', function (e) {
    var taskId = hiddenTaskId.value;
    var currentTask = state.activeList.getTask(taskId);
    $('#alertWarningDeleteTask .task-text').textContent = currentTask.text;
    $('#alertWarningDeleteTask').classList.add('is-active');
  });

  $('#btnDeleteTask').addEventListener('click', function (e) {
    var taskId = hiddenTaskId.value;
    deleteTask(state.activeList, taskId);
  });
})();
//# sourceMappingURL=app.js.map