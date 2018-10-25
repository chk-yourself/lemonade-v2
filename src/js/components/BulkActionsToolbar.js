import { $, $all, createNode } from '../lib/helpers.js';

export function stickToolbar(e) {
  const toolbar = $('#bulkActionsToolbar');
  const main = $('#main');
  if (main.scrollTop >= toolbar.offsetTop) {
    main.classList.add('sticky-toolbar');
  } else {
    main.classList.remove('sticky-toolbar');
  }
}

export function initBulkEditing(e) {
  // Hide add todo form
  $('#addTodoForm').classList.add('is-hidden');
  // Uncheck master bulk editing checkbox
  $('#masterCheckbox').checked = false;
  // Reveal bulk editing toolbar
  $('#bulkActionsToolbar').classList.add('is-active');
  // Add bulk-editing checkboxes and hide regular checkboxes for toggling completeness
  const ulActiveList = $('.is-active-list');
  ulActiveList.classList.add('bulk-editing-list');
  $all('.todo-list__item', ulActiveList).forEach((x, i) => {
    const frag = document.createDocumentFragment();
    const checkbox = createNode('input', {
      type: 'checkbox',
      id: `bulk-item-${i}`,
      'data-index': i,
      'data-id': x.id,
      class: 'bulk-actions__checkbox'
    });
    checkbox.addEventListener('change', highlightSelected);
    const checkboxLabel = createNode('label', {
      class: 'bulk-actions__checkbox-label',
      for: `bulk-item-${i}`
    });
    frag.appendChild(checkbox);
    frag.appendChild(checkboxLabel);
    x.insertBefore(frag, $('input[type="checkbox"]', x));
    $('.todo-list__checkbox', x).classList.add('is-hidden');
    x.classList.add('bulk-editing-list__item');
  });
  // Disable bulk action buttons
  $all('.toolbar__btn[data-bulk-action="true"]').forEach(
    (btn) => (btn.disabled = true)
  );
  ulActiveList.addEventListener('click', enableBulkActions);
  $('#main').addEventListener('scroll', stickToolbar);
}

export function highlightSelected(e) {
  const todoItem = e.currentTarget.parentNode;
  if (e.currentTarget.checked === true) {
    todoItem.classList.add('is-checked');
  } else {
    todoItem.classList.remove('is-checked');
  }
}

// Disables/Enables bulk action buttons, depending on if items are checked
export function enableBulkActions(e) {
  const ulActiveList = $('.is-active-list');
  const checkedItems = $all('.bulk-actions__checkbox:checked', ulActiveList);
  const allItems = $all('.bulk-actions__checkbox', ulActiveList);
  const bulkActions = $all('.toolbar__btn[data-bulk-action="true"]');
  const masterCheckbox = $('#masterCheckbox');
  // If no items are selected...
  if (checkedItems.length === 0) {
    // Disable bulk action buttons
    bulkActions.forEach((btn) => (btn.disabled = true));
    // Uncheck master checkbox
    if (masterCheckbox.checked === true) {
      masterCheckbox.checked = false;
    }
  } else {
    // Enable bulk action buttons
    bulkActions.forEach((btn) => (btn.disabled = false));
    // If all items are selected, change state of master checkbox to true if unchecked
    if (
      checkedItems.length === allItems.length &&
      masterCheckbox.checked === false
    ) {
      masterCheckbox.checked = true;
    }
  }
}
