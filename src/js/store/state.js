// Initial state

export default {
  listsById: {
    inbox: {
      id: 'inbox',
      name: 'Inbox',
      folder: null,
      taskIds: [],
      elem: document.getElementById('inbox')
    }
  },
  tasksById: {},
  tagsByText: {},
  settings: {
    isNewUser: true,
    visibilityFilter: 'all',
    searchFilter: '',
    onboarding: {
      nextStep: null,
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
  },
  activeViews: {
    list: null,
    task: null
  }
};
