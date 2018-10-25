export default {
  addList(state, payload) {
    return Object.assign({}, state, {
      todoLists: [
        ...state.todoLists,
        payload
      ]
    });
  },

  deleteList(state, payload) {
    return Object.assign({}, state, {
      todoLists: state.todoLists.filter(list => list.id !== payload.listID)
    });
  },

  addTask(state, payload) {

    return Object.assign({}, state, {
      todoLists: state.todoLists.map(list => list.id !== payload.listID ? list : Object.assign({}, ...list, {
        tasks: list.tasks.concat(payload.task)
      })
      )
    });
  },

  deleteTask(state, payload) {
    return Object.assign({}, state, {
      todoLists: state.todoLists.map(list => list.id !== payload.listID ? list : Object.assign({}, ...list, {
        tasks: list.tasks.filter(task => task.id !== payload.taskID)
      })
      )
    });
}
}