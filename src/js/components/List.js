import { camelCased, $, createNode } from '../lib/helpers.js';
import Component from '../lib/Component.js';
import store from '../store/index.js';

export default class List extends Component {
  constructor(name, folder = null, obj = null) {
    super({ store });
    if (!obj) {
      this.name = name;
      this.folder = folder;
      this.id = `${camelCased(name)}-${Date.now()}`;
      this.tasks = [];
      this.elem =
        document.getElementById(this.id) ||
        createNode('ul', {
        class: 'todo-list custom-list',
        id: this.id,
        'data-name': this.name
      });
    } else {
      this.name = obj.name;
      this.folder = obj.folder;
      this.id = obj.id;
      this.tasks = obj.tasks;
      this.elem = document.getElementById(this.id);
    }
  }
  
  get activeTaskCount() {
    return this.tasks.filter((task) => !task.isDone).length;
  }

  getTask(taskId) {
    return this.tasks.find((task) => task.id === taskId);
  }

  findTaskIndex(taskId) {
    return this.tasks.findIndex((task) => task.id === taskId);
  }

  addTask(task) {
    this.tasks.concat(task);
  }

  deleteTask(taskId) {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
  }

  clickHandler(e) {
    toggleDone(e);
    toggleContent(e);
    setPriority(e);
  }

  render() {
    if (!document.getElementById(this.id)) {
      this.elem.addEventListener('click', clickHandler);
      $('#main').insertBefore(this.elem, $('#addTodoForm'));
    }
    this.elem.innerHTML = this.tasks.map(
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
    );
    return this.elem;
  }
}

export function createList(listObj) {
  const list_ul = createNode('ul', {
    class: 'todo-list custom-list',
    id: listObj.id,
    'data-name': listObj.name
  });
  list_ul.addEventListener('click', toggleDone);
  list_ul.addEventListener('click', toggleContent);
  list_ul.addEventListener('click', setPriority);
  $('#main').insertBefore(list_ul, formAddTodo);
  renderListOption(listObj);
}

export function renderListOption(listObj) {
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

export function openList(e) {
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

export function updateList(e) {
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
  // saveToStorage();
  e.currentTarget.reset();
  $('#editListFormContainer').classList.remove('is-active');
}

export function deleteList(listObj) {
  const listNavLink = $(`a[href="#${listObj.id}"]`);
  const listNavItem = listNavLink.parentNode;
  const listElement = listObj.elem;

  // Delete list object
  const listIndex = todoLists.indexOf(listObj);
  todoLists.splice(listIndex, 1);
  // saveToStorage();

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

export function displayList(listObj) {
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

export function toggleContent(e) {
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


export function deleteTask(listObj, taskId) {
  const currentTask = listObj.getTask(taskId);
  const todoItem = currentTask.elem;
  const taskIndex = listObj.findTaskIndex(taskId);
  const ulActiveList = $('.is-active-list');
  listObj.tasks.splice(taskIndex, 1);
  // saveToStorage();

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