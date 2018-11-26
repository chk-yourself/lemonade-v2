import store from '../store/index.js';
import Component from '../lib/Component.js';
import { $, createNode, ul } from '../lib/helpers.js';
import * as selectors from '../store/selectors.js';

export default class App extends Component {
  constructor() {
    super({
      store
    });
  }

  addTodo(e) {
    e.preventDefault();
    const target = e.currentTarget;
    const listId = selectors.getActiveList;
    const ulActiveList = $('.is-active-list');

    const text = $('#todoInput').value;
    if (text !== '') {
      store.dispatch('addTask', listId, text);
    }
    target.reset();
    if (target.offsetTop >= window.innerHeight) {
      $('#todoInput').scrollIntoView(true);
      $('#todoInput').focus();
    }
  }

  init() {
    $('#addTodoForm').addEventListener('submit', (e) => this.addTodo(e));
  }

  render() {
    const state = store.getState();
    const lists = selectors.getLists(state);
    const main = $('#main');
    const formAddTodo = $('#addTodoForm');
    const ul = ul({
      class: 'todo-list custom-list',
      id: this.id,
      'data-name': this.name
    });
    // should render list elements and nav elements
  }
}

function createList(listObj) {
  const list_ul = createNode('ul', {
    class: 'todo-list custom-list',
    id: listObj.id,
    'data-name': listObj.name
  });
  list_ul.addEventListener('click', toggleDone);
  $('#main').insertBefore(list_ul, formAddTodo);
  renderListOption(listObj);
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

function getListByTaskId(todoId) {
  return todoLists.find((list) =>
    list.tasks.find((task) => task.id === todoId)
  );
}
