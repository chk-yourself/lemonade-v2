export default class List {
  constructor(name, folder, obj = null) {
    if (!obj) {
      this.name = name;
      this.folder = folder;
      this.id = `${camelCased(name)}-${Date.now()}`;
      this.tasks = [];
    } else {
      this.name = obj.name;
      this.folder = obj.folder;
      this.id = obj.id;
      this.tasks = obj.tasks;
    }
  }
  get elem() {
    return document.getElementById(this.id);
  }
  getTask(taskId) {
    return this.tasks.find((task) => task.id === taskId);
  }

  findTaskIndex(taskId) {
    return this.tasks.findIndex((task) => task.id === taskId);
  }
  get activeTaskCount() {
    return this.tasks.filter((task) => !task.done).length;
  }
}