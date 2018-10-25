const saveToStorage = (state) =>
  localStorage.setItem('todoLists', JSON.stringify(state.todoLists));

export default {
  addList(state, payload) {
    state.todoLists.push(payload);
    saveToStorage(state);

    return state;
  },

  deleteList(state, payload) {
    state.todoLists = state.todoLists.filter(list => list.id !== payload.listID);
    saveToStorage(state);

    return state;
  },

  addTask(state, payload) {
    const list = state.todoLists.find(list => list.id === payload.listID);
    list.tasks = list.tasks.concat(payload.task);
    saveToStorage(state);

    return state;
  },

  deleteTask(state, payload) {
    const list = state.todoLists.find(list => list.id === payload.listID);
    list.tasks = list.tasks.filter(task => task.id !== payload.taskID);
    saveToStorage(state);

    return state;
  }
};