import store from '../store/index.js';
import Component from '../lib/Component.js';

export default class Onboarding extends Component {
  constructor() {
    super({
      store
    });
  }

  render() {
    
  }
}

function continueTour(e) {
  const el = e.target;
  if (!el.classList.contains('onboarding__btn')) return;
  const modal = e.currentTarget;
  const action = el.dataset.action;
  const ulActiveList = $('.is-active-list');

  if (action === 'beginTour') {
    $('.onboarding__footer', modal).classList.add('is-active');
    // Refresh completion status for all steps if tour is retaken
    $all('.onboarding__stepper .stepper__btn').forEach((btn) =>
      btn.classList.remove('is-completed')
    );
    state.onboarding.statusLog.forEach((status, i, arr) => (arr[i] = false));
    state.onboarding.currentStep = 0;
  }

  const currentStep = state.onboarding.currentStep;
  const nextStep = state.onboarding.nextStep;

  if (action === 'endTour') {
    state.onboarding.currentStep = null;
    // Delete dummy tasks created in Step 3
    const noDummyTasks = state.activeList.tasks.filter(
      (task) => task.text !== 'Delete Me!'
    );
    state.activeList.tasks = noDummyTasks;
    renderList(state.activeList.tasks, ulActiveList);
    $all('.onboarding__step').forEach((section) => {
      let step = +section.dataset.onboardingStep;
      if (step === 0) {
        section.classList.add('is-active');
      } else {
        section.classList.remove('is-active');
      }
    });
    $('.onboarding__footer', modal).classList.remove('is-active');
  } else {
    if (action === 'activateTooltips') {
      modal.classList.remove('is-active');
      if (currentStep === 1) {
        formAddTodo.appendChild($('#onboardingTooltip_1-1'));
      }
      $(
        `.onboarding__tooltip[data-onboarding-step="${currentStep}"][data-order="0"]`
      ).classList.add('show-tooltip');
      const target = $(`[data-onboarding-target="${currentStep}"]`);
      // Set up first interaction point for current onboarding step
      if (target.tagName === 'FORM') {
        target.addEventListener('submit', trackTourProgress);
      } else {
        target.addEventListener('click', trackTourProgress);
      }
    } else {
      console.log({ nextStep });
      // Show next section
      $all('.onboarding__step').forEach((section) => {
        let step = +section.dataset.onboardingStep;
        if (step === nextStep) {
          section.classList.add('is-active');
        } else {
          section.classList.remove('is-active');
        }
      });

      // Set stepper btn to active

      $all('.onboarding__stepper .stepper__btn').forEach((btn, i) => {
        if (i === nextStep - 1) {
          btn.classList.add('is-active');
        } else {
          btn.classList.remove('is-active');
        }
      });
      // Updates state, looping the tour back to the beginning, if it reaches the end (step 4)
      state.onboarding.currentStep = state.onboarding.nextStep;
    }
  }
}

function trackTourProgress(e) {
  console.log(state.onboarding.nextStep);
  const target = e.currentTarget;
  const tooltip = $('.onboarding__tooltip.show-tooltip');
  const currentStep = state.onboarding.currentStep;
  const ulActiveList = $('.is-active-list');
  const tooltipSet = Array.prototype.slice
    .call($all(`.onboarding__tooltip[data-onboarding-step="${currentStep}"]`))
    .sort((a, b) => {
      return +a.dataset.order - +b.dataset.order;
    });

  target.removeEventListener(e.type, trackTourProgress);

  if (currentStep === null) return;

  // Set up interaction points
  /**
   * Step 1
   */
  // Part 1
  if (target === formAddTodo) {
    // Attach tooltip for Step 2 to first todo item
    const firstTask = $('.is-active-list .todo-list__item');
    firstTask.appendChild($('#onboardingTooltip_1-2'));
    firstTask.addEventListener('click', trackTourProgress);
  }
  // Part 2
  if (target.classList.contains('todo-list__item')) {
    $('.task-details__header').appendChild($('#onboardingTooltip_1-3'));
    $('#btnCloseTaskDetails').addEventListener('click', trackTourProgress);
  }

  /**
   *  Step 2
   */
  // Part 1
  if (target.classList.contains('sidebar__btn--toggle-open')) {
    $('.sidebar__buttons').insertBefore(
      $('#onboardingTooltip_2-2'),
      $('#helpActionsWrapper')
    );
    $('#openListFormBtn').addEventListener('click', trackTourProgress);
  }

  // Part 2

  if (target === $('#openListFormBtn')) {
    $('#fieldsetNewListInput').appendChild($('#onboardingTooltip_2-3'));
    $('#newListNameInput').addEventListener('input', trackTourProgress);
  }

  // Part 3
  if (target === $('#newListNameInput')) {
    $('#fieldsetFolders').appendChild($('#onboardingTooltip_2-4'));
    $('#newListForm').addEventListener('submit', trackTourProgress);
  }

  // Part 4

  if (target === $('#newListForm')) {
    $('#listActionsWrapper').appendChild($('#onboardingTooltip_3-1'));
  }

  /**
   *  Step 3
   */
  // Part 1
  if (target.classList.contains('list-actions__btn--toggle')) {
    $('#bulkActionsToolbar').appendChild($('#onboardingTooltip_3-2'));
    $('#onboardingTooltip_3-2').classList.add('show-tooltip');
    $('#btnInitBulkEditing').addEventListener('click', trackTourProgress);
  }
  // Part 2

  if (target === $('#btnInitBulkEditing')) {
    // Create dummy tasks for user to delete
    for (let i = 0; i < 3; i++) {
      let dummyTask = new Task('Delete Me!');
      state.activeList.tasks.push(dummyTask);
    }
    populateList(state.activeList.tasks, ulActiveList);
    $('#masterCheckbox').addEventListener('change', trackTourProgress);
    return;
  }

  if (target === $('#masterCheckbox')) {
    $('#bulkActionsToolbar').appendChild($('#onboardingTooltip_3-3'));
    $('#btnDeleteSelected').addEventListener('click', trackTourProgress);
  }

  // Close active tooltip
  tooltip.classList.remove('show-tooltip');
  // Ensure tooltip doesn't get deleted
  divTodoApp.appendChild(tooltip);

  // If current tooltip is not the last one in the set, activate the next one
  if (tooltip !== tooltipSet[tooltipSet.length - 1]) {
    tooltipSet.forEach((item, i, arr) => {
      if (item === tooltip) {
        arr[i + 1].classList.add('show-tooltip');
      }
    });
    return;
  }

  const nextStep = state.onboarding.nextStep;

  // Mark step as completed
  $all('.onboarding__stepper .stepper__btn').forEach((btn, i) => {
    if (i === currentStep - 1) {
      btn.classList.remove('is-active');
      btn.classList.add('is-completed');
    } else if (i === nextStep - 1) {
      btn.classList.add('is-active');
    }
  });

  // Update step status
  state.onboarding.updateStatus = true;
  if (state.onboarding.isCompleted) {
    $('.onboarding__footer').classList.remove('is-active');
  }

  // Proceed to next step of tour
  $all('.onboarding__step').forEach((section, i) => {
    if (i === state.onboarding.nextStep) {
      section.classList.add('is-active');
    } else {
      section.classList.remove('is-active');
    }
  });

  // Reopen modal
  $('#onboarding').classList.add('is-active');

  // Update state
  state.onboarding.currentStep = state.onboarding.nextStep;
}

function selectStep(e) {
  $all('.onboarding__stepper .stepper__btn').forEach((btn, i) => {
    if (e.target === btn) {
      state.onboarding.currentStep = i + 1;

      $all('.onboarding__step').forEach((section) => {
        let step = +section.dataset.onboardingStep;
        if (step === state.onboarding.currentStep) {
          section.classList.add('is-active');
        } else {
          section.classList.remove('is-active');
        }
      });
      btn.classList.add('is-active');
    } else {
      btn.classList.remove('is-active');
    }
  });
}