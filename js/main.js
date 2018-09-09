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

  // Variables
  const divTodoApp = $("#todoApp");
  const formAddTodo = $("#addTodoForm");
  const formEditTodo = $("#editTodoForm");
  const formSearch = $("#searchForm");
  const searchBar = $('#searchBar');
  const inputSearch = $("#searchInput");
  const ulInbox = $("#inbox");
  const ulSubtasks = $("#subtaskList");
  const divViews = $("#views");
  const btnClearAll = $("#clearAllBtn");
  const colorPicker = $("#colorPicker");
  const formNewList = $("#newListForm");
  const fieldsetFolders = $('#fieldsetFolders');
  const formEditList = $('#editListForm');
  const inputNewFolder = $("#newFolderInput");
  const todoContent = $("#todoContent");
  const todoLists = JSON.parse(localStorage.getItem("todoLists")) || [];

  const BACKSPACE_KEY = 8;
  const ENTER_KEY = 13;
  const state = {
    activeList: null,
    filteredList: null
  };

  let now = new Date();
  let currentDate = now.getDate();
  let currentYear = now.getFullYear();

  const isLeapYear = year => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  };

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

  // Generates unique ID string, used for identifying todo items.
  const uniqueID = () => +Date.now() + Math.random().toString(36).slice(2);

  const camelCased = (text) => {
    return text
      .trim()
      .replace(/[^A-Za-z0-9 ]/g, "")
      .split(" ")
      .map((str, i) => (i === 0 ? str.toLowerCase() : str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()))
      .join("");
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
  const createNode = (tagName, attributes, ...children) => {
    const node = document.createElement(tagName);

    Object.keys(attributes).forEach((key) => {
      if (key === "class") {
        const classes = attributes[key].split(" ");
        classes.forEach(x => node.classList.add(x));
      } else if (/^data-/.test(key)) {
        const dataProp = key
          .slice(5) // removes `data-`
          .split("-")
          .map((str, i) => {
            return i === 0
              ? str
              : str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
          })
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

  class List {
    constructor(name, folder) {
      this.name = name;
      this.folder = folder;
      this.id = `${camelCased(name)}-${Date.now()}`;
      this.tasks = [];
    }
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

  if (todoLists.find(list => list.name === "Inbox") === undefined) {
    const initInbox = new List("Inbox", "null");
    todoLists.push(initInbox);
    console.table(todoLists);
    localStorage.setItem("todoLists", JSON.stringify(todoLists));
  }

  const inbox = todoLists.find(list => list.name === "Inbox");
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

    const activeList_ul = $('.is-active-list');
    
    let text = $("#todoInput").value;
    if (text !== "") {
      let todo = new Task(text);
      state.activeList.tasks.unshift(todo); // Add new item to top of the list
      localStorage.setItem("todoLists", JSON.stringify(todoLists));
      populateList(state.activeList.tasks, activeList_ul);
    }
    // Resets addTodoForm
    e.currentTarget.reset();
  }

  // Renders todo objects as list items
  function populateList(itemsArray = [], itemsList) {
    // Prevents todoContent from being deleted if attached to list item
    if (todoContent.classList.contains('is-visible')) {
      todoContent.classList.remove('is-visible');
      divTodoApp.appendChild(todoContent);
    }
    itemsList.innerHTML = itemsArray
      .map((item, i) => {
        return `<li class= ${
          item.done ? "todo-list__item is-done" : "todo-list__item"
        } data-index="${i}" id="${item.id}">
<input type="checkbox" id="item-${i}" data-index="${i}" value="${
          item.text
        }" ${item.done ? "checked" : ""} />
<label for ="item-${i}" class="todo-list__checkbox"></label>
<input type="text" class="form__input todo-item__title" data-index="${i}" data-id="${
          item.id
        }" value="${item.text}" />
<button type="button" class="btn todo-item__btn--neutral todo-item__toggle-btn" data-action="toggleContent"></button>
</li>`;
      })
      .join("");

    const itemsCollection = itemsList.getElementsByTagName("li");

    // Adds event listeners to each list item
    for (let i = 0; i < itemsCollection.length; i++) {
      itemsCollection[i].addEventListener("click", toggleContent);
      if (state.filteredList !== null) {
        itemsCollection[i].addEventListener(
          "click",
          e => {
            let id = e.currentTarget.id;
            state.activeList = getList(id);
          },
          false
        );
      }
      let itemTitle = $(".todo-item__title", itemsCollection[i]);
      itemTitle.addEventListener("click", e => {
        let id = e.currentTarget.dataset.id;
        state.activeList = getList(id);
      });
      itemTitle.addEventListener("input", renameTodo);

      // Creates tag labels for each todo item, if any
      let id = itemsCollection[i].id;
      for (let j = 0; j < itemsArray.length; j++) {
        if (id === itemsArray[j].id && itemsArray[j].dueDate !== null) {
          let dueDate = new Date(itemsArray[j].dueDate);
          let dueMonthIndex = dueDate.getMonth();
          let dueMonthAbbrev = monthsArr[dueMonthIndex].abbrev;
          let dueDay = dueDate.getDate();
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const currentDay = today.getDate();
          const currentMonthIndex = today.getMonth();
          const currentYear = today.getFullYear();
          const nextYear = currentYear + 1;
          const currentMonth = monthsArr[currentMonthIndex];
          const nextMonthIndex = currentMonth.name !== "December" ? currentMonthIndex + 1 : 0;
          if (currentMonth.name === 'February') {
            currentMonth.daysTotal = isLeapYear(currentYear) ? 29 : 28;
          }
          if (currentDay === currentMonth.daysTotal) {

          }
          const tomorrow = (currentDay < currentMonth.daysTotal) ? new Date(currentYear, currentMonthIndex, currentDay + 1)
          : (nextMonthIndex !== 0 ) ? new Date(currentYear, nextMonthIndex, 1) : new Date(nextYear, nextMonthIndex, 1);
          tomorrow.setHours(0, 0, 0, 0);
          
          const dueDateLabel = createNode("span", {class: 'badge--due-date'});
         
          if (dueDate.valueOf() === today.valueOf()) {
            dueDateLabel.textContent = "Today";
            dueDateLabel.classList.add('badge--today');
          } else if (dueDate.valueOf() === tomorrow.valueOf()) {
            dueDateLabel.textContent = "Tomorrow";
            dueDateLabel.classList.add('badge--tomorrow');
          } else {
            dueDateLabel.textContent = `${dueMonthAbbrev} ${dueDay}`;
          }
          itemsCollection[i].appendChild(dueDateLabel);
        }
        if (id === itemsArray[j].id && itemsArray[j].tags.length > 0) {
          let tagLabels =
            $(".todo-item__tag-labels", itemsCollection[i]) ||
            createNode("div", {
              class: "todo-item__tag-labels"
            });
          let tagsTooltipBtn =
            tagLabels.querySelector(".todo-item__tooltip-btn") ||
            createNode(
              "button",
              {
                class: "btn todo-item__tooltip-btn tooltip__btn--tags",
                "data-tooltip": "",
                type: "button"
              },
              "..."
            );
          tagsTooltipBtn.dataset.tooltip = itemsArray[j].tags
            .map(tag => tag.text)
            .join(", ");
          tagsTooltipBtn.addEventListener("click", e => {
            e.currentTarget.classList.toggle("show-tooltip");
          });
          if (!tagLabels.contains(tagsTooltipBtn)) {
            tagLabels.appendChild(tagsTooltipBtn);
          }

          // Renders tag labels
          itemsArray[j].tags.forEach((tag, i) => {
            let tagLabel = createNode(
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

    let el = e.target;
    if (!el.classList.contains("todo-list__checkbox") || el.classList.contains('bulk-editing__checkbox')) return;

    let id = el.parentNode.id; // ID of list item
    if (state.activeList === null) {
      state.activeList = getList(id);
    }

    const activeList_ul = $(".is-active-list");
    let index = state.activeList.tasks.findIndex(task => task.id === id);
    let currentTask = state.activeList.tasks.find(task => task.id === id);
    const indexLastCompleted = state.activeList.tasks.findIndex(
      item => item.done === true
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

    localStorage.setItem("todoLists", JSON.stringify(todoLists));
    todoContent.classList.remove("is-visible");
    divTodoApp.appendChild(todoContent);
    let currentTasksList =
      state.filteredList === null ? state.activeList.tasks : state.filteredList;
    let activeTodos = currentTasksList.filter(task => !task.done);
    let completedTodos = currentTasksList.filter(task => task.done);
    let action = divViews.querySelector(".is-selected").dataset.action;
    if (action === "viewActive") {
      populateList(activeTodos, activeList_ul);
    } else if (action === "viewCompleted") {
      populateList(completedTodos, activeList_ul);
    } else {
      populateList(currentTasksList, activeList_ul);
    }
    console.table(todoLists);
  }

  // Updates subtask object's `done` property to reflect current `checked` state
  function toggleComplete(e) {
    if (!e.target.classList.contains("subtask-list__checkbox")) return;
    let id = formEditTodo.dataset.id;
    let todoIndex = state.activeList.tasks.findIndex(task => task.id === id);
    let currentTask = state.activeList.tasks.find(task => task.id === id);
    let subtaskIndex = e.target.dataset.subIndex;
    currentTask.subtasks[subtaskIndex].done = !currentTask.subtasks[
      subtaskIndex
    ].done;
    localStorage.setItem("todoLists", JSON.stringify(todoLists));
    populateSubList(state.activeList.tasks, "subtasks", ulSubtasks, todoIndex);
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
    let allLists = $all(".todo-list");
    allLists.forEach(list => {
      if (list.id !== "inbox") {
        list.remove();
      }
    });
    ulSubtasks.innerHTML = ""; // Deletes all ulSubtasks items from DOM
    formEditTodo.reset();
    $all("[data-folder]").forEach(item => item.remove());
    $all('input[name="folder"]').forEach(item => {
      if (item.value !== "null" && item.value !== "new") {
        item.remove();
      }
    });
    $all(".form__label--folder").forEach(item => {
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
  function populateSubList(itemsArray = [], prop, itemsList, k) {
    itemsList.innerHTML = itemsArray[k][prop]
      .map((subitem, i) => {
        return `<li class="subtask-list__item">
<input type="checkbox" id="i${k}--${i}" name="i${k}--${i}" data-index="${k}" data-sub-index="${i}" class="subtask-list__checkbox" ${
          subitem.done ? "checked" : ""
        } />
<label for="i${k}--${i}" class="subtask-list__checkbox" data-index="${k}" data-sub-index="${i}"></label>
<input type="text" class="form__input edit-todo-form__input--edit-subtask" data-index="${k}" data-sub-index=${i} value="${
          subitem.text
        }" />
</li>`;
      })
      .join("");
  }

  /**
   * Adds subtask
   */
  function addSubtask(e) {
    
    e.preventDefault();
   
    if (e.target.dataset.action !== "addSubtask") return;
    let id = formEditTodo.dataset.id;

    let currentTask = state.activeList.tasks.find(task => task.id === id);
    let todoIndex = state.activeList.tasks.findIndex(task => task.id === id); // index of todo object with matching ID in TODOS array
    let currentList = state.activeList;

    let text = $('#newSubtaskInput').value;
    if (text) {
      const newSubtask = new Subtask(text);
      currentTask.subtasks.push(newSubtask);
      populateSubList(currentList.tasks, "subtasks", ulSubtasks, todoIndex);
      localStorage.setItem("todoLists", JSON.stringify(todoLists));
      $('#newSubtaskInput').value = "";
    }
  }

  /**
   * Adds note
   */
  function addNote(e) {
    if (!e.target.classList.contains("todo-item__note")) return;
    const id = formEditTodo.dataset.id;

    let currentTask = state.activeList.tasks.find(task => task.id === id);
    let todoIndex = state.activeList.tasks.findIndex(task => task.id === id); // index of todo object with matching ID in TODOS array

    console.log(currentTask.note);
    let text = e.target.value;
    if (!/^\s+$/.test(text)) {
      currentTask.note = text;
      localStorage.setItem("todoLists", JSON.stringify(todoLists));
    }
  }

  function autoHeightResize() {
    const todoItemNote = $('#todoItemNote');
    todoItemNote.style.height = "0px";
    todoItemNote.style.height = todoItemNote.scrollHeight + "px";
  }

  function renameTodo(e) {
    if (!e.target.classList.contains("todo-item__title")) return;
    let id = e.target.dataset.id;

    let currentTask = state.activeList.tasks.find(task => task.id === id);
    currentTask.text = e.target.value;
    localStorage.setItem("todoLists", JSON.stringify(todoLists));
  }

  function editSubtask(e) {
    if (!e.target.classList.contains("edit-todo-form__input--edit-subtask"))
      return;
    let id = e.currentTarget.dataset.id;
    let currentTask = state.activeList.tasks.find(task => task.id === id);
    let newSubtaskText = e.target.value;
    let subtaskIndex = e.target.dataset.subIndex;
    currentTask.subtasks[subtaskIndex].text = newSubtaskText;
    localStorage.setItem("todoLists", JSON.stringify(todoLists));
  }

  function toggleContent(e) {
    if (!(e.target.dataset.action === "toggleContent")) return;
    e.preventDefault();
    let todoItem = e.currentTarget;
    let id = todoItem.id;
    let tagLabels = todoItem.querySelector(".todo-item__tag-labels");
    let dueDateLabel = todoItem.querySelector('.badge--due-date');

    if (!(window.getComputedStyle(todoContent).display === "none")) {
      todoItem.classList.remove("is-expanded");
      todoContent.classList.remove("is-visible");
      if (todoItem.contains(tagLabels)) {
        tagLabels.classList.remove("is-hidden");
      }
      if (todoItem.contains(dueDateLabel)) {
        dueDateLabel.classList.remove("is-hidden");
      }
      let tags = todoContent.querySelectorAll("#tagsContainer .tag");
      tags.forEach(x => x.remove());
      divTodoApp.appendChild(todoContent); // Detaches edit form from list item
      if (state.filteredList !== null) {
        populateList(state.filteredList, $("#filteredList"));
      }
    } else {
      todoItem.appendChild(todoContent);
      $('#dueDateWrapper').classList.remove('has-due-date');
      $("#dueDateWrapper").classList.remove("show-input");
      $('#dpCalendar').classList.remove('is-active');
      if (todoItem.contains(tagLabels)) {
        tagLabels.classList.add("is-hidden");
      }
      if (todoItem.contains(dueDateLabel)) {
        dueDateLabel.classList.add("is-hidden");
      }
      populateContent(e);
      todoItem.classList.add("is-expanded");
      todoContent.classList.add("is-visible");
    }
  }

  function deleteTodo(e) {
    if (!(e.target.dataset.action === "deleteTodo")) return;
    let todoItem = e.currentTarget;
    let id = todoItem.id;
    const activeList_ul = $(".is-active-list");
    let todoIndex = state.activeList.tasks.findIndex(task => task.id === id); // index of todo object with matching ID in TODOS array
    todoContent.classList.remove("is-visible");
    divTodoApp.appendChild(todoContent);
    state.activeList.tasks.splice(todoIndex, 1);
    localStorage.setItem("todoLists", JSON.stringify(todoLists));
    let currentTasksList =
      state.filteredList === null ? state.activeList.tasks : state.filteredList;
    populateList(currentTasksList, activeList_ul);
  }

  function deleteTask(listObj, taskId) {
    let taskIndex = listObj.tasks.findIndex(task => task.id === taskId);
    listObj.tasks.splice(taskIndex, 1);
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
    let existingTag = undefined;
    const activeList_ul = $(".is-active-list");
    let currentList = state.activeList;
    if (todoIndex !== undefined) {
      existingTag = currentList.tasks[todoIndex].tags.find(
        tag => tag.text === text
      );
    } else {
      for (let i = 0; i < todoLists.length; i++) {
        for (let j = 0; j < todoLists[i].tasks.length; j++) {
          existingTag = todoLists[i].tasks[j].tags.find(
            tag => tag.text === text
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
    let id = state.activeList.tasks[todoIndex].id;
    let todoItem = document.getElementById(id);
    formEditTodo.querySelectorAll("#tagsContainer .tag")[tagIndex].remove();
    todoItem
      .querySelectorAll(".todo-item__tag-labels .tag-label")
      [tagIndex].remove();
    state.activeList.tasks[todoIndex].tags.splice(tagIndex, 1);
    localStorage.setItem("todoLists", JSON.stringify(todoLists));
    let tagsTooltipBtn = todoItem.querySelector(".tooltip__btn--tags");
    tagsTooltipBtn.dataset.tooltip = state.activeList.tasks[todoIndex].tags
      .map(tag => tag.text)
      .join(", ");
  }

  function addTag(e) {
    if (e.target.dataset.action !== "addTag" && $('#newTagInput').value === "") return;
    e.preventDefault();
    let tagsContainer = $("#tagsContainer");
    let newTagInput = $('#newTagInput');
    let id = formEditTodo.dataset.id;
    let todoIndex = state.activeList.tasks.findIndex(task => task.id === id);
    let currentTask = state.activeList.tasks.find(task => task.id === id);
    let todoItem = document.getElementById(id);
    let tagLabels =
      $(".todo-item__tag-labels", todoItem) ||
      createNode("div", { 
        class: "todo-item__tag-labels"
      });
    let tagsTooltipBtn =
      tagLabels.querySelector(".todo-item__tooltip-btn") ||
      createNode(
        "button",
        {
          class: "btn todo-item__tooltip-btn tooltip__btn--tags",
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
        let tag = {
          text,
          // Assigns color of previously created tag that matches text, if exists
          color: existingTag !== undefined ? existingTag.color : "bg--default"
        };
        state.activeList.tasks[todoIndex].tags.push(tag);
        localStorage.setItem("todoLists", JSON.stringify(todoLists));
        let deleteTagBtn = createNode("button", {
          class: "close-icon",
          type: "button",
          value: "false"
        });
        deleteTagBtn.addEventListener(
          "click",
          function(e) {
            removeTag(
              todoIndex,
              state.activeList.tasks[todoIndex].tags.indexOf(tag)
            );
          },
          false
        );
        let newTagNode = createNode(
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
        let tagLabel = createNode(
          "span",
          {
            class: `tag tag-label ${tag.color}`
          },
          tag.text
        );

        // Updates tooltip data
        tagsTooltipBtn.dataset.tooltip = currentTask.tags
          .map(tag => tag.text)
          .join(", ");
        console.log(tagsTooltipBtn.dataset.tooltip);
        tagLabels.insertBefore(tagLabel, tagsTooltipBtn);
        todoItem.appendChild(tagLabels);
        newTagInput.value = "";
        
        // Appends color picker to tag node if there are no existing tags that matches text
        if (existingTag === undefined) {
          console.log({newTagNode});
          newTagNode.appendChild(colorPicker);
          console.log({colorPicker});
          colorPicker.classList.add("is-visible");
        }
      }
    }
  }

  function getTask(id) {
    let currentTask = undefined;
    for (let i = 0; i < todoLists.length; i++) {
      currentTask = todoLists[i].tasks.find(task => task.id === id);
      if (currentTask !== undefined) {
        break;
      }
    }
    return currentTask;
  }

  function getTaskIndex(id) {
    let taskIndex = undefined;
    for (let i = 0; i < todoLists.length; i++) {
      taskIndex = todoLists[i].tasks.findIndex(task => task.id === id);
      if (taskIndex !== undefined) {
        break;
      }
    }
    return taskIndex;
  }

  function getList(todoId) {
    return todoLists.find(list => {
      return list.tasks.find(task => task.id === todoId);
    });
  }

  function populateContent(e) {
    let todoItem = e.currentTarget;
    let id = todoItem.id;
    state.activeList = getList(id);
    const activeList_ul = $(".is-active-list");
    let currentTask = state.activeList.tasks.find(task => task.id === id);
    let todoIndex = state.activeList.tasks.findIndex(task => task.id === id); // index of todo object with matching ID in TODOS array
    const todoItemTitle = todoItem.querySelector(".todo-item__title");
    const todoItemNote = todoItem.querySelector(".todo-item__note");
    const deleteTodoBtn = formEditTodo.querySelector("#deleteTodoBtn");
    const newTagInput = todoItem.querySelector("#newTagInput");
    todoItemTitle.value = currentTask.text;
    todoItemNote.value = currentTask.note;

    if (currentTask.dueDate !== null) {
      const dueDate = new Date(currentTask.dueDate);
      // month index starts at 0
      const dueMonthIndex = dueDate.getMonth();
      const dueMonthAbbrev = monthsArr[dueMonthIndex].abbrev;
      const dueDay = dueDate.getDate();
      $('#dueDateWrapper').classList.add('has-due-date');
    $("#dueDateWrapper .due-date-text").textContent = `${dueMonthAbbrev} ${dueDay}`;
    } else {
      $('#dueDateWrapper').classList.remove('has-due-date');
      $("#dueDateWrapper .due-date-text").textContent = "Set due date";
    }

    populateSubList(state.activeList.tasks, "subtasks", ulSubtasks, todoIndex);
    formEditTodo.dataset.index = todoIndex;
    formEditTodo.dataset.id = id;
    colorPicker.dataset.index = todoIndex;
    colorPicker.dataset.id = id;

    if (!todoItemNote.value) {
      todoItemNote.style.height = "0px";
    } else {
      setTimeout(() => {
        autoHeightResize();
      }
      , 10);
    }

    let tagsContainer = todoItem.querySelector("#tagsContainer");

    if (currentTask.tags.length > 0) {
      currentTask.tags.forEach(function(tag, i) {
        let deleteTagBtn = createNode("button", {
          class: "close-icon",
          type: "button",
          value: "false"
        });
        deleteTagBtn.addEventListener("click", function(e) {
          removeTag(todoIndex, i);
        });
        let newTagNode = createNode(
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
    todoItem.addEventListener("click", deleteTodo);
    feather.replace();
  }

  function updateView(e) {
    const activeList_ul = $(".is-active-list");
    let currentTasksList =
      state.filteredList !== null ? state.filteredList : state.activeList.tasks;
    let activeTodos = currentTasksList.filter(task => !task.done);
    let completedTodos = currentTasksList.filter(task => task.done);
    let action = e.target.dataset.action;
    switch (action) {
      case "viewAll":
        populateList(currentTasksList, activeList_ul);
        break;
      case "viewActive":
        populateList(activeTodos, activeList_ul);
        break;
      case "viewCompleted":
        populateList(completedTodos, activeList_ul);
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

  /**
   * Filters and renders todo items that match the provided query string
   */
  function filterTasks(e) {
    e.preventDefault();
    let query = inputSearch.value.toLowerCase();
    if (query !== "") {
      console.log(query);
      let filteredArray = todoLists.reduce((acc, list) => {
        return acc.concat(
          list.tasks.filter(todo => {
            return Object.keys(todo).some(key => {
              if (typeof todo[key] === "string") {
                return todo[key].toLowerCase().includes(query);
              }
              if (Array.isArray(todo[key])) {
                return todo[key].some(item => {
                  return item.text.toLowerCase().includes(query);
                });
              }
            });
          })
        );
      }, []);
      populateList(filteredArray, $("#filteredList"));
      $(".is-active-list").classList.remove("is-active-list");
      $("#filteredList").classList.add("is-active-list");
      $("#activeListTitle").textContent = "Search Results";
      formAddTodo.classList.add("is-hidden");
      state.activeList = null;
      state.filteredList = filteredArray;
      inputSearch.blur();
    }
  }

  function filterTasksDueToday(e) {
    e.preventDefault();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const filteredArray = todoLists.reduce((acc, list) => {
      return acc.concat(
        list.tasks.filter(task => {
          return new Date(task.dueDate).valueOf() === today.valueOf();
        })
      );
    }, []);
    populateList(filteredArray, $("#today"));
    $(".is-active-list").classList.remove("is-active-list");
    $("#today").classList.add("is-active-list");
    $("#activeListTitle").textContent = "Due Today";
    formAddTodo.classList.add("is-hidden");
    state.activeList = null;
    state.filteredList = filteredArray;

    // Closes sidebar if viewport is < 768px
    if (document.documentElement.clientWidth < 768) {
      $('#siteWrapper').classList.remove('show-nav');
    }
  }

  function toggleMenu() {
    let siteWrapper = document.getElementById("siteWrapper");

    if (siteWrapper.classList.contains("show-nav")) {
      siteWrapper.classList.remove("show-nav");
    } else {
      siteWrapper.classList.add("show-nav");
    }
  }

  function setTagColor(e) {
    let el = e.target;
    if (!el.classList.contains("color-picker__swatch")) return;
    let currentColor = $("#" + el.getAttribute("for"));
    currentColor.checked = true;
    let tag = colorPicker.parentNode;
    tag.className = "tag " + currentColor.value;
    let id = colorPicker.dataset.id;
    let todoItem = state.activeList.tasks.find(task => task.id === id);
    let tagIndex = tag.dataset.tagIndex;
    todoItem.tags[tagIndex].color = currentColor.value;
    let tagLabel = $all('.tag-label', $(`#${id}`))[tagIndex];
    tagLabel.className = "tag tag-label " + currentColor.value;
    localStorage.setItem("todoLists", JSON.stringify(todoLists));
  }

  function createList(listObj) {
    let list_ul = createNode("ul", {
      class: "todo-list",
      id: listObj.id,
      "data-name": listObj.name
    });
    list_ul.addEventListener("click", toggleDone);
    $("#main").insertBefore(list_ul, $("#views"));
    renderListOption(listObj)
  }

  // Sidebar accordion

  function displayPanel(e) {
    if (!e.target.classList.contains("accordion__item")) return;
    const accordion = $(".accordion");
    let accordionItems = accordion.getElementsByClassName("accordion__item");
    let selectedPanel = e.currentTarget.querySelector(".accordion__panel");
    for (let i = 0; i < accordionItems.length; i++) {
      if (accordionItems[i] === selectedPanel.parentNode) {
        accordionItems[i].classList.toggle("is-active");
      }
    }
  }

  const createNavItem = listObj => {
    let aListLink = createNode(
      "a",
      {
        class: "sidebar__link",
        href: `#${listObj.id}`
      },
      listObj.name
    );
    aListLink.addEventListener('click', openList);
    let item_li =
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
  };

  function renderNavItems() {
    // Array of folder names
    const foldersArr = todoLists
      .map(list => list.folder)
      .filter(
        (folder, i, arr) => folder !== "null" && arr.indexOf(folder) === i
      );
    const frag = document.createDocumentFragment();
    foldersArr.forEach(folder => {
      const ulFolderPanel = createNode("ul", {
        class: "accordion__panel",
        "data-folder": folder
      });
      renderFolderOption(folder);

      // Creates accordion panel for each folder, with links to children underneath
      const folderItems = todoLists.filter(list => list.folder === folder);
      folderItems.forEach(item => {
        let aListLink = createNode(
          "a",
          {
            class: "sidebar__link",
            href: `#${item.id}`
          },
          item.name
        );
        let liFolderItem = createNode(
          "li",
          {
            class: "accordion__sub-item"
          },
          aListLink
        );
        ulFolderPanel.appendChild(liFolderItem);
      });

      let iFolderIcon = createNode("i", {
        "data-feather": "folder"
      });
      let folder_li = createNode(
        "li",
        {
          class: "sidebar__item accordion__item"
        },
        iFolderIcon,
        folder,
        ulFolderPanel
      );

      folder_li.addEventListener("click", displayPanel);
      frag.appendChild(folder_li);
    });

    // Creates regular nav items for miscellaneous lists
    let miscLists = todoLists.filter(list => list.folder === "null");
    miscLists.forEach(item => {
      if (item.id !== "inbox") {
        let aListLink = createNode(
          "a",
          {
            class: "sidebar__link",
            href: `#${item.id}`
          },
          item.name
        );
        let miscList_li = createNode(
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
    let navLinksAll = $all(".sidebar__link");
    navLinksAll.forEach((link) => link.addEventListener("click", openList));
  };

  renderNavItems();

  function openList(e) {
    e.preventDefault();
    formSearch.reset();
    const navLinksAll = $all(".sidebar__link");
    navLinksAll.forEach(link => {
      if (link === e.target) {
        link.classList.add('is-active');
      } else {
        link.classList.remove('is-active');
      }
    });
        if (e.target.id !== "todayNavLink") {
          let id = e.target.getAttribute("href").slice(1);
          let listObj = todoLists.find(list => list.id === id);
          displayList(listObj);
          if (document.documentElement.clientWidth < 768) {
            $('#siteWrapper').classList.remove('show-nav');
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
    const folderIcon = createNode("i", {
      "data-feather": "folder"
    });
    const folderLabel = createNode(
      "label",
      {
        class: "form__label--folder",
        for: `folder--${camelCased(text)}`
      },
      folderIcon,
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
    const fieldsetLists = $('#fieldsetLists');
    fieldsetLists.appendChild(listRadio);
    fieldsetLists.appendChild(listLabel);
  }

  function addList(e) {
    e.preventDefault();
    const newListName = $("#newListNameInput").value;
    if (newListName !== "") {
      let checkedRadio = $('input[name="folder"]:checked').value;
      let selectedFolder =
        checkedRadio === "new" ? $("#newFolderInput").value : checkedRadio;
      const newList = new List(newListName, selectedFolder);
      todoLists.push(newList);
      createList(newList);
      // Creates new folder accordion element
      if (checkedRadio === "new") {
        let ulFolderPanel = createNode("ul", {
          class: "accordion__panel",
          "data-folder": selectedFolder
        });
        let iFolderIcon = createNode("i", {
          "data-feather": "folder"
        });
        let folder_li = createNode(
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
      createNavItem(newList);
      localStorage.setItem("todoLists", JSON.stringify(todoLists));
      const navLinksAll = $all(".sidebar__link");
      navLinksAll.forEach(link => {
        if (link.getAttribute('href') === `#${newList.id}`) {
          link.classList.add('is-active');
        } else {
         link.classList.remove('is-active');
        }
      });
      console.table(todoLists);
      e.currentTarget.reset();
      $("#newListFormContainer").classList.remove("is-active");
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
    $(`input[name="folder"][value="${state.activeList.folder}"]`).checked = true;
    $('#editListFormContainer').classList.add('is-active');
  }


  function updateList(e) {
    e.preventDefault();
    const newListName = $('#editListNameInput').value;
    const checkedRadio = $('input[name="folder"]:checked').value;
    const selectedFolder = checkedRadio === "new" ? $("#newFolderInput").value : checkedRadio;
    const listNavLink = $(`a[href="#${state.activeList.id}"]`);
    const listNavItem = listNavLink.parentNode;
    // Rename list
    if (newListName !== "" && newListName !== state.activeList.name) {
      state.activeList.name = newListName;

    // Update list nav link
    listNavLink.textContent = newListName;
    $('#activeListTitle').textContent = newListName;
    }
    // Create new folder
    if (checkedRadio === "new" && selectedFolder !== "") {
      console.log({selectedFolder});
      let ulFolderPanel = createNode("ul", {
        class: "accordion__panel",
        "data-folder": selectedFolder
      });
      let iFolderIcon = createNode("i", {
        "data-feather": "folder"
      });
      let folder_li = createNode(
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
        console.log({selectedFolder});
        listNavItem.className = "accordion__sub-item";
        listNavItem.removeAttribute('data-folder');
        $(`[data-folder="${selectedFolder}"]`).appendChild(listNavItem);
      }
    }
    // Save changes to storage
    localStorage.setItem("todoLists", JSON.stringify(todoLists));
    e.currentTarget.reset();
    $("#editListFormContainer").classList.remove("is-active");
  }

  function deleteList(listObj) {

// TODO: add alert msg
    const listNavLink = $(`a[href="#${listObj.id}"]`);
    const listNavItem = listNavLink.parentNode;
    const listElement = $(`#${listObj.id}`);

    // Delete list object
    const listIndex = todoLists.indexOf(listObj);
    console.log({listIndex});
    todoLists.splice(listIndex, 1);
    localStorage.setItem("todoLists", JSON.stringify(todoLists));

    // Delete list nav item 
    listNavItem.remove();

    // Delete list `ul` element
    listElement.remove();

    // Delete list option from transfer tasks form
    const listRadio = $(`input[name="list"][value=${listObj.id}]`);
    listRadio.remove();
    $(`.form__label--list[for=${listRadio.id}]`).remove();

    // Reload inbox
    const inbox = todoLists.find(list => list.name === "Inbox");
    displayList(inbox);
  }

  function displayList(listObj) {

    $("#activeListTitle").textContent = listObj.name;
    let list_ul = $(`#${listObj.id}`);
    $all(".todo-list").forEach(x => {
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
    let date = new Date();
    let year = date.getFullYear();
    let frag = document.createDocumentFragment();
    // Adds current and next 2 years as radio options for year picker
    for (let i = 0; i <= 3; i++) {
      let yearRadio = createNode("input", {
        type: "radio",
        name: "year",
        value: `${year + i}`,
        id: `${year + i}`,
        class: "dp-calendar__radio"
      });
      frag.appendChild(yearRadio);
      let yearLabel = createNode(
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
    let currentDate = $("#inputDueDate").value; // `mm/dd/yy`
    let currentYear = currentDate.slice(6);
    let currentMonth = currentDate.slice(0, 2);
    let currentDay = currentDate.slice(3, 5);
    switch (dateComponent) {
      case "month":
        let monthNum = monthsArr.findIndex(x => x.name === newValues[0]);
        $("#inputDueDate").value = `${
          monthNum > 8 ? monthNum + 1 : "0" + (monthNum + 1)
        }/${currentDay}/${currentYear}`;
        break;
      case "day":
        $("#inputDueDate").value = `${currentMonth}/${
          newValues[0] > 9 ? newValues[0] : "0" + newValues[0]
        }/${currentYear}`;
        break;
      case "year":
        $("#inputDueDate").value = `${currentMonth}/${currentDay}/${newValues[0].slice(2)}`;
        break;
      case "all":
      let monthIndex = monthsArr.findIndex(x => x.name === newValues[0]);
        $("#inputDueDate").value = `${monthIndex > 8 ? monthIndex + 1 : "0" + (monthIndex + 1)}/${newValues[1] > 9 ? newValues[1] : "0" + newValues[1]}/${newValues[2].slice(2)}`;
        break;
    }
  }

  function selectMonth(e) {
    if (!e.target.classList.contains("dp-calendar__month")) return;
    const currentDueDate = $('#inputDueDate').value; // mm-dd-yy
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
      btnToggleMonthDropdown.innerHTML =
      selectedMonth + `<i data-feather="chevron-down"></i>`;
      feather.replace();
      populateCalendarDays(selectedMonth);
      
      if (selectedMonth === dueMonth) {
        $(`.dp-calendar__btn--select-day[value="${dueDay}"][data-month="${selectedMonth}"]`).classList.add('is-selected');
      };
    };
    btnToggleMonthDropdown.classList.remove("is-active");
    monthDropdown.classList.remove("is-active");
  }

  function selectYear(e) {
    if (!e.target.classList.contains("dp-calendar__year")) return;

    const currentDueDate = $('#inputDueDate').value; // mm-dd-yy
    const dueMonthIndex = +currentDueDate.slice(0, 2) - 1;
    const dueMonth = monthsArr[dueMonthIndex].name;
    const dueDay = +currentDueDate.slice(3, 5);
    const dueYear = '20' + currentDueDate.slice(6);

    const prevSelectedYear = $('input[name="year"]:checked').value;
    const btnToggleYearDropdown = $("#btnToggleYearDropdown");
    const yearDropdown = $("#dpCalendarYearDropdown");
    const radioId = e.target.getAttribute("for");
    const radio = $(`#${radioId}`);
    radio.checked = true;
    const selectedYear = radio.value;

    if (selectedYear !== prevSelectedYear) {
      btnToggleYearDropdown.innerHTML =
        `<i data-feather="chevron-down"></i>` + selectedYear;
      feather.replace();
      populateCalendarDays(dueMonth);

      // Length of February depends on leap year
      if (selectedYear === dueYear) {
        $(`.dp-calendar__btn--select-day[value="${dueDay}"][data-month="${dueMonth}"]`).classList.add('is-selected');
      };
    }
    btnToggleYearDropdown.classList.remove("is-active");
    yearDropdown.classList.remove("is-active");
  }

  function populateCalendarDays(monthStr) {
    while ($("#dpCalendar").contains($(".dp-calendar__day"))) {
      $(".dp-calendar__day").remove();
    }

    const year = $('input[name="year"]:checked').value;
    const monthIndex = monthsArr.findIndex(month => month.name === monthStr);
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
        let btnDay = createNode(
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
        let divDay = createNode(
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
      let btnDay = createNode(
        "button",
        {
          class: "dp-calendar__btn--select-day",
          type: "button",
          "data-month": month.name,
          "data-year": year,
          "data-action": "selectDay",
          "data-first": i === 1 ? true : false,
          "data-last": i === month.daysTotal ? true : false,
          value: i
        },
        `${i}`
      );
      let divDay = createNode(
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
        let btnDay = createNode(
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
        let divDay = createNode(
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

    $all(".dp-calendar__btn--select-day").forEach(x => {
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


    if (el.classList.contains("dp-calendar__btn--prev-month") || el.classList.contains("dp-calendar__btn--next-month")) {
      if ((el.classList.contains('dp-calendar__btn--prev-month') && selectedMonth === "December") || (el.classList.contains('dp-calendar__btn--next-month') && selectedMonth === "January")) {
        $(`input[name="year"][value="${selectedYear}"]`).checked = true;
        $("#btnToggleYearDropdown").innerHTML =
            selectedYear + `<i data-feather="chevron-down"></i>`;
      };

      $(`input[name="month"][value="${selectedMonth}"]`).checked = true;
      btnToggleMonthDropdown.innerHTML =
      selectedMonth + `<i data-feather="chevron-down"></i>`;
      populateCalendarDays(selectedMonth);
      $(`.dp-calendar__btn--select-day[value="${selectedDay}"][data-month="${selectedMonth}"]`).classList.add('is-selected');
    };
  }

  function setDueDate(e) {
    const id = $("#dpCalendar").parentNode.dataset.id;
    const currentTask = state.activeList.tasks.find(task => task.id === id);

    const dueDate = $("#inputDueDate").value; // `mm/dd/yy`
    const dueYear = +('20' + dueDate.slice(6));
    const dueMonthIndex = +dueDate.slice(0, 2) - 1;
    const dueDay = +dueDate.slice(3, 5);
    const dueMonthAbbrev = monthsArr[dueMonthIndex].abbrev;

    const newDueDate = new Date(dueYear, dueMonthIndex, dueDay);
    
    if (new Date(currentTask.dueDate).valueOf() !== newDueDate.valueOf()) {
    currentTask.dueDate = newDueDate;
    localStorage.setItem("todoLists", JSON.stringify(todoLists));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDay = today.getDate();
    const currentMonthIndex = today.getMonth();
    const currentYear = today.getFullYear();
    const nextYear = currentYear + 1;
    const currentMonth = monthsArr[currentMonthIndex];
    const nextMonthIndex = currentMonth.name !== "December" ? currentMonthIndex + 1 : 0;
    
    if (currentMonth.name === 'February') {
      currentMonth.daysTotal = isLeapYear(currentYear) ? 29 : 28;
    }
   
    const tomorrow = (currentDay < currentMonth.daysTotal) ? new Date(currentYear, currentMonthIndex, currentDay + 1)
    : (nextMonthIndex !== 0 ) ? new Date(currentYear, nextMonthIndex, 1) : new Date(nextYear, nextMonthIndex, 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const todoItem = $(`#${id}`);
    const dueDateLabel = todoItem.contains($('.badge--due-date')) ? $('.badge--due-date', todoItem) : createNode("span", {class: 'badge--due-date is-hidden'});
   
    if (newDueDate.valueOf() === today.valueOf()) {
      dueDateLabel.textContent = "Today";
      dueDateLabel.classList.add('badge--today');
    } else if (newDueDate.valueOf() === tomorrow.valueOf()) {
      dueDateLabel.textContent = "Tomorrow";
      dueDateLabel.classList.add('badge--tomorrow');
    } else {
      dueDateLabel.textContent = `${dueMonthAbbrev} ${dueDay}`;
    };

    if (!todoItem.contains($('.badge--due-date'))) {
      todoItem.appendChild(dueDateLabel);
    };

  }

    $('#dueDateWrapper').classList.add('has-due-date');
    $("#dueDateWrapper .due-date-text").textContent = `${dueMonthAbbrev} ${dueDay}`;
    $("#dueDateWrapper").classList.remove("show-input");
    $("#dpCalendar").classList.remove("is-active");
  }

  function closeModal(e) {
    if (!e.target.classList.contains('modal__btn--close')) return;
    e.currentTarget.classList.remove('is-active');
  }

  function initDpCalendar(e) {

    if (e.currentTarget.classList.contains('show-input')) return;

    const id = $("#dpCalendar").parentNode.dataset.id;
    console.log({id});
    const currentTask = state.activeList.tasks.find(task => task.id === id);
    console.log({currentTask});
    
    if (currentTask.dueDate !== null) {
    const dueDate = new Date(currentTask.dueDate);
      // month index starts at 0
    const dueMonthIndex = dueDate.getMonth();
    const dueMonth = monthsArr[dueMonthIndex].name;
    const dueDay = dueDate.getDate();
    const dueYear = `${dueDate.getFullYear()}`;

    updateDateInput('all', dueMonth, dueDay, dueYear);

    $(`input[name="year"][value="${dueYear}"]`).checked = true;
    $("#btnToggleYearDropdown").innerHTML =
        dueYear + `<i data-feather="chevron-down"></i>`;
      $(`input[name="month"][value="${dueMonth}"]`).checked = true;
      $("#btnToggleMonthDropdown").innerHTML =
        dueMonth + `<i data-feather="chevron-down"></i>`;
      populateCalendarDays(dueMonth);
      $(`.dp-calendar__btn--select-day[value="${dueDay}"][data-month="${dueMonth}"]`).classList.add('is-selected');

    } else {
      const now = new Date();
      let currentMonthNum = now.getMonth();
      let currentMonth = monthsArr[currentMonthNum];
      let currentYear = `${now.getFullYear()}`;
      let currentDay = now.getDate();
      updateDateInput('all', currentMonth.name, currentDay, currentYear);
      
      // Set default month to current month
      $(
        `#dpCalendarMonthDropdown input[value="${currentMonth.name}"]`
      ).checked = true;
      $("#btnToggleMonthDropdown").innerHTML =
        currentMonth.name + `<i data-feather="chevron-down"></i>`;
    
      // Sets default year to current year
      $(`#dpCalendarYearDropdown input[value="${currentYear}"]`).checked = true;
      $("#btnToggleYearDropdown").innerHTML =
        `<i data-feather="chevron-down"></i>` + currentYear;
      populateCalendarDays(currentMonth.name);
      $(`.dp-calendar__btn--select-day[value="${currentDay}"][data-month="${currentMonth.name}"]`).classList.add('is-selected');
    }
  }

  function expandSearchBar(e) {
    e.stopPropagation();
    if (e.target === searchInput) return;
    if (!searchBar.classList.contains('is-expanded')) {
     e.preventDefault();
      searchBar.classList.add('is-expanded');
    } else if (searchBar.classList.contains('is-expanded') && searchInput.value == "") {
      searchBar.classList.remove('is-expanded');
    }
  }

function openBulkEditing(e) {
  // Hide add todo form
  $('#addTodoForm').classList.add('is-hidden');
   // Reveal bulk editing toolbar
   $('#bulkEditingToolbar').classList.add('is-active');
  // Add bulk-editing checkboxes and hide regular checkboxes for toggling completeness
  const ulActiveList = $('.is-active-list');
  $all('.todo-list__item', ulActiveList).forEach((x, i) => {
    const frag = document.createDocumentFragment();
    const checkbox = createNode('input', {type: 'checkbox', id: `bulk-item-${i}`, 'data-index': i, 'data-id': x.id, class: 'bulk-editing__checkbox'});
    const checkboxLabel = createNode('label', {class: 'bulk-editing__checkbox-label', for: `bulk-item-${i}`});
    frag.appendChild(checkbox);
    frag.appendChild(checkboxLabel);
    x.insertBefore(frag, $('input[type="checkbox"]', x));
    $('.todo-list__checkbox', x).classList.add('is-hidden');
  });
}

function transferTasks(e) {
  e.preventDefault();
  const ulActiveList = $('.is-active-list');
  const currentListObj = state.activeList;
  const checkedItems = $all('.bulk-editing__checkbox:checked', ulActiveList);
  const newListId = $('input[name="list"]:checked').value;
  const newListObj = todoLists.find(list => list.id === newListId);

  // Remove tasks from current list and add to new list
  checkedItems.forEach(item => {
    let taskId = item.dataset.id;
    let taskIndex = currentListObj.tasks.findIndex(task => task.id === taskId);
    let task = currentListObj.tasks.splice(taskIndex, 1)[0];
    newListObj.tasks.unshift(task);
  });

  localStorage.setItem("todoLists", JSON.stringify(todoLists));

  // Reload current list to reflect changes
  populateList(currentListObj.tasks, ulActiveList);
  $('#bulkEditingToolbar').classList.remove('is-active');
  $('#transferTasksFormContainer').classList.remove('is-active');
}

function deleteSelected(e) {
  e.preventDefault();
  const ulActiveList = $('.is-active-list');
  const currentListObj = state.activeList;
  const checkedItems = $all('.bulk-editing__checkbox:checked', ulActiveList);
  checkedItems.forEach(item => {
    deleteTask(currentListObj, item.dataset.id);
  });
  localStorage.setItem("todoLists", JSON.stringify(todoLists));
  populateList(currentListObj.tasks, ulActiveList);
  $('#bulkEditingToolbar').classList.remove('is-active');
}

// Hides certain elements if you click outside of them
function hideComponents(e) {
  if (
    colorPicker.classList.contains("is-visible") 
    && e.target !== $('#btnAddTag') 
    && e.target !== colorPicker 
    && !colorPicker.contains(e.target)
  ) {
    colorPicker.classList.remove("is-visible");
    formEditTodo.appendChild(colorPicker);
  }
  
  // Hides tooltip
  if (
    divTodoApp.contains($(".show-tooltip")) &&
    e.target !== $(".show-tooltip")
  ) {
    $(".show-tooltip").classList.remove("show-tooltip");
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
  if (searchBar.classList.contains('is-expanded') && searchInput.value === "" && e.target !== searchBar && !searchBar.contains(e.target)) {
    searchBar.classList.remove('is-expanded');
  }

  // Hides listActions
  const listActionsWrapper = $('#listActionsWrapper');
  if (listActionsWrapper.classList.contains('show-actions') && e.target !== listActionsWrapper && !listActionsWrapper.contains(e.target)) {
    listActionsWrapper.classList.remove('show-actions');
  }
}

  // Event Listeners

  $('#transferTasksForm').addEventListener('submit', transferTasks);

  $('#newListInput').addEventListener("click", e => {
    $('input[id="listNew"]').checked = true;
  });

  $('#bulkEditingToolbar').addEventListener('click', (e) => {
    let el = e.target;
    const ulActiveList = $('.is-active-list');
  const currentListObj = state.activeList;
    if (el.dataset.action === "transferSelected") {
      $('#transferTasksFormContainer').classList.add('is-active');
    } else if (el.dataset.action === 'deleteSelected') {
      deleteSelected(e);
    } else if (el.dataset.action === 'closeBulkEditingToolbar') {
      $('#bulkEditingToolbar').classList.remove('is-active');
      populateList(currentListObj.tasks, ulActiveList);
    }
  });

  $('#masterCheckbox').addEventListener('change', (e) => {
    const checkedState = e.currentTarget.checked;
    const ulActiveList = $('.is-active-list');
    $all('.bulk-editing__checkbox', ulActiveList).forEach(x => x.checked = checkedState);
  });

$('#btnDeleteList').addEventListener('click', (e) => {
  deleteList(state.activeList);
});
formEditList.addEventListener('submit', updateList);
  
$("#listActionsWrapper").addEventListener('click', (e) => {

  if (!e.target.classList.contains('more-actions__item')) return;

  if (e.target === $("#btnEditList")) {
    prepEditListForm(e);
  } else if (e.target === $('#btnOpenBulkEditing')) {
    openBulkEditing(e);
  }
    e.currentTarget.classList.remove('show-actions');
});

  $all('.more-actions__btn--toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
    if (btn.classList.contains('list-actions__btn--toggle')) {

    // Prevents todoContent from being deleted if attached to list item
    if (todoContent.classList.contains('is-visible')) {
      todoContent.classList.remove('is-visible');
      divTodoApp.appendChild(todoContent);
    }
      
      if (state.activeList === null || state.activeList.name === "Inbox") {
        $('#btnEditList').disabled = true;
        $('#btnDeleteList').disabled = true;
      } else {
        $('#btnEditList').disabled = false;
        $('#btnDeleteList').disabled = false;
      } 
    };
    e.currentTarget.parentNode.classList.toggle('show-actions');
  });
});

searchBar.addEventListener('click', expandSearchBar);

  $('#btnAddTag').addEventListener('click', addTag);

  document.querySelectorAll(".sidebar__btn--toggle").forEach(btn => {
    btn.addEventListener("click", toggleMenu, true);
  });
  divViews.addEventListener("click", updateView);
  formAddTodo.addEventListener("submit", addTodo);
  ulInbox.addEventListener("click", toggleDone);
  $("#filteredList").addEventListener("click", toggleDone);
  ulSubtasks.addEventListener("click", toggleComplete);
  btnClearAll.addEventListener("click", clearAll);
  formEditTodo.addEventListener("submit", addSubtask);
  $('#btnAddSubtask').addEventListener("click", addSubtask);
  colorPicker.addEventListener("click", setTagColor);

  
  formEditTodo.addEventListener("keyup", e => {
    if (e.keyCode === ENTER_KEY) {
      if (e.target === $("#newSubtaskInput")) {
        addSubtask(e);
      }
      if (e.target === $("#newTagInput")) {
        addTag(e);
      }
    }
  });
  
$('#todoItemNote').addEventListener('change', addNote);
  formEditTodo.addEventListener("input", editSubtask);

  // Delete tag on double backspace
  formEditTodo.addEventListener("keyup", e => {
    let newTagInput = $("#newTagInput");
    if (e.target !== newTagInput) return;
    let id = e.currentTarget.dataset.id;
    let todoIndex = state.activeList.tasks.findIndex(task => task.id === id);
    let currentTask = state.activeList.tasks.find(task => task.id === id);
    if (currentTask.tags.length > 0) {
      let lastIndex = currentTask.tags.length - 1;
      let lastTag = formEditTodo.querySelectorAll("#tagsContainer .tag")[
        lastIndex
      ];
      let lastTagBtn = lastTag.querySelector(".close-icon");
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

  inputSearch.addEventListener("click", e => e.currentTarget.select());

  const selectEvents = (function() {
    return ('ontouchstart' in document === true) ? 'touchstart' : 'click';
  })();

  document.body.addEventListener(selectEvents, hideComponents);

  $all("[data-action='openListForm']").forEach(btn => {
    btn.addEventListener("click", e => {
    if (!formNewList.contains(fieldsetFolders)) {
      formNewList.insertBefore(fieldsetFolders, $('#addListBtn'));
    }
    $("#newListFormContainer").classList.add("is-active");
    $('#newListNameInput').focus();
    if (document.documentElement.clientWidth < 768) {
      $('#siteWrapper').classList.remove('show-nav');
    };
  });
});



  formNewList.addEventListener("submit", addList);
  inputNewFolder.addEventListener("click", e => {
    let newFolderRadio = $('input[id="folderNew"]');
    newFolderRadio.checked = true;
  });

  $all('.modal').forEach(modal => modal.addEventListener('click', closeModal));

  $all(".dp-calendar__toggle-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.currentTarget.nextElementSibling.classList.toggle("is-active");
      e.currentTarget.classList.toggle("is-active");
    });
  });

  $all(".dp-calendar__dropdown").forEach(x => {
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
  const selectedMonthIndex = monthsArr.findIndex(x => x.name === selectedMonth);
  const prevMonth = selectedMonthIndex !== 0 ? monthsArr[selectedMonthIndex - 1].name : "December";
  const nextMonth = selectedMonthIndex !== 11 ? monthsArr[selectedMonthIndex + 1].name : "January";
  const currentDueDate = $('#inputDueDate').value; // mm/dd/yy
  const dueMonthIndex = +currentDueDate.slice(0, 2) - 1;
  const dueMonth = monthsArr[dueMonthIndex].name;
  const dueDay = +currentDueDate.slice(3, 5);
  const dueYear = '20' + currentDueDate.slice(6);
  console.log({dueDay});

      if (action === "selectNextMonth") {
        
        if (nextMonth === "January") {
          let nextYear = +selectedYear + 1;
          $(`input[value="${nextYear}"]`).checked = true;
          $("#btnToggleYearDropdown").innerHTML =
            nextYear + `<i data-feather="chevron-down"></i>`;
        }
        $(`input[value="${nextMonth}"]`).checked = true;
        $("#btnToggleMonthDropdown").innerHTML =
          nextMonth + `<i data-feather="chevron-down"></i>`;
        populateCalendarDays(nextMonth);
        if (nextMonth === dueMonth && selectedYear === dueYear) {
          $(`.dp-calendar__btn--select-day[value="${dueDay}"][data-month="${dueMonth}"]`).classList.add('is-selected');
        };
      }

      if (action === "selectPrevMonth") {
        if (prevMonth === "December") {
          let prevYear = +selectedYear - 1;
          $(`input[value="${prevYear}"]`).checked = true;
          $("#btnToggleYearDropdown").innerHTML =
            prevYear + `<i data-feather="chevron-down"></i>`;
        }
        $(`input[value="${prevMonth}"]`).checked = true;
        $("#btnToggleMonthDropdown").innerHTML =
          prevMonth + `<i data-feather="chevron-down"></i>`;
        populateCalendarDays(prevMonth);
        if (prevMonth === dueMonth && selectedYear === dueYear) {
          console.log({selectedYear});
          $(`.dp-calendar__btn--select-day[value="${dueDay}"][data-month="${dueMonth}"]`).classList.add('is-selected');
        };
      };
}
  // Select previous or next month on click
  $all(".dp-calendar__btn-prevnext").forEach(x => x.addEventListener("click", selectPrevNext));

  $("#dpCalendarDayPicker").addEventListener("click", selectDay);
  $("#btnSetDueDate").addEventListener("click", setDueDate);
  
  $("#dueDateWrapper").addEventListener("click", (e) => {
    initDpCalendar(e);
    e.currentTarget.classList.add("show-input");
    $("#dpCalendar").classList.add("is-active");
  });


  $("#inputDueDate").addEventListener('change', (e) => {
    const dateRegex = /[01][0-9]\/[0-3][0-9]\/[12][0-9]/; // mm/dd/yy

    if (!dateRegex.test(e.target.value)) {

      // Returns value for month as a double digit
      if (/^[0-9]\//.test(e.target.value)) {
        let foo = e.target.value;
        e.target.value = '0' + foo;
      };

      // Returns value for day as a double digit 
      if (/^[01][0-9]\/[0-9]-/.test(e.target.value)) {
        let foo = e.target.value;
        e.target.value = foo.slice(0, 3) + '0' + foo.slice(3);
      }
    };

    if (dateRegex.test(e.target.value)) {

    const dateStr = $("#inputDueDate").value; // mm/dd/yy
    console.log({dateStr});

    let selectedDay = $(".dp-calendar__btn--select-day.is-selected");
    let year = '20' + dateStr.slice(6);
    console.log({year});
    let monthNum = +dateStr.slice(0, 2) - 1;
    let month = monthsArr[monthNum];
    let monthText = month.name;
    if (monthText === 'February') {
      month.daysTotal = isLeapYear(+year) ? 29 : 28;
    }

    let lastDay = month.daysTotal;
    const day = +dateStr.slice(3, 5) > lastDay ? (
      updateDateInput('day', lastDay),
      lastDay
    ) : +dateStr.slice(3, 5);

    console.log({day});
  
    if ($(`input[name="year"]:checked`).value !== year) {
      $(`input[value="${year}"]`).checked = true;
      $("#btnToggleYearDropdown").innerHTML =
        year + `<i data-feather="chevron-down"></i>`;
      populateCalendarDays(monthText);
      $(`.dp-calendar__btn--select-day[value="${day}"][data-month="${monthText}"]`).classList.add('is-selected');
    }

    if ($(`input[name="month"]:checked`).value !== monthText) {
      $(`input[value="${monthText}"]`).checked = true;
      $("#btnToggleMonthDropdown").innerHTML =
        monthText + `<i data-feather="chevron-down"></i>`;
      populateCalendarDays(monthText);
    }

    if (selectedDay && selectedDay.value !== day) {
      $all(".dp-calendar__btn--select-day").forEach(x => {
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
  };
  });

  $("#todayNavLink").addEventListener("click", filterTasksDueToday);
  $("#btnClearDueDate").addEventListener('click', (e) => {
    const id = $("#dpCalendar").parentNode.dataset.id;
    const currentTask = state.activeList.tasks.find(task => task.id === id);
    currentTask.dueDate = null;
    localStorage.setItem("todoLists", JSON.stringify(todoLists));
    $('#dueDateWrapper').classList.remove('has-due-date');
    $("#dueDateWrapper .due-date-text").textContent = 'Set due date';
    $("#dueDateWrapper").classList.remove("show-input");
    $("#dpCalendar").classList.remove("is-active");
  });

  $('#btnResetDueDate').addEventListener('click', (e) => {
    $("#dueDateWrapper").classList.remove("show-input");
    $("#dpCalendar").classList.remove("is-active");
  });

$all('.form__input--inline').forEach(x => {
  x.addEventListener('focus', (e) => {
    e.currentTarget.parentNode.classList.add('is-focused');
  });
  x.addEventListener('focusout', (e) => {
    e.currentTarget.parentNode.classList.remove('is-focused');
  });
});

$('#todoItemNote').addEventListener("input", autoHeightResize, false);

}());
