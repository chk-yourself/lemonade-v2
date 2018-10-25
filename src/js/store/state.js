import List from '../components/List.js';
import Task from '../components/Task.js';

// Converts JSON list and task objects back to instances of original classes
export function initClasses(arr) {
  return arr.map((item) => {
    const list = new List(null, null, item);
    list.tasks = item.tasks.map((task) => new Task(null, task));
    return list;
  });
}

export default {
  todoLists: localStorage.getItem('todoLists')
    ? initClasses(JSON.parse(localStorage.getItem('todoLists')))
    : [],
  activeList: null,
  filteredList: null,
  activeTask: null,
  nextOnboardingStep: null,
  onboarding: {
    currentStep: null,
    statusLog: [false, false, false],
    get isCompleted() {
      return this.statusLog.every((status) => status === true);
    },
    get nextStep() {
      return this.isCompleted
        ? 4
        : this.currentStep === 3
          ? this.statusLog.indexOf(false) + 1
          : this.statusLog.indexOf(false, this.currentStep) + 1;
    },
    set updateStatus(val) {
      this.statusLog[this.currentStep - 1] = val;
    }
  }
};
