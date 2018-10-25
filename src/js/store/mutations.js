import { saveToStorage } from '../lib/helpers.js';

export default {
  addList(state, payload) {
    state.todoLists.push(payload);
    saveToStorage();

    return state;
  }
};