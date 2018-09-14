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
  function $(selector, context = document) {
    // Checks if selector matches single CSS id selector syntax and context is set to document
    return /^#[\w-]+$/.test(selector) && context === document
      ? context.getElementById(selector.slice(1))
      : context.querySelector(selector);
  }

  function $all(selector, context = document) {
    return context.querySelectorAll(selector);
  }

  // Classes

  class List {
    constructor(name, folder, obj = null) {
      if (!obj) {
        this.name = name;
        this.folder = folder;
        this.id = `${camelCased(name)}-${Date.now()}`;
        this.tasks = [];
      } else {
        this.name = obj.name;
        this.folder = obj.folder;
        this.id = obj.id;
        this.tasks = obj.tasks;
      }
    }

    getTask(taskId) {
      return this.tasks.find((task) => task.id === taskId);
    }

    findTaskIndex(taskId) {
      return this.tasks.findIndex((task) => task.id === taskId);
    }
  }

  function getTask(id) {
    let currentTask;
    for (let i = 0; i < todoLists.length; i++) {
      currentTask = todoLists[i].tasks.find((task) => task.id === id);
      if (currentTask !== undefined) {
        break;
      }
    }
    return currentTask;
  }

  function findTaskIndex(id) {
    let taskIndex;
    for (let i = 0; i < todoLists.length; i++) {
      taskIndex = todoLists[i].tasks.findIndex((task) => task.id === id);
      if (taskIndex !== undefined) {
        break;
      }
    }
    return taskIndex;
  }

  class Subtask {
    constructor(text) {
      this.text = text;
      this.done = false;
    }
  }

  class Task extends Subtask {
    constructor(text) {
      super(text);
      this.subtasks = [];
      this.note = "";
      this.tags = [];
      this.id = uniqueID();
      this.dueDate = null;
    }
  }

  // Variables
  const divTodoApp = $("#todoApp");
  const formAddTodo = $("#addTodoForm");
  const formEditTodo = $("#editTodoForm");
  const formSearch = $("#searchForm");
  const searchBar = $("#searchBar");
  const inputSearch = $("#searchInput");
  const ulInbox = $("#inbox");
  const ulSubtasks = $("#subtaskList");
  const divViews = $("#views");
  const colorPicker = $("#colorPicker");
  const formNewList = $("#newListForm");
  const fieldsetFolders = $("#fieldsetFolders");
  const formEditList = $("#editListForm");
  const inputNewFolder = $("#newFolderInput");
  const todoContent = $("#todoContent");
  const todoLists = JSON.parse(localStorage.getItem("todoLists")) ? initLists(JSON.parse(localStorage.getItem("todoLists"))) : [];

  // Converts JSON list objects back to instances of class List
  function initLists(arr) {
    return arr.map((item) => new List(null, null, item));
  }

  const saveToStorage = () =>
    localStorage.setItem("todoLists", JSON.stringify(todoLists));

  const BACKSPACE_KEY = 8;
  const ENTER_KEY = 13;
  const state = {
    activeList: null,
    filteredList: null,
    nextOnboardingStep: 0
  };

  const clickTouch = () =>
    "ontouchstart" in document === true ? "touchstart" : "click";

  const now = new Date();
  const currentDate = now.getDate();
  const currentYear = now.getFullYear();

  const isLeapYear = (year) =>
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

  const monthsArr = [
    {
      name: "January",
      daysTotal: 31,
      abbrev: "Jan"
    },
    {
      name: "February",
      daysTotal: isLeapYear(currentYear) ? 29 : 28,
      abbrev: "Feb"
    },
    {
      name: "March",
      daysTotal: 31,
      abbrev: "Mar"
    },
    {
      name: "April",
      daysTotal: 30,
      abbrev: "Apr"
    },
    {
      name: "May",
      daysTotal: 31,
      abbrev: "May"
    },
    {
      name: "June",
      daysTotal: 30,
      abbrev: "Jun"
    },
    {
      name: "July",
      daysTotal: 31,
      abbrev: "Jul"
    },
    {
      name: "August",
      daysTotal: 31,
      abbrev: "Aug"
    },
    {
      name: "September",
      daysTotal: 30,
      abbrev: "Sep"
    },
    {
      name: "October",
      daysTotal: 31,
      abbrev: "Oct"
    },
    {
      name: "November",
      daysTotal: 30,
      abbrev: "Nov"
    },
    {
      name: "December",
      daysTotal: 31,
      abbrev: "Dec"
    }
  ];

  const weekdaysArr = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat"
  ];

  // Generates unique ID string, used for identifying todo items.
  const uniqueID = () =>
    +Date.now() +
    Math.random()
      .toString(36)
      .slice(2);

  const camelCased = (text) =>
    text
      .trim()
      .replace(/[^A-Za-z0-9 ]/g, "")
      .split(" ")
      .map(
        (str, i) =>
          i === 0
            ? str.toLowerCase()
            : str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
      )
      .join("");

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
  const createNode = (tagName, attributes, ...children) => {
    const node = document.createElement(tagName);

    Object.keys(attributes).forEach((key) => {
      if (key === "class") {
        const classes = attributes[key].split(" ");
        classes.forEach((x) => node.classList.add(x));
      } else if (/^data-/.test(key)) {
        const dataProp = key
          .slice(5) // removes `data-`
          .split("-")
          .map(
            (str, i) =>
              i === 0
                ? str
                : str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
          )
          .join("");
        node.dataset[dataProp] = attributes[key];
      } else {
        node.setAttribute(key, attributes[key]);
      }
    });

    children.forEach((child) => {
      if (typeof child === "undefined" || child === null) {
        return;
      }
      if (typeof child === "string") {
        node.appendChild(document.createTextNode(child));
      } else {
        node.appendChild(child);
      }
    });

    return node;
  };

  window.addEventListener('DOMContentLoaded', (e) => {
    $('#onboarding').classList.add('is-active');
  });

  if (todoLists.find((list) => list.name === "Inbox") === undefined) {
    const initInbox = new List("Inbox", "null");
    todoLists.push(initInbox);
    saveToStorage();
  }

  const inbox = todoLists.find((list) => list.name === "Inbox");
  inbox.id = "inbox";
  // Populates inbox tasks on load
  displayList(inbox);

  // Creates list node for each list object, except for the inbox list
  todoLists.forEach((list, i) => {
    if (i !== 0) {
      createList(list);
    }
  });

  // Adds new task object to current list array
  function addTodo(e) {
    e.preventDefault();

    const activeList_ul = $(".is-active-list");

    const text = $("#todoInput").value;
    if (text !== "") {
      const todo = new Task(text);
      state.activeList.tasks.unshift(todo); // Add new item to top of the list
      saveToStorage();
      populateList(state.activeList.tasks, activeList_ul);
    }
    // Resets addTodoForm
    e.currentTarget.reset();
  }

  // Renders todo objects as list items
  function populateList(itemsArray = [], itemsList) {
    // Prevents todoContent from being deleted if attached to list item
    if (todoContent.classList.contains("is-visible")) {
      todoContent.classList.remove("is-visible");
      divTodoApp.appendChild(todoContent);
    }

    itemsList.innerHTML = itemsArray
      .map(
        (item, i) => `<li class= ${
          item.done ? "todo-list__item is-done" : "todo-list__item"
        } data-index="${i}" id="${item.id}">
<input type="checkbox" id="item-${i}" data-index="${i}" value="${item.text}" ${
          item.done ? "checked" : ""
        } />
<label for ="item-${i}" class="todo-list__checkbox"></label>
<textarea class="form__textarea todo-item__title" data-index="${i}" data-id="${
          item.id
        }">${item.text}</textarea>
<button type="button" class="btn todo-item__btn--neutral todo-item__toggle-btn" data-action="toggleContent"></button>
</li>`
      )
      .join("");

    const itemsCollection = itemsList.getElementsByTagName("li");

    // Adds event listeners to each list item
    for (let i = 0; i < itemsCollection.length; i++) {
      itemsCollection[i].addEventListener("click", toggleContent);
      if (state.filteredList !== null) {
        itemsCollection[i].addEventListener(
          "click",
          (e) => {
            const id = e.currentTarget.id;
            state.activeList = getListByTaskId(id);
          },
          false
        );
      }
      const itemTitle = $(".todo-item__title", itemsCollection[i]);
      itemTitle.addEventListener("click", (e) => {
        const id = e.currentTarget.dataset.id;
        state.activeList = getListByTaskId(id);
      });
      itemTitle.addEventListener("change", renameTodo);

      // Creates tag labels for each todo item, if any
      const id = itemsCollection[i].id;
      for (let j = 0; j < itemsArray.length; j++) {
        if (id === itemsArray[j].id && itemsArray[j].dueDate !== null) {
          const dueDate = new Date(itemsArray[j].dueDate);
          const dueMonthIndex = dueDate.getMonth();
          const dueMonthAbbrev = monthsArr[dueMonthIndex].abbrev;
          const dueDay = dueDate.getDate();
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const currentDay = today.getDate();
          const currentMonthIndex = today.getMonth();
          const currentYear = today.getFullYear();
          const nextYear = currentYear + 1;
          const currentMonth = monthsArr[currentMonthIndex];
          const nextMonthIndex =
            currentMonth.name !== "December" ? currentMonthIndex + 1 : 0;
          if (currentMonth.name === "February") {
            currentMonth.daysTotal = isLeapYear(currentYear) ? 29 : 28;
          }
          if (currentDay === currentMonth.daysTotal) {
          }
          const tomorrow =
            currentDay < currentMonth.daysTotal
              ? new Date(currentYear, currentMonthIndex, currentDay + 1)
              : nextMonthIndex !== 0
                ? new Date(currentYear, nextMonthIndex, 1)
                : new Date(nextYear, nextMonthIndex, 1);
          tomorrow.setHours(0, 0, 0, 0);

          const dueDateLabel = createNode("span", { class: "badge--due-date" });

          if (dueDate.valueOf() === today.valueOf()) {
            dueDateLabel.textContent = "Today";
            dueDateLabel.classList.add("badge--today");
          } else if (dueDate.valueOf() === tomorrow.valueOf()) {
            dueDateLabel.textContent = "Tomorrow";
            dueDateLabel.classList.add("badge--tomorrow");
          } else {
            dueDateLabel.textContent = `${dueMonthAbbrev} ${dueDay}`;
          }
          itemsCollection[i].appendChild(dueDateLabel);
        }
        if (id === itemsArray[j].id && itemsArray[j].tags.length > 0) {
          const tagLabels =
            $(".todo-item__tag-labels", itemsCollection[i]) ||
            createNode("div", {
              class: "todo-item__tag-labels"
            });
          const tagsTooltipBtn =
            tagLabels.querySelector(".btn--tooltip") ||
            createNode(
              "button",
              {
                class: "btn btn--tooltip tag-labels__btn--tooltip",
                "data-tooltip": "",
                type: "button"
              },
              "..."
            );
          tagsTooltipBtn.dataset.tooltip = itemsArray[j].tags
            .map((tag) => tag.text)
            .join(", ");
          tagsTooltipBtn.addEventListener("click", (e) => {
            e.currentTarget.classList.toggle("show-tooltip");
          });
          if (!tagLabels.contains(tagsTooltipBtn)) {
            tagLabels.appendChild(tagsTooltipBtn);
          }

          // Renders tag labels
          itemsArray[j].tags.forEach((tag, i) => {
            const tagLabel = createNode(
              "span",
              {
                class: `tag tag-label ${tag.color}`
              },
              tag.text
            );
            tagLabels.insertBefore(tagLabel, tagsTooltipBtn);
          });
          itemsCollection[i].appendChild(tagLabels);
        }
      }
    }
  }

  // Updates todo object's `done` property to reflect current `checked` state
  function toggleDone(e) {
    const el = e.target;
    if (
      !el.classList.contains("todo-list__checkbox") ||
      el.classList.contains("bulk-actions__checkbox")
    )
      return;

    const id = el.parentNode.id; // ID of list item

    if (state.activeList === null) {
      state.activeList = getListByTaskId(id);
    }

    const activeList_ul = $(".is-active-list");
    const index = state.activeList.tasks.findIndex((task) => task.id === id);
    const currentTask = state.activeList.tasks.find((task) => task.id === id);
    const indexLastCompleted = state.activeList.tasks.findIndex(
      (item) => item.done === true
    ); // Represents index of most recently completed task
    currentTask.done = !currentTask.done; // Toggle `done` property of todo item: true becomes false; false becomes true

    if (currentTask.done) {
      if (indexLastCompleted !== -1) {
        state.activeList.tasks.splice(
          indexLastCompleted - 1,
          0,
          state.activeList.tasks.splice(index, 1)[0]
        ); // Moves finished task to the top of all completed items
      } else {
        state.activeList.tasks.push(state.activeList.tasks.splice(index, 1)[0]); // Move first completed task to bottom of todo list
      }
    }
    if (!currentTask.done && indexLastCompleted < index) {
      state.activeList.tasks.splice(
        indexLastCompleted,
        0,
        state.activeList.tasks.splice(index, 1)[0]
      ); // Move task reverted to incomplete to the bottom of all unfinished tasks (and to  the top of the entire todo list, if there are none)
    }

    saveToStorage();
    todoContent.classList.remove("is-visible");
    divTodoApp.appendChild(todoContent);

    const currentTasksList =
      state.filteredList === null ? state.activeList.tasks : state.filteredList;
    const activeFilter = (task) => !task.done;
    const completedFilter = (task) => task.done;
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
      : currentTasksList.filter((task) => !task.done);
    console.log(activeTodos);
    const completedTodos = Array.isArray(currentTasksList[0])
      ? filteredArray(currentTasksList, completedFilter)
      : currentTasksList.filter((task) => task.done);
    const action = divViews.querySelector(".is-selected").dataset.action;
    if (action === "viewActive") {
      window.setTimeout(() => {
        renderList(activeTodos, activeList_ul);
      }, 100);
    } else if (action === "viewCompleted") {
      window.setTimeout(() => {
        renderList(completedTodos, activeList_ul);
      }, 100);
    } else {
      window.setTimeout(() => {
        renderList(currentTasksList, activeList_ul);
      }, 100);
    }

    console.table(todoLists);
  }

  // Updates subtask object's `done` property to reflect current `checked` state
  function toggleComplete(e) {
    if (!e.target.classList.contains("subtask-list__checkbox")) return;
    const id = formEditTodo.dataset.id;
    const todoIndex = state.activeList.tasks.findIndex(
      (task) => task.id === id
    );
    const currentTask = state.activeList.tasks.find((task) => task.id === id);
    const subtaskIndex = e.target.dataset.subIndex;
    currentTask.subtasks[subtaskIndex].done = !currentTask.subtasks[
      subtaskIndex
    ].done;
    saveToStorage();
    populateSubtasks(state.activeList.tasks, "subtasks", ulSubtasks, todoIndex);
  }

  // Empties todos array and removes all rendered todo items
  function clearAll(e) {
    divTodoApp.appendChild(todoContent);
    while (todoLists.length > 1) {
      todoLists.pop(); // Remove all lists, except inbox
    }
    localStorage.removeItem("todoLists");
    while (inbox.tasks.length > 0) {
      inbox.tasks.pop();
    }
    // Remove saved data of objects in TODOS array from local storage
    ulInbox.innerHTML = ""; // Deletes all list items from DOM
    const allLists = $all(".todo-list");
    allLists.forEach((list) => {
      if (list.id !== "inbox") {
        list.remove();
      }
    });
    ulSubtasks.innerHTML = ""; // Deletes all ulSubtasks items from DOM
    formEditTodo.reset();
    $all("[data-folder]").forEach((item) => item.remove());
    $all('input[name="folder"]').forEach((item) => {
      if (item.value !== "null" && item.value !== "new") {
        item.remove();
      }
    });
    $all(".form__label--folder").forEach((item) => {
      if (
        item.getAttribute("for") !== "folderNone" &&
        item.getAttribute("for") !== "folderNew"
      ) {
        item.remove();
      }
    });
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
          subitem.done ? "checked" : ""
        } />
<label for="i${k}--${i}" class="subtask-list__checkbox" data-index="${k}" data-sub-index="${i}"></label>
<textarea class="form__textarea edit-todo-form__textarea--subtask" data-index="${k}" data-sub-index=${i}>${
          subitem.text
        }</textarea>
</li>`
      )
      .join("");

    // Enable auto height resizing for each subtask textarea
    $all(".edit-todo-form__textarea--subtask", itemsList).forEach((subtask) => {
      subtask.addEventListener("input", (e) => {
        autoHeightResize(e.currentTarget);
      });
    });
  }

  /**
   * Adds subtask
   */
  function addSubtask(e) {
    e.preventDefault();

    if (e.target.dataset.action !== "addSubtask") return;
    const id = formEditTodo.dataset.id;

    const currentTask = state.activeList.tasks.find((task) => task.id === id);
    const todoIndex = state.activeList.tasks.findIndex(
      (task) => task.id === id
    ); // index of todo object with matching ID in TODOS array
    const currentList = state.activeList;

    const text = $("#newSubtaskInput").value;
    if (text) {
      const newSubtask = new Subtask(text);
      currentTask.subtasks.push(newSubtask);
      populateSubtasks(currentList.tasks, "subtasks", ulSubtasks, todoIndex);
      saveToStorage();
      $("#newSubtaskInput").value = "";
    }
  }

  function enableAutoHeightResize(e) {
    autoHeightResize(e.currentTarget);
  }

  /**
   * Adds note
   */
  function addNote(e) {
    if (!e.target.classList.contains("todo-item__note")) return;
    const id = formEditTodo.dataset.id;

    const currentTask = state.activeList.getTask(id);
    const todoIndex = state.activeList.findTaskIndex(id); // index of todo object with matching ID in TODOS array

    console.log(currentTask.note);
    const text = e.target.value;
    if (!/^\s+$/.test(text)) {
      currentTask.note = text;
      saveToStorage();
    }
  }

  // Resizes text inputs and textareas to show all content within
  function autoHeightResize(elem) {
    elem.style.height = "0px";
    elem.style.height = `${elem.scrollHeight}px`;
  }

  function renameTodo(e) {
    if (!e.target.classList.contains("todo-item__title")) return;
    const id = e.target.dataset.id;
    const newText = e.target.value.trim();
    const currentTask = state.activeList.getTask(id);
    currentTask.text = newText;
    saveToStorage();
  }

  function editSubtask(e) {
    if (!e.target.classList.contains("edit-todo-form__textarea--subtask"))
      return;
    const id = e.currentTarget.dataset.id;
    const currentTask = state.activeList.getTask(id);
    const newSubtaskText = e.target.value;
    const subtaskIndex = e.target.dataset.subIndex;
    currentTask.subtasks[subtaskIndex].text = newSubtaskText.trim();
    saveToStorage();
  }

  function toggleContent(e) {
    if (!(e.target.dataset.action === "toggleContent")) return;
    e.preventDefault();
    const todoItem = e.currentTarget;
    const id = todoItem.id;
    const tagLabels = todoItem.querySelector(".todo-item__tag-labels");
    const dueDateLabel = todoItem.querySelector(".badge--due-date");
    const todoItemTitle = $(".todo-item__title", todoItem);
    const ulActiveList = $('.is-active-list');

    if (todoContent.classList.contains("is-visible")) {
      todoItemTitle.removeEventListener("input", enableAutoHeightResize);
      todoItemTitle.style.height = "0px";
      todoItem.classList.remove("is-expanded");
      todoContent.classList.remove("is-visible");
      if (todoItem.contains(tagLabels)) {
        tagLabels.classList.remove("is-hidden");
      }
      if (todoItem.contains(dueDateLabel) && ulActiveList !== $('#upcoming') && ulActiveList !== $('#today')) {
        dueDateLabel.classList.remove("is-hidden");
      }
      const tags = todoContent.querySelectorAll("#tagsContainer .tag");
      tags.forEach((x) => x.remove());
      divTodoApp.appendChild(todoContent); // Detaches edit form from list item
    } else {
      todoItem.appendChild(todoContent);
      $("#dueDateWrapper").classList.remove("has-due-date");
      $("#dueDateWrapper").classList.remove("show-input");
      $("#dpCalendar").classList.remove("is-active");
      if (todoItem.contains(tagLabels)) {
        tagLabels.classList.add("is-hidden");
      }
      if (todoItem.contains(dueDateLabel)) {
        dueDateLabel.classList.add("is-hidden");
      }
      todoContent.classList.add("is-visible");
      populateContent(e);
      todoItem.classList.add("is-expanded");
    }
  }

  function deleteTask(listObj, taskId) {
    const taskIndex = listObj.findTaskIndex(taskId);
    listObj.tasks.splice(taskIndex, 1);
    saveToStorage();

    if (todoContent.classList.contains("is-visible")) {
      const activeList_ul = $(".is-active-list");
      const currentTasksList =
        state.filteredList === null
          ? state.activeList.tasks
          : state.filteredList;
      todoContent.classList.remove("is-visible");
      divTodoApp.appendChild(todoContent);
      renderList(currentTasksList, activeList_ul);
      $("#alertWarningDeleteTask").classList.remove("is-active");
    }
  }

  function filterTag(tag) {
    return tag
      .trim()
      .replace(/  +/g, " ")
      .replace(/[^\w -]/g, "");
  }

  /**
   * Returns first existing tag that matches string and undefined if it doesn't exist
   * @param {num} [todoIndex =0] - limits the search of an existing tag to the todo object at the index provided
   */
  function findExistingTag(text, todoIndex = undefined) {
    let existingTag;
    const activeList_ul = $(".is-active-list");
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
    const id = state.activeList.tasks[todoIndex].id;
    const todoItem = document.getElementById(id);
    formEditTodo.querySelectorAll("#tagsContainer .tag")[tagIndex].remove();
    todoItem
      .querySelectorAll(".todo-item__tag-labels .tag-label")
      [tagIndex].remove();
    state.activeList.tasks[todoIndex].tags.splice(tagIndex, 1);
    saveToStorage();
    const tagsTooltipBtn = todoItem.querySelector(".tag-labels__btn--tooltip");
    tagsTooltipBtn.dataset.tooltip = state.activeList.tasks[todoIndex].tags
      .map((tag) => tag.text)
      .join(", ");
  }

  function addTag(e) {
    if (e.target.dataset.action !== "addTag" && $("#newTagInput").value === "")
      return;
    e.preventDefault();
    const tagsContainer = $("#tagsContainer");
    const newTagInput = $("#newTagInput");
    const id = formEditTodo.dataset.id;
    const todoIndex = state.activeList.tasks.findIndex(
      (task) => task.id === id
    );
    const currentTask = state.activeList.tasks.find((task) => task.id === id);
    const todoItem = document.getElementById(id);
    const tagLabels =
      $(".todo-item__tag-labels", todoItem) ||
      createNode("div", {
        class: "todo-item__tag-labels"
      });
    const tagsTooltipBtn =
      tagLabels.querySelector(".btn--tooltip") ||
      createNode(
        "button",
        {
          class: "btn btn--tooltip tag-labels__btn--tooltip",
          "data-tooltip": "",
          type: "button"
        },
        "..."
      );
    if (!tagLabels.contains(tagsTooltipBtn)) {
      tagLabels.appendChild(tagsTooltipBtn);
    }
    if (newTagInput.value !== "") {
      const text = filterTag(newTagInput.value);

      // Prevents duplicating existing tags for a todo item
      if (findExistingTag(text, todoIndex)) return;

      if (text.length > 0) {
        const existingTag = findExistingTag(text);
        const tag = {
          text,
          // Assigns color of previously created tag that matches text, if exists
          color: existingTag !== undefined ? existingTag.color : "bg--default"
        };
        state.activeList.tasks[todoIndex].tags.push(tag);
        saveToStorage();
        const deleteTagBtn = createNode("button", {
          class: "close-icon",
          type: "button",
          value: "false"
        });
        deleteTagBtn.addEventListener(
          "click",
          (e) => {
            removeTag(
              todoIndex,
              state.activeList.tasks[todoIndex].tags.indexOf(tag)
            );
          },
          false
        );
        const newTagNode = createNode(
          "span",
          {
            class: `tag ${tag.color}`,
            "data-tag-index": state.activeList.tasks[todoIndex].tags.indexOf(
              tag
            )
          },
          tag.text,
          deleteTagBtn
        );
        tagsContainer.insertBefore(newTagNode, newTagInput);
        const tagLabel = createNode(
          "span",
          {
            class: `tag tag-label ${tag.color}`
          },
          tag.text
        );

        // Updates tooltip data
        tagsTooltipBtn.dataset.tooltip = currentTask.tags
          .map((tag) => tag.text)
          .join(", ");
        console.log(tagsTooltipBtn.dataset.tooltip);
        tagLabels.insertBefore(tagLabel, tagsTooltipBtn);
        todoItem.appendChild(tagLabels);
        newTagInput.value = "";

        // Appends color picker to tag node if there are no existing tags that matches text
        if (existingTag === undefined) {
          console.log({ newTagNode });
          newTagNode.appendChild(colorPicker);
          console.log({ colorPicker });
          colorPicker.classList.add("is-visible");
        }
      }
    }
  }

  function getListByTaskId(todoId) {
    return todoLists.find((list) =>
      list.tasks.find((task) => task.id === todoId)
    );
  }

  function populateContent(e) {
    const todoItem = e.currentTarget;
    const id = todoItem.id;
    // Change state to current list object
    state.activeList = getListByTaskId(id);
    const activeList_ul = $(".is-active-list");
    const currentTask = state.activeList.getTask(id);
    const todoIndex = state.activeList.findTaskIndex(id);
    const todoItemTitle = $(".todo-item__title", todoItem);
    const todoItemNote = $(".todo-item__note", todoItem);
    const deleteTodoBtn = $("#deleteTodoBtn");
    const newTagInput = $("#newTagInput");
    todoItemTitle.value = currentTask.text;
    todoItemNote.value = currentTask.note;

    if (currentTask.dueDate !== null) {
      const dueDate = new Date(currentTask.dueDate);
      // month index starts at 0
      const dueMonthIndex = dueDate.getMonth();
      const dueMonthAbbrev = monthsArr[dueMonthIndex].abbrev;
      const dueDay = dueDate.getDate();
      $("#dueDateWrapper").classList.add("has-due-date");
      $(
        "#dueDateWrapper .due-date-text"
      ).textContent = `${dueMonthAbbrev} ${dueDay}`;
    } else {
      $("#dueDateWrapper").classList.remove("has-due-date");
      $("#dueDateWrapper .due-date-text").textContent = "Set due date";
    }

    populateSubtasks(state.activeList.tasks, "subtasks", ulSubtasks, todoIndex);
    formEditTodo.dataset.index = todoIndex;
    formEditTodo.dataset.id = id;
    colorPicker.dataset.index = todoIndex;
    colorPicker.dataset.id = id;

    autoHeightResize(todoItemTitle);

    todoItemTitle.addEventListener("input", enableAutoHeightResize);

    if (!todoItemNote.value) {
      todoItemNote.style.height = "0px";
    } else {
      autoHeightResize(todoItemNote);
    }

    // Readjust heights of subtask textareas to display all content within
    const subtasks = $all(".edit-todo-form__textarea--subtask", ulSubtasks);
    if (currentTask.subtasks.length > 0) {
      subtasks.forEach((subtask) => autoHeightResize(subtask));
    }

    const tagsContainer = todoItem.querySelector("#tagsContainer");

    if (currentTask.tags.length > 0) {
      currentTask.tags.forEach((tag, i) => {
        const deleteTagBtn = createNode("button", {
          class: "close-icon",
          type: "button",
          value: "false"
        });
        deleteTagBtn.addEventListener("click", (e) => {
          removeTag(todoIndex, i);
        });
        const newTagNode = createNode(
          "span",
          {
            class: "tag",
            "data-tag-index": i
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
    const activeList_ul = $(".is-active-list");
    const currentTasksList =
      state.filteredList !== null ? state.filteredList : state.activeList.tasks;

    const activeFilter = (task) => !task.done;
    const completedFilter = (task) => task.done;
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
      : currentTasksList.filter((task) => !task.done);
    const completedTodos = Array.isArray(currentTasksList[0])
      ? filteredArray(currentTasksList, completedFilter)
      : currentTasksList.filter((task) => task.done);
    const action = e.target.dataset.action;
    switch (action) {
      case "viewAll":
        renderList(currentTasksList, activeList_ul);
        break;
      case "viewActive":
        renderList(activeTodos, activeList_ul);
        break;
      case "viewCompleted":
        renderList(completedTodos, activeList_ul);
        break;
    }
    const viewBtns = divViews.querySelectorAll(".views__btn");
    // Mark current view displayed by adding '.is-selected' class to corresponding button
    for (let i = 0; i < viewBtns.length; i++) {
      if (e.target !== viewBtns[i]) {
        viewBtns[i].classList.remove("is-selected");
      } else {
        viewBtns[i].classList.add("is-selected");
      }
    }
  }

  function createBreadcrumbs(listElement) {
    $all(".todo-list__item", listElement).forEach((item) => {
      const list = getListByTaskId(item.id);
      const folderName = list.folder !== "null" ? `${list.folder} > ` : "";
      const listLink = createNode(
        "a",
        { class: "breadcrumbs__link", href: `#${list.id}` },
        list.name
      );
      listLink.addEventListener("click", openList);
      const breadcrumbs = createNode(
        "div",
        { class: "breadcrumbs" },
        folderName,
        listLink
      );
      item.appendChild(breadcrumbs);
      const badgeDueDate = $('.badge--due-date', item);
      if (badgeDueDate) {
        badgeDueDate.classList.add('is-hidden');
      }
    });
  }

  function renderList(itemsArray, itemsList) {
    const ulActiveList = $(".is-active-list");
    if (itemsList === $("#filteredList")) {
      $("#main").classList.add("show-search-results");
    } else {
      $("#main").classList.remove("show-search-results");
    }

    if ($("#bulkActionsToolbar").classList.contains("is-active")) {
      $("#bulkActionsToolbar").classList.remove("is-active");
      ulActiveList.removeEventListener("click", enableBulkActions);
    }

    if (Array.isArray(itemsArray[0])) {
      itemsList.innerHTML = "";
      const filterByDate = itemsList === $('#upcoming');

      itemsArray.forEach((list) => {

        const listObj = getListByTaskId(list[0].id);
        const date = new Date(list[0].dueDate);
        const month = monthsArr[date.getMonth()].abbrev;
        const dayNum = date.getDate();
        const weekday = weekdaysArr[date.getDay()];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentDay = today.getDate();
        const currentMonthIndex = today.getMonth();
        const currentYear = today.getFullYear();
        const nextYear = currentYear + 1;
        const currentMonth = monthsArr[currentMonthIndex];
        const nextMonthIndex =
        currentMonth.name !== "December" ? currentMonthIndex + 1 : 0;

      if (currentMonth.name === "February") {
        currentMonth.daysTotal = isLeapYear(currentYear) ? 29 : 28;
      }
        const tomorrow =
        currentDay < currentMonth.daysTotal
          ? new Date(currentYear, currentMonthIndex, currentDay + 1)
          : nextMonthIndex !== 0
            ? new Date(currentYear, nextMonthIndex, 1)
            : new Date(nextYear, nextMonthIndex, 1);
      tomorrow.setHours(0, 0, 0, 0);

        const folderName =
          listObj.folder !== "null"
            ? createNode(
                "span",
                { class: "filtered-list__folder-name" },
                listObj.folder,
                createNode("i", { "data-feather": "chevron-right" })
              )
            : "";
        // Create sub-list
        const ulSubList = createNode("ul", {
          class: "filtered-list__sub-list"
        });
        // Create list link
        const subListTitle = filterByDate ? createNode("h2", {class: 'filtered-list__date'}, date.valueOf() === today.valueOf() ? 'Today' : date.valueOf() === tomorrow.valueOf() ? 'Tomorrow' : `${weekday}, ${month} ${dayNum}`)
        : createNode(
          "a",
          { class: "filtered-list__link", href: `#${listObj.id}` },
          listObj.name
        );

        if (filterByDate && date.valueOf() === today.valueOf()) {
          subListTitle.classList.add('filtered-list__date--today');
        } else if (filterByDate && date.valueOf() === tomorrow.valueOf()) {
          subListTitle.classList.add('filtered-list__date--tomorrow');
        }

        if (!filterByDate) {
          subListTitle.addEventListener("click", openList);
        }
        // Create filtered list item
        const liFilteredListItem = createNode(
          "li",
          { class: "filtered-list__item" },
          filterByDate ? "" : folderName,
          subListTitle,
          ulSubList
        );
        // Populate tasks for each sub-list
        populateList(list, ulSubList);
        itemsList.appendChild(liFilteredListItem);
        feather.replace();
      });
    } else {
      populateList(itemsArray, itemsList);
    }
  }

  function filterTasks(e) {
    e.preventDefault();
    const query = inputSearch.value.toLowerCase();
    if (query !== "") {
      const filteredArray = todoLists.reduce((acc, list) => {
        const filteredTasks = list.tasks.filter((todo) =>
          Object.keys(todo).some((key) => {
            if (typeof todo[key] === "string") {
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

      const ulFilteredList = $("#filteredList");

      renderList(filteredArray, ulFilteredList);

      const taskCount = filteredArray.reduce(
        (acc, list) => acc.concat(list),
        []
      ).length;
      $(".is-active-list").classList.remove("is-active-list");
      ulFilteredList.classList.add("is-active-list");
      $(
        "#activeListTitle"
      ).innerHTML = `${taskCount} search result(s) for <strong>${
        inputSearch.value
      }</strong>`;
      formAddTodo.classList.add("is-hidden");
      state.activeList = null;
      state.filteredList = filteredArray;
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
    $("#activeListTitle").textContent = 'Today';
    } else if (timeFrame === 'upcoming') {
      const currentMonthIndex = today.getMonth();
      const currentYear = today.getFullYear();
      const nextYear = currentYear + 1;
      const currentMonth = monthsArr[currentMonthIndex];
      const nextMonthIndex =
        currentMonth.name !== "December" ? currentMonthIndex + 1 : 0;

      if (currentMonth.name === "February") {
        currentMonth.daysTotal = isLeapYear(currentYear) ? 29 : 28;
      }
      const daysInMonth = currentMonth.daysTotal;
      let currentDay = today.getDate();
      for (let i = 0; i <= 7; i++) {
        let day =
        currentDay < daysInMonth
          ? new Date(currentYear, currentMonthIndex, currentDay)
          : nextMonthIndex !== 0
            ? new Date(currentYear, nextMonthIndex, currentDay - daysInMonth)
            : new Date(nextYear, nextMonthIndex, currentDay - daysInMonth);
      day.setHours(0, 0, 0, 0);
      currentDay++;
      let tasksDue = filterTasksByDueDate(day);
      if (tasksDue.length > 0) {
        filteredArray.push(tasksDue);
      }
      };
      $("#activeListTitle").textContent = 'Upcoming';
    }
    renderList(filteredArray, listElem);
    createBreadcrumbs(listElem);

    $(".is-active-list").classList.remove("is-active-list");
    listElem.classList.add("is-active-list");
    formAddTodo.classList.add("is-hidden");
    state.activeList = null;
    state.filteredList = filteredArray;

    // Closes sidebar if viewport is < 768px
    if (document.documentElement.clientWidth < 768) {
      $("#siteWrapper").classList.remove("show-nav");
    }
  }

  function toggleMenu() {
    const siteWrapper = document.getElementById("siteWrapper");

    if (siteWrapper.classList.contains("show-nav")) {
      siteWrapper.classList.remove("show-nav");
    } else {
      siteWrapper.classList.add("show-nav");
    }
  }

  function setTagColor(e) {
    const el = e.target;
    if (!el.classList.contains("color-picker__swatch")) return;
    const currentColor = $(`#${el.getAttribute("for")}`);
    currentColor.checked = true;
    const tag = colorPicker.parentNode;
    tag.className = `tag ${currentColor.value}`;
    const id = colorPicker.dataset.id;
    const todoItem = state.activeList.tasks.find((task) => task.id === id);
    const tagIndex = tag.dataset.tagIndex;
    todoItem.tags[tagIndex].color = currentColor.value;
    const tagLabel = $all(".tag-label", $(`#${id}`))[tagIndex];
    tagLabel.className = `tag tag-label ${currentColor.value}`;
    saveToStorage();
  }

  function createList(listObj) {
    const list_ul = createNode("ul", {
      class: "todo-list",
      id: listObj.id,
      "data-name": listObj.name
    });
    list_ul.addEventListener("click", toggleDone);
    $("#main").insertBefore(list_ul, $("#views"));
    renderListOption(listObj);
  }

  // Sidebar accordion

  function displayPanel(e) {
    if (!e.target.classList.contains("accordion__item")) return;
    const accordion = $(".accordion");
    const accordionItems = accordion.getElementsByClassName("accordion__item");
    const selectedPanel = e.currentTarget.querySelector(".accordion__panel");
    for (let i = 0; i < accordionItems.length; i++) {
      if (accordionItems[i] === selectedPanel.parentNode) {
        accordionItems[i].classList.toggle("is-active");
      }
    }
  }

  const createNavItem = (listObj) => {
    const iListIcon = createNode("i", {
      "data-feather": "list"
    });
    const aListLink = createNode(
      "a",
      {
        class: "sidebar__link",
        href: `#${listObj.id}`
      },
      iListIcon,
      listObj.name
    );
    aListLink.addEventListener("click", openList);
    const item_li =
      listObj.folder === "null"
        ? createNode(
            "li",
            {
              class: "sidebar__item"
            },
            aListLink
          )
        : createNode(
            "li",
            {
              class: "accordion__sub-item"
            },
            aListLink
          );
    if (listObj.folder === "null") {
      $("#sidebarMenu").appendChild(item_li);
    } else {
      $(`[data-folder="${listObj.folder}"]`).appendChild(item_li);
    }
    // Render feather icons
    feather.replace();
  };

  function renderNavItems() {
    // Array of folder names
    const foldersArr = todoLists
      .map((list) => list.folder)
      .filter(
        (folder, i, arr) => folder !== "null" && arr.indexOf(folder) === i
      );
    const frag = document.createDocumentFragment();
    foldersArr.forEach((folder) => {
      const ulFolderPanel = createNode("ul", {
        class: "accordion__panel",
        "data-folder": folder
      });
      renderFolderOption(folder);

      // Creates accordion panel for each folder, with links to children underneath
      const folderItems = todoLists.filter((list) => list.folder === folder);
      folderItems.forEach((item) => {
        const iListIcon = createNode("i", {
          "data-feather": "list"
        });
        const aListLink = createNode(
          "a",
          {
            class: "sidebar__link",
            href: `#${item.id}`
          },
          iListIcon,
          item.name
        );
        const liFolderItem = createNode(
          "li",
          {
            class: "accordion__sub-item"
          },
          aListLink
        );
        ulFolderPanel.appendChild(liFolderItem);
      });

      const iFolderIcon = createNode("i", {
        "data-feather": "folder"
      });
      const iChevronIcon = createNode("i", {
        class: "chevron-icon",
        "data-feather": "chevron-left"
      });
      const liFolder = createNode(
        "li",
        {
          class: "sidebar__item accordion__item"
        },
        iFolderIcon,
        folder,
        iChevronIcon,
        ulFolderPanel
      );

      liFolder.addEventListener("click", displayPanel);
      frag.appendChild(liFolder);
    });

    // Creates regular nav items for miscellaneous lists
    const miscLists = todoLists.filter((list) => list.folder === "null");
    miscLists.forEach((item) => {
      if (item.id !== "inbox") {
        const iListIcon = createNode("i", {
          "data-feather": "list"
        });
        const aListLink = createNode(
          "a",
          {
            class: "sidebar__link",
            href: `#${item.id}`
          },
          iListIcon,
          item.name
        );
        const miscList_li = createNode(
          "li",
          {
            class: "sidebar__item",
            "data-folder": "null"
          },
          aListLink
        );
        frag.appendChild(miscList_li);
      }
    });
    $("#sidebarMenu").appendChild(frag);

    // Render feather icons
    feather.replace();

    // Displays list on click
    const navLinksAll = $all(".sidebar__link");
    navLinksAll.forEach((link) => link.addEventListener("click", openList));
  }

  renderNavItems();

  function openList(e) {
    e.preventDefault();
    const navLinksAll = $all(".sidebar__link");
    navLinksAll.forEach((link) => {
      if (link === e.target) {
        link.classList.add("is-active");
      } else {
        link.classList.remove("is-active");
      }
    });
    if (e.target.id !== "todayNavLink" && e.target.id !== "upcomingNavLink") {
      const id = e.target.getAttribute("href").slice(1);
      const listObj = todoLists.find((list) => list.id === id);
      displayList(listObj);
      if (document.documentElement.clientWidth < 768) {
        $("#siteWrapper").classList.remove("show-nav");
      }
    }
  }

  function renderFolderOption(text) {
    const folderRadio = createNode("input", {
      type: "radio",
      id: `folder--${camelCased(text)}`,
      name: "folder",
      value: text
    });
    const folderLabel = createNode(
      "label",
      {
        class: "form__label--folder",
        for: `folder--${camelCased(text)}`
      },
      text
    );
    const customFolders = $("#fieldsetFolders .custom-folders");
    customFolders.appendChild(folderRadio);
    customFolders.appendChild(folderLabel);
  }

  function renderListOption(listObj) {
    const listRadio = createNode("input", {
      type: "radio",
      id: `list--${listObj.id}`,
      name: "list",
      value: listObj.id
    });
    const listLabel = createNode(
      "label",
      {
        class: "form__label--list",
        for: `list--${listObj.id}`
      },
      listObj.name
    );
    const fieldsetLists = $("#fieldsetLists");
    fieldsetLists.appendChild(listRadio);
    fieldsetLists.appendChild(listLabel);
  }

  function addList(e) {
    e.preventDefault();
    const newListName = $("#newListNameInput").value;
    if (newListName !== "") {
      const checkedRadio = $('input[name="folder"]:checked').value;
      const selectedFolder =
        checkedRadio === "new" ? $("#newFolderInput").value : checkedRadio;
      const newList = new List(newListName, selectedFolder);
      todoLists.push(newList);
      createList(newList);
      // Creates new folder accordion element
      if (checkedRadio === "new") {
        const ulFolderPanel = createNode("ul", {
          class: "accordion__panel",
          "data-folder": selectedFolder
        });
        const iFolderIcon = createNode("i", {
          "data-feather": "folder"
        });
        const iChevronIcon = createNode("i", {
          class: "chevron-icon",
          "data-feather": "chevron-left"
        });
        const folder_li = createNode(
          "li",
          {
            class: "sidebar__item accordion__item"
          },
          iFolderIcon,
          selectedFolder,
          iChevronIcon,
          ulFolderPanel
        );
        folder_li.addEventListener("click", displayPanel);
        $("#sidebarMenu").insertBefore(folder_li, $('[data-folder="null"]'));

        renderFolderOption(selectedFolder);
        feather.replace();
      }
      createNavItem(newList);
      saveToStorage();
      const navLinksAll = $all(".sidebar__link");
      navLinksAll.forEach((link) => {
        if (link.getAttribute("href") === `#${newList.id}`) {
          link.classList.add("is-active");
        } else {
          link.classList.remove("is-active");
        }
      });
      console.table(todoLists);
      e.currentTarget.reset();
      $("#newListFormContainer").classList.remove("is-active");
      if ($("#transferTasksFormContainer").classList.contains("is-active")) {
        $(`input[name="list"][value=${newList.id}]`).checked = true;
      } else {
        displayList(newList);
      }
    }
  }

  function prepEditListForm(e) {
    // Attach folder options
    const btnUpdateList = $("#btnUpdateList");
    formEditList.insertBefore(fieldsetFolders, btnUpdateList);
    // Insert list name
    $("#editListNameInput").value = state.activeList.name;
    // Check radio for list folder
    $(
      `input[name="folder"][value="${state.activeList.folder}"]`
    ).checked = true;
    $("#editListFormContainer").classList.add("is-active");
  }

  function updateList(e) {
    e.preventDefault();
    const newListName = $("#editListNameInput").value;
    const checkedRadio = $('input[name="folder"]:checked').value;
    const selectedFolder =
      checkedRadio === "new" ? $("#newFolderInput").value : checkedRadio;
    const listNavLink = $(`a[href="#${state.activeList.id}"]`);
    const listNavItem = listNavLink.parentNode;
    // Rename list
    if (newListName !== "" && newListName !== state.activeList.name) {
      state.activeList.name = newListName;

      // Update list nav link
      listNavLink.textContent = newListName;
      $("#activeListTitle").textContent = newListName;
    }
    // Create new folder
    if (checkedRadio === "new" && selectedFolder !== "") {
      console.log({ selectedFolder });
      const ulFolderPanel = createNode("ul", {
        class: "accordion__panel",
        "data-folder": selectedFolder
      });
      const iFolderIcon = createNode("i", {
        "data-feather": "folder"
      });
      const folder_li = createNode(
        "li",
        {
          class: "sidebar__item accordion__item"
        },
        iFolderIcon,
        selectedFolder,
        ulFolderPanel
      );
      folder_li.addEventListener("click", displayPanel);
      $("#sidebarMenu").insertBefore(folder_li, $('[data-folder="null"]'));

      renderFolderOption(selectedFolder);
      feather.replace();
    }
    // Set different/new folder
    if (state.activeList.folder !== selectedFolder && selectedFolder !== "") {
      state.activeList.folder = selectedFolder;

      // Append list nav item to sidebar
      if (selectedFolder === "null") {
        listNavItem.className = "sidebar__item";
        listNavItem.dataset.folder = "null";
        $("#sidebarMenu").appendChild(listNavItem);
      } else {
        // Append list nav item to different/new folder
        console.log({ selectedFolder });
        listNavItem.className = "accordion__sub-item";
        listNavItem.removeAttribute("data-folder");
        $(`[data-folder="${selectedFolder}"]`).appendChild(listNavItem);
      }
    }
    // Save changes to storage
    saveToStorage();
    e.currentTarget.reset();
    $("#editListFormContainer").classList.remove("is-active");
  }

  function deleteList(listObj) {
    const listNavLink = $(`a[href="#${listObj.id}"]`);
    const listNavItem = listNavLink.parentNode;
    const listElement = $(`#${listObj.id}`);

    // Delete list object
    const listIndex = todoLists.indexOf(listObj);
    console.log({ listIndex });
    todoLists.splice(listIndex, 1);
    saveToStorage();

    // Delete list nav item
    listNavItem.remove();

    // Delete folder elements if list is the only item in folder
    const folder = listObj.folder;
    if (
      folder !== "null" &&
      todoLists.filter((list) => list.folder === "folder").length === 0
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
    const inbox = todoLists.find((list) => list.name === "Inbox");
    displayList(inbox);

    if ($("#alertWarningDeleteList").classList.contains("is-active")) {
      $("#alertWarningDeleteList").classList.remove("is-active");
    }
  }

  function displayList(listObj) {
    const ulActiveList = $(".is-active-list");
    if ($("#bulkActionsToolbar").classList.contains("is-active")) {
      $("#bulkActionsToolbar").classList.remove("is-active");
      ulActiveList.removeEventListener("click", enableBulkActions);
    }

    if ($("#main").classList.contains("show-search-results")) {
      $("#main").classList.remove("show-search-results");
    }

    $("#activeListTitle").textContent = listObj.name;
    const list_ul = $(`#${listObj.id}`);
    $all(".todo-list").forEach((x) => {
      if (x !== list_ul) {
        x.classList.remove("is-active-list");
      } else {
        x.classList.add("is-active-list");
      }
    });
    formAddTodo.classList.remove("is-hidden");
    populateList(listObj.tasks, list_ul);

    // Updates state
    state.activeList = listObj;
    state.filteredList = null;
  }

  function populateCalendarYears() {
    const date = new Date();
    const year = date.getFullYear();
    const frag = document.createDocumentFragment();
    // Adds current and next 2 years as radio options for year picker
    for (let i = 0; i <= 3; i++) {
      const yearRadio = createNode("input", {
        type: "radio",
        name: "year",
        value: `${year + i}`,
        id: `${year + i}`,
        class: "dp-calendar__radio"
      });
      frag.appendChild(yearRadio);
      const yearLabel = createNode(
        "label",
        {
          for: `${year + i}`,
          class: "dp-calendar__year"
        },
        `${year + i}`
      );
      frag.appendChild(yearLabel);
    }
    $("#dpCalendarYearDropdown").appendChild(frag);
  }

  populateCalendarYears();

  // Sets default month to current month

  function updateDateInput(dateComponent, ...newValues) {
    const currentDate = $("#inputDueDate").value; // `mm/dd/yy`
    const currentYear = currentDate.slice(6);
    const currentMonth = currentDate.slice(0, 2);
    const currentDay = currentDate.slice(3, 5);
    switch (dateComponent) {
      case "month":
        const monthNum = monthsArr.findIndex((x) => x.name === newValues[0]);
        $("#inputDueDate").value = `${
          monthNum > 8 ? monthNum + 1 : `0${monthNum + 1}`
        }/${currentDay}/${currentYear}`;
        break;
      case "day":
        $("#inputDueDate").value = `${currentMonth}/${
          newValues[0] > 9 ? newValues[0] : `0${newValues[0]}`
        }/${currentYear}`;
        break;
      case "year":
        $(
          "#inputDueDate"
        ).value = `${currentMonth}/${currentDay}/${newValues[0].slice(2)}`;
        break;
      case "all":
        const monthIndex = monthsArr.findIndex((x) => x.name === newValues[0]);
        $("#inputDueDate").value = `${
          monthIndex > 8 ? monthIndex + 1 : `0${monthIndex + 1}`
        }/${
          newValues[1] > 9 ? newValues[1] : `0${newValues[1]}`
        }/${newValues[2].slice(2)}`;
        break;
    }
  }

  function selectMonth(e) {
    if (!e.target.classList.contains("dp-calendar__month")) return;
    const currentDueDate = $("#inputDueDate").value; // mm-dd-yy
    const dueMonthIndex = +currentDueDate.slice(0, 2) - 1;
    const dueMonth = monthsArr[dueMonthIndex].name;
    const dueDay = +currentDueDate.slice(3, 5);

    const prevSelectedMonth = $('input[name="month"]:checked').value;
    const monthDropdown = $("#dpCalendarMonthDropdown");
    const btnToggleMonthDropdown = $("#btnToggleMonthDropdown");
    const radioId = e.target.getAttribute("for");
    const radio = $(`#${radioId}`);
    radio.checked = true;
    const selectedMonth = radio.value;
    if (selectedMonth !== prevSelectedMonth) {
      $("#btnToggleMonthDropdown .btn-text").textContent = selectedMonth;
      populateCalendarDays(selectedMonth);

      if (selectedMonth === dueMonth) {
        $(
          `.dp-calendar__btn--select-day[value="${dueDay}"][data-month="${selectedMonth}"]`
        ).classList.add("is-selected");
      }
    }
    btnToggleMonthDropdown.classList.remove("is-active");
    monthDropdown.classList.remove("is-active");
  }

  function selectYear(e) {
    if (!e.target.classList.contains("dp-calendar__year")) return;

    const currentDueDate = $("#inputDueDate").value; // mm-dd-yy
    const dueMonthIndex = +currentDueDate.slice(0, 2) - 1;
    const dueMonth = monthsArr[dueMonthIndex].name;
    const dueDay = +currentDueDate.slice(3, 5);
    const dueYear = `20${currentDueDate.slice(6)}`;

    const prevSelectedYear = $('input[name="year"]:checked').value;
    const btnToggleYearDropdown = $("#btnToggleYearDropdown");
    const yearDropdown = $("#dpCalendarYearDropdown");
    const radioId = e.target.getAttribute("for");
    const radio = $(`#${radioId}`);
    radio.checked = true;
    const selectedYear = radio.value;

    if (selectedYear !== prevSelectedYear) {
      $("#btnToggleYearDropdown .btn-text").textContent = selectedYear;
      populateCalendarDays(dueMonth);

      // Length of February depends on leap year
      if (selectedYear === dueYear) {
        $(
          `.dp-calendar__btn--select-day[value="${dueDay}"][data-month="${dueMonth}"]`
        ).classList.add("is-selected");
      }
    }
    btnToggleYearDropdown.classList.remove("is-active");
    yearDropdown.classList.remove("is-active");
  }

  function populateCalendarDays(monthStr) {
    while ($("#dpCalendar").contains($(".dp-calendar__day"))) {
      $(".dp-calendar__day").remove();
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

    if (monthStr === "February") {
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
          "button",
          {
            class: "dp-calendar__btn--select-day dp-calendar__btn--prev-month",
            type: "button",
            "data-month": prevMonth.name,
            "data-year": prevMonth.name === "December" ? +year - 1 : year,
            "data-action": "selectDay",
            value: j
          },
          `${j}`
        );
        const divDay = createNode(
          "div",
          {
            class: "dp-calendar__day dp-calendar__day--prev-month"
          },
          btnDay
        );
        frag.appendChild(divDay);
      }
    }

    for (let i = 1; i <= month.daysTotal; i++) {
      const btnDay = createNode(
        "button",
        {
          class: "dp-calendar__btn--select-day",
          type: "button",
          "data-month": month.name,
          "data-year": year,
          "data-action": "selectDay",
          "data-first": i === 1,
          "data-last": i === month.daysTotal,
          value: i
        },
        `${i}`
      );
      const divDay = createNode(
        "div",
        {
          class: "dp-calendar__day"
        },
        btnDay
      );
      frag.appendChild(divDay);
    }

    if (frag.children.length % 7 !== 0) {
      for (let k = 1; k < 7; k++) {
        const btnDay = createNode(
          "button",
          {
            class: "dp-calendar__btn--select-day dp-calendar__btn--next-month",
            type: "button",
            "data-month": nextMonth.name,
            "data-year": nextMonth.name === "January" ? +year + 1 : year,
            "data-action": "selectDay",
            value: k
          },
          `${k}`
        );
        const divDay = createNode(
          "div",
          {
            class: "dp-calendar__day dp-calendar__day--next-month"
          },
          btnDay
        );
        frag.appendChild(divDay);
        if (frag.children.length % 7 === 0) {
          break;
        }
      }
    }

    $("#dpCalendarDayPicker").appendChild(frag);
  }

  function selectDay(e) {
    const el = e.target;
    if (el.dataset.action !== "selectDay") return;

    $all(".dp-calendar__btn--select-day").forEach((x) => {
      if (x === el) {
        x.classList.add("is-selected");
      } else {
        x.classList.remove("is-selected");
      }
    });
    const selectedDay = el.value;
    const selectedMonth = el.dataset.month;
    const selectedYear = el.dataset.year;
    updateDateInput("all", selectedMonth, selectedDay, selectedYear);

    if (
      el.classList.contains("dp-calendar__btn--prev-month") ||
      el.classList.contains("dp-calendar__btn--next-month")
    ) {
      if (
        (el.classList.contains("dp-calendar__btn--prev-month") &&
          selectedMonth === "December") ||
        (el.classList.contains("dp-calendar__btn--next-month") &&
          selectedMonth === "January")
      ) {
        $(`input[name="year"][value="${selectedYear}"]`).checked = true;
        $("#btnToggleYearDropdown .btn-text").textContent = selectedYear;
      }

      $(`input[name="month"][value="${selectedMonth}"]`).checked = true;
      $("#btnToggleMonthDropdown .btn-text").textContent = selectedMonth;
      populateCalendarDays(selectedMonth);
      $(
        `.dp-calendar__btn--select-day[value="${selectedDay}"][data-month="${selectedMonth}"]`
      ).classList.add("is-selected");
    }
  }

  function setDueDate(e) {
    const id = $("#dpCalendar").parentNode.dataset.id;
    const currentTask = state.activeList.tasks.find((task) => task.id === id);

    const dueDate = $("#inputDueDate").value; // `mm/dd/yy`
    const dueYear = +`20${dueDate.slice(6)}`;
    const dueMonthIndex = +dueDate.slice(0, 2) - 1;
    const dueDay = +dueDate.slice(3, 5);
    const dueMonthAbbrev = monthsArr[dueMonthIndex].abbrev;

    const newDueDate = new Date(dueYear, dueMonthIndex, dueDay);

    if (new Date(currentTask.dueDate).valueOf() !== newDueDate.valueOf()) {
      currentTask.dueDate = newDueDate;
      saveToStorage();

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentDay = today.getDate();
      const currentMonthIndex = today.getMonth();
      const currentYear = today.getFullYear();
      const nextYear = currentYear + 1;
      const currentMonth = monthsArr[currentMonthIndex];
      const nextMonthIndex =
        currentMonth.name !== "December" ? currentMonthIndex + 1 : 0;

      if (currentMonth.name === "February") {
        currentMonth.daysTotal = isLeapYear(currentYear) ? 29 : 28;
      }

      const tomorrow =
        currentDay < currentMonth.daysTotal
          ? new Date(currentYear, currentMonthIndex, currentDay + 1)
          : nextMonthIndex !== 0
            ? new Date(currentYear, nextMonthIndex, 1)
            : new Date(nextYear, nextMonthIndex, 1);
      tomorrow.setHours(0, 0, 0, 0);

      const todoItem = $(`#${id}`);
      const dueDateLabel = todoItem.contains($(".badge--due-date"))
        ? $(".badge--due-date", todoItem)
        : createNode("span", { class: "badge--due-date is-hidden" });

      if (newDueDate.valueOf() === today.valueOf()) {
        dueDateLabel.textContent = "Today";
        dueDateLabel.classList.add("badge--today");
      } else if (newDueDate.valueOf() === tomorrow.valueOf()) {
        dueDateLabel.textContent = "Tomorrow";
        dueDateLabel.classList.add("badge--tomorrow");
      } else {
        dueDateLabel.textContent = `${dueMonthAbbrev} ${dueDay}`;
      }

      if (!todoItem.contains($(".badge--due-date"))) {
        todoItem.appendChild(dueDateLabel);
      }
    }

    $("#dueDateWrapper").classList.add("has-due-date");
    $(
      "#dueDateWrapper .due-date-text"
    ).textContent = `${dueMonthAbbrev} ${dueDay}`;
    $("#dueDateWrapper").classList.remove("show-input");
    $("#dpCalendar").classList.remove("is-active");
  }

  function closeModal(e) {
    if (!e.target.classList.contains("modal__btn--close")) return;
    e.currentTarget.classList.remove("is-active");
  }

  function closeTooltip(e) {
    if (!e.target.classList.contains("tooltip__btn--close")) return;
    e.currentTarget.classList.remove("show-tooltip");
    if (e.currentTarget.classList.contains('onboarding-tooltip')) {
      $('#onboarding').classList.add('is-active');
    }
  }

  function initDpCalendar(e) {
    if (e.currentTarget.classList.contains("show-input")) return;

    const id = $("#dpCalendar").parentNode.dataset.id;
    const currentTask = state.activeList.tasks.find((task) => task.id === id);

    if (currentTask.dueDate !== null) {
      const dueDate = new Date(currentTask.dueDate);
      // month index starts at 0
      const dueMonthIndex = dueDate.getMonth();
      const dueMonth = monthsArr[dueMonthIndex].name;
      const dueDay = dueDate.getDate();
      const dueYear = `${dueDate.getFullYear()}`;

      updateDateInput("all", dueMonth, dueDay, dueYear);

      $(`input[name="year"][value="${dueYear}"]`).checked = true;
      $("#btnToggleYearDropdown .btn-text").textContent = dueYear;
      $(`input[name="month"][value="${dueMonth}"]`).checked = true;
      $("#btnToggleMonthDropdown .btn-text").textContent = dueMonth;
      populateCalendarDays(dueMonth);
      $(
        `.dp-calendar__btn--select-day[value="${dueDay}"][data-month="${dueMonth}"]`
      ).classList.add("is-selected");
    } else {
      const now = new Date();
      const currentMonthNum = now.getMonth();
      const currentMonth = monthsArr[currentMonthNum];
      const currentYear = `${now.getFullYear()}`;
      const currentDay = now.getDate();
      updateDateInput("all", currentMonth.name, currentDay, currentYear);

      // Set default month to current month
      $(
        `#dpCalendarMonthDropdown input[value="${currentMonth.name}"]`
      ).checked = true;
      $("#btnToggleMonthDropdown .btn-text").textContent = currentMonth.name;

      // Sets default year to current year
      $(`#dpCalendarYearDropdown input[value="${currentYear}"]`).checked = true;
      $("#btnToggleYearDropdown .btn-text").textContent = currentYear;
      populateCalendarDays(currentMonth.name);
      $(
        `.dp-calendar__btn--select-day[value="${currentDay}"][data-month="${
          currentMonth.name
        }"]`
      ).classList.add("is-selected");
    }
  }

  function expandSearchBar(e) {
    e.stopPropagation();
    if (e.target === searchInput) return;
    if (!searchBar.classList.contains("is-expanded")) {
      e.preventDefault();
      searchBar.classList.add("is-expanded");
      $("#searchInput").focus();
    } else if (
      searchBar.classList.contains("is-expanded") &&
      searchInput.value == ""
    ) {
      searchBar.classList.remove("is-expanded");
    }
  }

  // Disables/Enables bulk action buttons, depending on if items are checked
  function enableBulkActions(e) {
    const ulActiveList = $(".is-active-list");
    const checkedItems = $all(".bulk-actions__checkbox:checked", ulActiveList);
    const bulkActions = $all('.toolbar__btn[data-bulk-action="true"]');
    if (checkedItems.length === 0) {
      // Disable bulk actions buttons
      bulkActions.forEach((btn) => (btn.disabled = true));
    } else {
      bulkActions.forEach((btn) => (btn.disabled = false));
    }
  }

  function openBulkEditing(e) {
    // Hide add todo form
    $("#addTodoForm").classList.add("is-hidden");
    // Uncheck master bulk editing checkbox
    $("#masterCheckbox").checked = false;
    // Reveal bulk editing toolbar
    $("#bulkActionsToolbar").classList.add("is-active");
    // Add bulk-editing checkboxes and hide regular checkboxes for toggling completeness
    const ulActiveList = $(".is-active-list");
    $all(".todo-list__item", ulActiveList).forEach((x, i) => {
      const frag = document.createDocumentFragment();
      const checkbox = createNode("input", {
        type: "checkbox",
        id: `bulk-item-${i}`,
        "data-index": i,
        "data-id": x.id,
        class: "bulk-actions__checkbox"
      });
      const checkboxLabel = createNode("label", {
        class: "bulk-actions__checkbox-label",
        for: `bulk-item-${i}`
      });
      frag.appendChild(checkbox);
      frag.appendChild(checkboxLabel);
      x.insertBefore(frag, $('input[type="checkbox"]', x));
      $(".todo-list__checkbox", x).classList.add("is-hidden");
      $(".todo-item__toggle-btn", x).classList.add("is-hidden");
      x.classList.add('bulk-editing-list__item');
    });
    // Disable bulk action buttons
    $all('.toolbar__btn[data-bulk-action="true"]').forEach(
      (btn) => (btn.disabled = true)
    );
    ulActiveList.addEventListener("click", enableBulkActions);
  }

  function transferTasks(e) {
    e.preventDefault();
    const ulActiveList = $(".is-active-list");
    const currentTasksList =
      state.filteredList === null ? state.activeList.tasks : state.filteredList;
    const checkedItems = $all(".bulk-actions__checkbox:checked", ulActiveList);
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

    // Reload current list to reflect changes
    renderList(currentTasksList, ulActiveList);
    $("#transferTasksFormContainer").classList.remove("is-active");
  }

  function deleteSelected(e) {
    e.preventDefault();
    const ulActiveList = $(".is-active-list");
    const currentTasksList =
      state.filteredList === null ? state.activeList.tasks : state.filteredList;
    const checkedItems = $all(".bulk-actions__checkbox:checked", ulActiveList);
    checkedItems.forEach((item) => {
      listObj = getListByTaskId(item.dataset.id);
      deleteTask(listObj, item.dataset.id);
    });
    renderList(currentTasksList, ulActiveList);
  }

  // Hides certain elements if you click outside of them
  function hideComponents(e) {
    if (
      colorPicker.classList.contains("is-visible") &&
      e.target !== $("#btnAddTag") &&
      e.target !== colorPicker &&
      !colorPicker.contains(e.target)
    ) {
      colorPicker.classList.remove("is-visible");
      formEditTodo.appendChild(colorPicker);
    }

    // Hides tooltip
    if (
      divTodoApp.contains($(".tag-labels__btn--tooltip.show-tooltip")) &&
      e.target !== $(".tag-labels__btn--tooltip.show-tooltip")
    ) {
      $(".tag-labels__btn--tooltip.show-tooltip").classList.remove("show-tooltip");
    }

    const monthDropdown = $("#dpCalendarMonthDropdown");
    const btnToggleMonthDropdown = $("#btnToggleMonthDropdown");
    const yearDropdown = $("#dpCalendarYearDropdown");
    const btnToggleYearDropdown = $("#btnToggleYearDropdown");

    // Hides monthDropdown
    if (
      monthDropdown.classList.contains("is-active") &&
      e.target !== monthDropdown &&
      e.target !== btnToggleMonthDropdown &&
      !monthDropdown.contains(e.target)
    ) {
      monthDropdown.classList.remove("is-active");
      btnToggleMonthDropdown.classList.remove("is-active");
    }

    // Hides yearDropdown
    if (
      yearDropdown.classList.contains("is-active") &&
      e.target !== yearDropdown &&
      e.target !== btnToggleYearDropdown &&
      !yearDropdown.contains(e.target)
    ) {
      yearDropdown.classList.remove("is-active");
      btnToggleYearDropdown.classList.remove("is-active");
    }

    // Hides searchBar input
    if (
      searchBar.classList.contains("is-expanded") &&
      ((searchInput.value === "" &&
        e.target !== searchBar &&
        !searchBar.contains(e.target)) ||
        e.target.classList.contains("sidebar__link") ||
        e.target.classList.contains("filtered-list__link")) ||
        e.target.classList.contains('breadcrumbs__link')
    ) {
      formSearch.reset();
      inputSearch.blur();
      searchBar.classList.remove("is-expanded");
    }

    // Hides listActions
    const listActionsWrapper = $("#listActionsWrapper");
    if (
      listActionsWrapper.classList.contains("show-actions") &&
      e.target !== listActionsWrapper &&
      !listActionsWrapper.contains(e.target)
    ) {
      listActionsWrapper.classList.remove("show-actions");
    }
  }

  function continueTour(e) {
    console.log(state.nextOnboardingStep);
    const stepOne = $('#onboardingStep1');
    const stepTwo = $('#onboardingStep2');
    const stepThree = $('#onboardingStep3');
    const stepFour = $('#onboardingStep4');
    const sideNav = $('#sideNav');
    const btnOpenNav = $('#toggleOpenBtn');
    switch (state.nextOnboardingStep) {
      case 1:
        if (stepOne.classList.contains('show-tooltip')) {
          stepOne.classList.remove('show-tooltip');
          state.nextOnboardingStep++;
        };
        formAddTodo.removeEventListener('input', continueTour);
        break;
      case 2:
      setTimeout(() => {
        const firstTask = $('.is-active-list .todo-list__item');
        const btnToggleEditTask = $('.todo-item__toggle-btn', firstTask);
        firstTask.insertBefore(stepTwo, btnToggleEditTask);
        stepTwo.classList.add('show-tooltip');
        }, 100);
        formAddTodo.removeEventListener('submit', continueTour);
        break;
      case 3:
          stepThree.classList.add('tooltip--right');
          stepThree.classList.remove('tooltip--bottom');
          $('#toggleOpenBtn').removeEventListener('click', continueTour);
          $('#toggleCloseBtn').addEventListener('click', continueTour);
          if (e.target.classList.contains('sidebar__btn--toggle-close')) {
            if (stepThree.classList.contains('show-tooltip')) {
              stepThree.classList.remove('show-tooltip');
              state.nextOnboardingStep++;
              $('#toggleCloseBtn').removeEventListener('click', continueTour);
            }
          }
        break;
    }
  }

  function navigateTour(e) {
    const el = e.target;
    if (!el.classList.contains('onboarding__btn')) return;
    const modal = e.currentTarget;
    const action = el.dataset.action;

    if (action === "beginTour") {
      $('.onboarding__footer', modal).classList.add('is-active');
    }

    if (action === "activateGuide") {
      let activeStep = $('.onboarding__step.is-active');
      let stepNum = activeStep.dataset.onboardingStep;
      $(`.onboarding-tooltip[data-onboarding-step="${stepNum}"`).classList.add('show-tooltip');
      modal.classList.remove('is-active');
    } else {
      state.nextOnboardingStep++;
      $all('.onboarding__step').forEach(section => {
        let step = +section.dataset.onboardingStep;
        if (step === state.nextOnboardingStep) {
          section.classList.add('is-active');
        } else {
          section.classList.remove('is-active');
        }
      });

    }
  }

  // Event Listeners

  $all('.onboarding-tooltip').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('onboarding-step__btn')) return;
      const action = e.target.dataset.action;
      const stepNum = e.currentTarget.dataset.onboardingStep;
      if (action === "endTour" || stepNum === "4") {
        state.nextOnboardingStep = null;
        e.currentTarget.classList.remove('show-tooltip');
        formAddTodo.removeEventListener('submit', continueTour);
      } else if (action === "continueTour") {
        state.nextOnboardingStep++;
       e.currentTarget.classList.remove('show-tooltip');
        console.log({stepNum});
        if (stepNum === "2") {
          const sideNav = $('#sideNav');
        const btnOpenNav = $('#toggleOpenBtn');
        const stepThree = $('#onboardingStep3');
        sideNav.insertBefore(stepThree, btnOpenNav);
        stepThree.classList.add('show-tooltip');
        btnOpenNav.addEventListener('click', continueTour);
        }
      }
    });
  });

  formAddTodo.addEventListener('input', continueTour);
  formAddTodo.addEventListener('submit', continueTour);

  $('#onboarding').addEventListener('click', navigateTour);

  $("#transferTasksForm").addEventListener("submit", transferTasks);

  $("#newListInput").addEventListener("click", (e) => {
    $('input[id="listNew"]').checked = true;
  });

  $("#bulkActionsToolbar").addEventListener("click", (e) => {
    const el = e.target;
    const ulActiveList = $(".is-active-list");
    const currentListObj = state.activeList;
    const currentTasksList =
      state.filteredList === null ? state.activeList.tasks : state.filteredList;
    if (el.dataset.action === "transferSelected") {
      $("#transferTasksFormContainer").classList.add("is-active");
    } else if (el.dataset.action === "deleteSelected") {
      deleteSelected(e);
    } else if (el.dataset.action === "closeBulkActionsToolbar") {
      $("#bulkActionsToolbar").classList.remove("is-active");
      ulActiveList.removeEventListener("click", enableBulkActions);
      renderList(currentTasksList, ulActiveList);
      $("#addTodoForm").classList.remove("is-hidden");
    }
  });

  $("#masterCheckbox").addEventListener("change", (e) => {
    const checkedState = e.currentTarget.checked;
    const ulActiveList = $(".is-active-list");
    $all(".bulk-actions__checkbox", ulActiveList).forEach(
      (x) => (x.checked = checkedState)
    );
  });

  $("#btnDeleteList").addEventListener("click", (e) => {
    deleteList(state.activeList);
  });
  formEditList.addEventListener("submit", updateList);

  $("#listActionsWrapper").addEventListener("click", (e) => {
    if (!e.target.classList.contains("more-actions__item")) return;

    const action = e.target.dataset.action;

    switch (action) {
      case "editList":
        prepEditListForm(e);
        break;
      case "openBulkEditing":
        openBulkEditing(e);
        break;
      case "clearAll":
        $("#alertWarningClearAll").classList.add("is-active");
        break;
      case "deleteList":
        $("#alertWarningDeleteList .list-name").textContent =
          state.activeList.name;
        $("#alertWarningDeleteList").classList.add("is-active");
        break;
    }
    e.currentTarget.classList.remove("show-actions");
  });

  $("#clearAllBtn").addEventListener("click", clearAll);

  $all(".more-actions__btn--toggle").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const moreActionsWrapper = e.currentTarget.parentNode;
      if (btn.classList.contains("list-actions__btn--toggle")) {
        // Prevents todoContent from being deleted if attached to list item
        if (todoContent.classList.contains("is-visible")) {
          todoContent.classList.remove("is-visible");
          divTodoApp.appendChild(todoContent);
        }

        $all('button[data-required="custom-list"]', moreActionsWrapper).forEach((item) => {
            if (
              state.activeList === null ||
              state.activeList.name === "Inbox"
            ) {
              item.disabled = true;
            } else {
              item.disabled = false;
            }
          }
        );
      }
      moreActionsWrapper.classList.toggle("show-actions");
    });
  });

  searchBar.addEventListener("click", expandSearchBar);

  $("#btnAddTag").addEventListener("click", addTag);

  document.querySelectorAll(".sidebar__btn--toggle").forEach((btn) => {
    btn.addEventListener("click", toggleMenu, true);
  });
  divViews.addEventListener("click", updateView);
  formAddTodo.addEventListener("submit", addTodo);
  ulInbox.addEventListener("click", toggleDone);
  $("#filteredList").addEventListener("click", toggleDone);
  ulSubtasks.addEventListener("click", toggleComplete);
  formEditTodo.addEventListener("submit", addSubtask);
  $("#btnAddSubtask").addEventListener("click", addSubtask);
  colorPicker.addEventListener("click", setTagColor);

  formEditTodo.addEventListener("keyup", (e) => {
    if (e.keyCode === ENTER_KEY) {
      if (e.target === $("#newSubtaskInput")) {
        addSubtask(e);
      }
      if (e.target === $("#newTagInput")) {
        addTag(e);
      }
    }
  });

  $("#todoItemNote").addEventListener("change", addNote);
  formEditTodo.addEventListener("change", editSubtask);

  // Delete tag on double backspace
  formEditTodo.addEventListener("keyup", (e) => {
    const newTagInput = $("#newTagInput");
    if (e.target !== newTagInput) return;
    const id = e.currentTarget.dataset.id;
    const todoIndex = state.activeList.tasks.findIndex(
      (task) => task.id === id
    );
    const currentTask = state.activeList.tasks.find((task) => task.id === id);
    if (currentTask.tags.length > 0) {
      const lastIndex = currentTask.tags.length - 1;
      const lastTag = formEditTodo.querySelectorAll("#tagsContainer .tag")[
        lastIndex
      ];
      const lastTagBtn = lastTag.querySelector(".close-icon");
      if (e.keyCode === BACKSPACE_KEY && !newTagInput.value) {
        lastTag.classList.add("is-focused");
        // Removes tag when backspace key is hit consecutively
        setTimeout(() => {
          lastTagBtn.value = "true";
        }, 10);
        if (lastTagBtn.value === "true") {
          if (lastTag.contains(colorPicker)) {
            formEditTodo.appendChild(colorPicker);
            colorPicker.classList.remove("is-visible");
          }
          removeTag(todoIndex, lastIndex);
          lastTag.classList.remove("is-focused");
        }
        lastTagBtn.value = "false";
      } else if (e.keyCode !== BACKSPACE_KEY) {
        lastTag.classList.remove("is-focused");
        lastTagBtn.value = "false";
      }
    }
  });

  formSearch.addEventListener("submit", filterTasks);

  inputSearch.addEventListener("click", (e) => e.currentTarget.select());

  document.body.addEventListener(clickTouch(), hideComponents);

  $all("[data-action='openListForm']").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (document.documentElement.clientWidth < 768) {
        $("#siteWrapper").classList.remove("show-nav");
      }
      if (!formNewList.contains(fieldsetFolders)) {
        formNewList.insertBefore(fieldsetFolders, $("#addListBtn"));
      }
      $("#newListFormContainer").classList.add("is-active");
      window.setTimeout(() => {
        $("#newListNameInput").focus();
      }, 200);
    });
  });

  formNewList.addEventListener("submit", addList);
  inputNewFolder.addEventListener("click", (e) => {
    const newFolderRadio = $('input[id="folderNew"]');
    newFolderRadio.checked = true;
  });

  $all(".modal").forEach((modal) =>
    modal.addEventListener("click", closeModal)
  );

  $all('.tooltip').forEach(tooltip => tooltip.addEventListener('click', closeTooltip));

  $all(".dp-calendar__toggle-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.currentTarget.nextElementSibling.classList.toggle("is-active");
      e.currentTarget.classList.toggle("is-active");
    });
  });

  $all(".dp-calendar__dropdown").forEach((x) => {
    if (x.dataset.name === "month") {
      x.addEventListener("click", selectMonth);
    } else if (x.dataset.name == "year") {
      x.addEventListener("click", selectYear);
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
        : "December";
    const nextMonth =
      selectedMonthIndex !== 11
        ? monthsArr[selectedMonthIndex + 1].name
        : "January";
    const currentDueDate = $("#inputDueDate").value; // mm/dd/yy
    const dueMonthIndex = +currentDueDate.slice(0, 2) - 1;
    const dueMonth = monthsArr[dueMonthIndex].name;
    const dueDay = +currentDueDate.slice(3, 5);
    const dueYear = `20${currentDueDate.slice(6)}`;
    console.log({ dueDay });

    if (action === "selectNextMonth") {
      if (nextMonth === "January") {
        const nextYear = +selectedYear + 1;
        $(`input[value="${nextYear}"]`).checked = true;
        $("#btnToggleYearDropdown .btn-text").textContent = nextYear;
      }
      $(`input[value="${nextMonth}"]`).checked = true;
      $("#btnToggleMonthDropdown .btn-text").textContent = nextMonth;
      populateCalendarDays(nextMonth);
      if (nextMonth === dueMonth && selectedYear === dueYear) {
        $(
          `.dp-calendar__btn--select-day[value="${dueDay}"][data-month="${dueMonth}"]`
        ).classList.add("is-selected");
      }
    }

    if (action === "selectPrevMonth") {
      if (prevMonth === "December") {
        const prevYear = +selectedYear - 1;
        $(`input[value="${prevYear}"]`).checked = true;
        $("#btnToggleYearDropdown .btn-text").textContent = prevYear;
      }
      $(`input[value="${prevMonth}"]`).checked = true;
      $("#btnToggleMonthDropdown .btn-text").textContent = prevMonth;
      populateCalendarDays(prevMonth);
      if (prevMonth === dueMonth && selectedYear === dueYear) {
        console.log({ selectedYear });
        $(
          `.dp-calendar__btn--select-day[value="${dueDay}"][data-month="${dueMonth}"]`
        ).classList.add("is-selected");
      }
    }
  }
  // Select previous or next month on click
  $all(".dp-calendar__btn-prevnext").forEach((x) =>
    x.addEventListener("click", selectPrevNext)
  );

  $("#dpCalendarDayPicker").addEventListener("click", selectDay);
  $("#btnSetDueDate").addEventListener("click", setDueDate);

  $("#dueDateWrapper").addEventListener("click", (e) => {
    initDpCalendar(e);
    e.currentTarget.classList.add("show-input");
    $("#dpCalendar").classList.add("is-active");
  });

  $("#inputDueDate").addEventListener("change", (e) => {
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
      const dateStr = $("#inputDueDate").value; // mm/dd/yy
      console.log({ dateStr });

      const selectedDay = $(".dp-calendar__btn--select-day.is-selected");
      const year = `20${dateStr.slice(6)}`;
      console.log({ year });
      const monthNum = +dateStr.slice(0, 2) - 1;
      const month = monthsArr[monthNum];
      const monthText = month.name;
      if (monthText === "February") {
        month.daysTotal = isLeapYear(+year) ? 29 : 28;
      }

      const lastDay = month.daysTotal;
      const day =
        +dateStr.slice(3, 5) > lastDay
          ? (updateDateInput("day", lastDay), lastDay)
          : +dateStr.slice(3, 5);

      console.log({ day });

      if ($(`input[name="year"]:checked`).value !== year) {
        $(`input[value="${year}"]`).checked = true;
        $("#btnToggleYearDropdown .btn-text").textContent = year;
        populateCalendarDays(monthText);
        $(
          `.dp-calendar__btn--select-day[value="${day}"][data-month="${monthText}"]`
        ).classList.add("is-selected");
      }

      if ($(`input[name="month"]:checked`).value !== monthText) {
        $(`input[value="${monthText}"]`).checked = true;
        $("#btnToggleMonthDropdown .btn-text").textContent = monthText;
        populateCalendarDays(monthText);
      }

      if (selectedDay && selectedDay.value !== day) {
        $all(".dp-calendar__btn--select-day").forEach((x) => {
          if (
            x.value == day &&
            !x.classList.contains("dp-calendar__btn--prev-month") &&
            !x.classList.contains("dp-calendar__btn--next-month")
          ) {
            x.classList.add("is-selected");
          } else {
            x.classList.remove("is-selected");
          }
        });
      }
    }
  });

  $("#todayNavLink").addEventListener("click", (e) => {
    e.preventDefault(); 
    displayTaskSchedule('today', $("#today"));
  });

  $("#upcomingNavLink").addEventListener("click", (e) => {
    e.preventDefault();
    displayTaskSchedule('upcoming', $('#upcoming'));
  });

  $("#btnClearDueDate").addEventListener("click", (e) => {
    const id = $("#dpCalendar").parentNode.dataset.id;
    const currentTask = state.activeList.tasks.find((task) => task.id === id);
    currentTask.dueDate = null;
    saveToStorage();
    $("#dueDateWrapper").classList.remove("has-due-date");
    $("#dueDateWrapper .due-date-text").textContent = "Set due date";
    $("#dueDateWrapper").classList.remove("show-input");
    $("#dpCalendar").classList.remove("is-active");
  });

  $("#btnResetDueDate").addEventListener("click", (e) => {
    $("#dueDateWrapper").classList.remove("show-input");
    $("#dpCalendar").classList.remove("is-active");
  });

  $all(".form__input--inline").forEach((x) => {
    x.addEventListener("focus", (e) => {
      e.currentTarget.parentNode.classList.add("is-focused");
    });
    x.addEventListener("focusout", (e) => {
      e.currentTarget.parentNode.classList.remove("is-focused");
    });
  });

  $("#todoItemNote").addEventListener("input", () => {
    autoHeightResize(e.currentTarget);
  });

  $("#btnTriggerWarningDeleteTask").addEventListener("click", (e) => {
    const taskId = e.currentTarget.parentNode.dataset.id;
    const currentTask = state.activeList.getTask(taskId);
    $("#alertWarningDeleteTask .task-text").textContent = currentTask.text;
    $("#alertWarningDeleteTask").classList.add("is-active");
  });

  $("#btnDeleteTask").addEventListener("click", (e) => {
    const taskId = formEditTodo.dataset.id;
    deleteTask(state.activeList, taskId);
  });
})();
