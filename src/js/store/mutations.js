import { camelCased, $, createNode, uniqueID } from '../lib/helpers.js';

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
    const list = { ...payload };
    const id = `${camelCased(list.name)}-${list.createdAt}`;
    return {
      ...state,
      listsById: {
        ...state.listsById,
        [id]: {
          id,
          name: list.name,
          folder: list.folder,
          taskIds: []
        }
      }
    };
  },

  deleteList(state, payload) {
    const { listId } = payload;
    const taskIds = [...state.listsById[listId].taskIds];
    const newState = {
      ...state,
      listsById: {
        ...state.listsById
      },
      tasksById: {
        ...state.tasksById
      }
    };
    delete newState.listsById[listId];
    taskIds.forEach((taskId) => {
      delete newState.tasksById[taskId];
    });
    return newState;
  },

  renameList(state, payload) {
    const { listId, name } = payload;
    return {
      ...state,
      listsById: {
        ...state.listsById,
        [listId]: {
          ...state.listsById[listId],
          name
        }
      }
    };
  },

  // Task Reducers

  addTask(state, payload) {
    const task = { ...payload };
    return {
      ...state,
      listsById: {
        ...state.listsById,
        [task.listId]: {
          ...state.listsById[task.listId],
          taskIds: state.listsById[task.listId].taskIds.concat(task.taskId)
        }
      },
      tasksById: {
        ...state.tasksById,
        [task.taskId]: {
          id: task.taskId,
          listId: task.listId,
          text: task.text,
          dateCreated: task.dateCreated,
          isDone: false,
          subtasks: [],
          note: '',
          tags: [],
          dueDate: null,
          isPriority: false,
          lastModified: null
        }
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

  toggleTaskDone(state, payload) {
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
    };
  },

  toggleTaskPriority(state, payload) {
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
    const tag = { ...payload };
    const count = !state.tagsByText[tag.text]
      ? 0
      : state.tagsByText[tag.text].count + 1;
    return {
      ...state,
      tasksById: {
        ...state.tasksById,
        [tag.taskId]: {
          ...state.tasksById[tag.taskId],
          tags: state.tasksById[tag.taskId].tags.concat(tag.text)
        }
      },
      tagsByText: {
        ...state.tagsByText,
        [tag.text]: {
          ...state.tagsByText[tag.text],
          color: tag.color,
          count
        }
      }
    };
  },

  removeTag(state, payload) {
    const tag = { ...payload };
    const count = state.tagsByText[tag.tagText].count - 1;
    const newState = {
      ...state,
      tasksById: {
        ...state.tasksById,
        [tag.taskId]: {
          ...state.tasksById[tag.taskId],
          tags: state.tasksById[tag.taskId].tags.filter(
            (item) => item.text !== tag.tagText
          )
        }
      },
      tagsByText: {
        ...state.tagsByText,
        [tag.tagText]: {
          ...state.tagsByText[tag.tagText],
          count
        }
      }
    };
    if (count === 0) {
      delete newState.tagsByText[tag.tagText];
    }
    return newState;
  },

  addSubtask(state, payload) {
    const subtask = { ...payload };
  },

  editSubtask(state, payload) {},

  setDueDate(state, payload) {},

  setActiveList(state, payload) {
    return {
      ...state,
      activeViews: {
        ...state.activeViews,
        list: payload.listId
      }
    };
  },
  setActiveTask(state, payload) {
    return {
      ...state,
      activeViews: {
        ...state.activeViews,
        task: payload.taskId
      }
    };
  }
};
