function initClasses(arr) {
  return arr.map((item) => {
    const list = new List(null, null, item);
    list.tasks = item.tasks.map((task) => new Task(null, task));
    return list;
  });
}

export default const App = (function() {

  const state = {
    todoLists: localStorage.getItem('todoLists')
    ? initClasses(JSON.parse(localStorage.getItem('todoLists')))
    : [],
    activeList: null,
    filteredList: null,
    openTask: null,
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

})();