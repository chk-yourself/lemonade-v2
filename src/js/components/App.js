import store from '../store/index.js';
import Component from '../lib/Component.js';

export default class App extends Component {
  constructor() {
    super({
      store
    });
  }

  render() {
    
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

  function init() {

  }

  return {
    init: init
  };