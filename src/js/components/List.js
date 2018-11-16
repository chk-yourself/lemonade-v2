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

  render() {
    if (!document.getElementById(this.id)) {
      this.elem.addEventListener('click', toggleDone);
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
