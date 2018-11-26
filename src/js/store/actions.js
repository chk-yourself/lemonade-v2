import { uniqueID } from '../lib/helpers.js';

/*
 * Each action passes a payload to a mutation, which in turn, commits the data to store
 * The context is the instance of the Store class
 * The payload is passed in by whatever dispatches the action
 * The payload is represented as an array of arguments
 */

export default {
  // Lists
  loadLists(context, payload) {
    const [lists] = payload;
    context.commit('loadLists', { lists });
  },

  addList(context, payload) {
    const [name, folder] = payload;
    context.commit('addList', { name, folder, createdAt: Date.now() });
  },

  deleteList(context, payload) {
    const [listId] = payload;
    context.commit('deleteList', { listId });
  },

  renameList(context, payload) {
    const [listId, name] = payload;
    context.commit('renameList', { listId, name });
  },
  // Tasks
  addTask(context, payload) {
    const [listId, text] = payload;
    context.commit('addTask', {
      listId,
      text,
      taskId: uniqueID(),
      dateCreated: new Date()
    });
  },

  deleteTask(context, payload) {
    const [listId, taskId] = payload;
    context.commit('deleteTask', { listId, taskId });
  },

  editTask(context, payload) {
    context.commit('editTask', payload);
  },

  toggleTaskDone(context, payload) {
    const [taskId] = payload;
    context.commit('toggleTaskDone', { taskId });
  },

  toggleTaskPriority(context, payload) {
    const [taskId] = payload;
    context.commit('toggleTaskPriority', { taskId });
  },
  // Tags
  addTag(context, payload) {
    const [taskId, tagText, color] = payload;
    context.commit('addTag', { taskId, tagText, color });
  },

  removeTag(context, payload) {
    const [taskId, tagText] = payload;
    context.commit('removeTag', { taskId, tagText });
  },

  setTagColor(context, payload) {
    const [tagText] = payload;
    context.commit('setTagColor', { tagText });
  },
  // Subtasks
  addSubtask(context, payload) {
    const [taskId, text] = payload;
    context.commit('addSubtask', { taskId, text });
  },

  editSubtask(context, payload) {
    context.commit('editSubtask', payload);
  },

  setDueDate(context, payload) {
    context.commit('setDueDate', payload);
  },

  setActiveList(context, payload) {
    const [listId] = payload;
    context.commit('setActiveList', { listId });
  },

  setActiveTask(context, payload) {
    const [taskId] = payload;
    context.commit('setActiveTask', { taskId });
  }
};
