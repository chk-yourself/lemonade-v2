// Converts JSON list and task objects back to instances of original classes


export default {
  todoLists: JSON.parse(localStorage.getItem('todoLists')) || [],
  todos: JSON.parse(localStorage.getItem('todos')) || {},
  activeList: null,
  filteredList: null,
  visibilityFilter: 'all',
  searchFilter: '',
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
