/*
 * Each action passes a payload to a mutation, which in turn, commits the data to store
 * The context is the instance of the Store class
 * The payload is passed in by whatever dispatches the action
 */

export default {
  loadLists(context, payload) {
    context.commit('loadLists', payload);
  },
  addList(context, payload) {
    context.commit('addList', payload);
  },

  deleteList(context, payload) {
    context.commit('deleteList', payload);
  },

  renameList(context, payload) {
    context.commit('renameList', payload);
  },

  addTask(context, payload) {
    context.commit('addTask', payload);
  },

  editTask(context, payload) {
    context.commit('editTask', payload);
  },

  toggleTaskCompletion(context, payload) {
    context.commit('toggleTaskCompletion', payload);
  },
  setTaskPriority(context, payload) {
    context.commit('setTaskPriority', payload);
  },
  addTag(context, payload) {
    context.commit('addTag', payload);
  },
  removeTag(context, payload) {
    context.commit('removeTag', payload);
  },
  addSubtask(context, payload) {
    context.commit('addSubtask', payload);
  },
  editSubtask(context, payload) {
    context.commit('editSubtask', payload);
  },
  setDueDate(context, payload) {
    
  }
};
