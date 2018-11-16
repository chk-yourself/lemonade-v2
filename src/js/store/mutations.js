export default {
  addList(state, payload) {
    return {
      ...state,
      todoLists: state.todoLists.concat(payload.list)
    };
  },

  deleteList(state, payload) {
    return {
      ...state,
      todoLists: state.todoLists.filter((list) => list.id !== payload.listId)
    };
  },

  renameList(state, payload) {
    return {
      ...state,
      todoLists: state.todoLists.map(
        (list) =>
          list.id !== payload.listId
            ? list
            : {
                ...list,
                name: payload.listName
              }
      )
    };
  },

  addTask(state, payload) {
    return Object.assign({}, state, {
      todoLists: state.todoLists.map(
        (list) =>
          list.id !== payload.listId
            ? list
            : Object.assign({}, ...list, {
                tasks: list.tasks.concat(payload.task)
              })
      )
    });
  },

  deleteTask(state, payload) {
    return Object.assign({}, state, {
      todoLists: state.todoLists.map(
        (list) =>
          list.id !== payload.listId
            ? list
            : Object.assign({}, ...list, {
                tasks: list.tasks.filter((task) => task.id !== payload.taskId)
              })
      )
    });
  }
};
