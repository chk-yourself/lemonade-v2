// Pure functions that return a new state object, without mutating the original state object

export default {
  
  // List reducers

  loadLists(state, payload) {
    return {
      ...state,
      listsById: payload.lists
    };
  },
  addList(state, payload) {
    const { list } = payload;
    return {
      ...state,
      listsById: {
        ...state.listsById,
        [list.id]: list
      }
    };
  },

  deleteList(state, payload) {
    const { listId } = payload;
    const taskIds = state.listsById[listId].taskIds;
    const newState = {
      ...state,
      listsById: {
        ...state.listsById
      },
      tasksById: Object.keys(state.tasksById).reduce((acc, key) => {
          if (taskIds.indexOf(key) === -1) {
            acc[key] = state.tasksById[key];
          }
          return acc;
        }, {})
    };
    delete newState.listsById[listId];
    return newState;
  },

  renameList(state, payload) {
    const { listId, listName } = payload;
    return {
      ...state,
      listsById: {
        ...state.listsById,
        [listId]: {
          ...state.listsById[listId],
          name: listName
        }
      }
    };
  },

  // Task Reducers

  addTask(state, payload) {
    const { listId, task } = payload;
    const taskId = task.id;
    return {
      ...state,
      listsById: {
        ...state.listsById,
        [listId]: {
          ...state.listsById[listId],
          taskIds: state.listsById[listId].taskIds.concat(taskId)
        }
      },
      tasksById: {
          ...state.tasksById,
          [taskId]: task
        }
      };
  },

  deleteTask(state, payload) {
    const { listId, taskId } = payload;
    const newState = {
      ...state,
      listsById: {
        ...state.listsById,
        [listId]: {
          ...state.listsById[listId],
          taskIds: state.listsById[listId].taskIds.filter((id) => id !== taskId)
        }
      },
      tasksById: {
        ...state.tasksById
      }
    };
    delete newState.tasksById[taskId];
    return newState;
  },

  toggleTaskCompletion(state, payload) {
    const { taskId } = payload;
    return {
      ...state,
      tasksById: {
        ...state.tasksById,
        [taskId]: {
          ...state.tasksById[taskId],
          isDone: !state.tasksById[taskId].isDone
        }
      }
    }
  },

  setTaskPriority(state, payload) {
    const { taskId } = payload;
    return {
      ...state,
      tasksById: {
        ...state.tasksById,
        [taskId]: {
          ...state.tasksById[taskId],
          isPriority: !state.tasksById[taskId].isPriority
        }
      }
    };
  },

  addTag(state, payload) {
    const { taskId, tag } = payload;
    const count = !state.tagsByText[tag.text] ? 0 : ++state.tagsByText[tag.text].count
    return {
      ...state,
      tasksById: {
        ...state.tasksById,
        [taskId]: {
          ...state.tasksById[taskId],
          tags: state.tasksById[taskId].tags.concat(tag)
        }
      },
      tagsByText: {
        ...state.tagsByText,
        [tag.text]: {
          ...state.tagsByText[tag.text],
          count
        }
      }
    };
  },

  removeTag(state, payload) {
    const { taskId, tagText } = payload;
    const count = --state.tagsByText[tag.text].count;
    const newState = {
      ...state,
      tasksById: {
        ...state.tasksById,
        [taskId]: {
          ...state.tasksById[taskId],
          tags: state.tasksById[taskId].tags.filter((tag) => tag.text !== tagText)
        }
      },
      tagsByText: {
        ...state.tagsByText,
        [tag.text]: {
          ...state.tagsByText[tag.text],
          count
        }
      }
    };
    if (count === 0) {
      delete newState.tagsByText[tag.text];
    }
    return newState;
  },

  addSubtask(state, payload) {

  },

  editSubtask(state, payload) {

  },

  setDueDate(state, payload) {
    
  }

};
