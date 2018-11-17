// Helper functions that return state data to views in a more digestible format

export const getAllListIds = (state) => {
  const lookup = state.listsById;
  return Object.keys(lookup);
}

export const getAllFolders = (state) => {
  const lookup = state.listsById;
  const listIds = Object.keys(lookup);
  return listIds
    .map((id) => lookup[id].folder)
    .filter((folder, i, arr) => arr.indexOf(folder) === i);
};

export const getListsByFolder = (state) => {
  const lookup = state.listsById;
  const listIds = Object.keys(lookup);
  return listIds.reduce((listsByFolder, id) => {
    const folder = lookup[id].folder;
    if (!listsByFolder[folder]) {
      listsByFolder[folder] = [];
    }
    listsByFolder[folder].push(id);
    return listsByFolder;
  }, {});
};

export const getAllTaskIds = (state) => {
  const lookup = state.tasksById;
  return Object.keys(lookup);
}

export const getTasksByDueDate = (state) => {
  const lookup = state.tasksById;
  const taskIds = Object.keys(lookup);
  return taskIds.reduce((tasksByDueDate, id) => {
    const dueDate = new Date(lookup[id].dueDate).valueOf();
    if (dueDate !== null) {
      if (!tasksByDueDate[dueDate]) {
        tasksByDueDate[dueDate] = [];
      }
      tasksByDueDate[dueDate].push(id);
    }
    return tasksByDueDate;
  }, {});
};