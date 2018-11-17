import { $, $all, createNode } from '../lib/helpers.js';
import Component from '../lib/Component.js';
import * as selectors from '../store/selectors.js';
import store from '../store/index.js';
import {openList} from './List.js';

export function toggleMenu() {
  const siteWrapper = document.getElementById('siteWrapper');

  if (siteWrapper.classList.contains('show-nav')) {
    siteWrapper.classList.remove('show-nav');
  } else {
    siteWrapper.classList.add('show-nav');
  }
}

export function displayPanel(e) {
  if (!e.target.classList.contains('accordion__item')) return;
  const el = e.target;
  const accordion = e.currentTarget;
  const accordionItems = $all('.accordion__item', accordion);
  const selectedPanel = $('.accordion__panel', el);
  accordionItems.forEach((item) => {
    if (item === selectedPanel.parentNode) {
      item.classList.toggle('is-active');
    }
  });
}

export const createNavItem = (listObj, parentNode = $('#sidebarMenu')) => {
  const iListIcon = createNode('i', {
    'data-feather': 'list'
  });
  const spanListName = createNode(
    'span',
    {
      class: 'sidebar__list-name'
    },
    listObj.name
  );
  const spanTaskCount = createNode(
    'span',
    {
      class: 'sidebar__task-count'
    },
    listObj.activeTaskCount > 0 ? '' + listObj.activeTaskCount : ''
  );
  const aListLink = createNode(
    'a',
    {
      class: `sidebar__link${
        listObj.activeTaskCount > 0 ? ' has-active-tasks' : ''
      }`,
      href: `#${listObj.id}`
    },
    iListIcon,
    spanListName,
    spanTaskCount
  );
  aListLink.addEventListener('click', openList);
  const liItem = createNode(
    'li',
    {
      class: `${
        listObj.folder === null ? 'sidebar__item' : 'accordion__sub-item'
      }`
    },
    aListLink
  );
  if (listObj.folder === null) {
    parentNode.appendChild(liItem);
  } else {
    $(`[data-folder="${listObj.folder}"]`, parentNode).appendChild(liItem);
  }
  // Render feather icons
  feather.replace();
};

export function renderNavItems() {
  // Array of folder names
  const foldersArr = selectors.getAllFolders(store.state);
  const frag = document.createDocumentFragment();
  foldersArr.forEach((folder) => {
    if (folder == null) return;
    const ulFolderPanel = createNode('ul', {
      class: 'accordion__panel',
      'data-folder': folder
    });
    renderFolderOption(folder);
    const iFolderIcon = createNode('i', {
      'data-feather': 'folder'
    });
    const iChevronIcon = createNode('i', {
      class: 'chevron-icon',
      'data-feather': 'chevron-left'
    });
    const liFolder = createNode(
      'li',
      {
        class: 'sidebar__item accordion__item'
      },
      iFolderIcon,
      folder,
      iChevronIcon,
      ulFolderPanel
    );
    frag.appendChild(liFolder);

    // Creates accordion panel for each folder, with links to children underneath
    const folderItems = selectors.getListsByFolder(store.state)[folder];
    folderItems.forEach((item) => createNavItem(item, frag));
  });

  // Creates regular nav items for miscellaneous lists
  const miscLists = selectors.getListsByFolder(store.state)['null'];
  miscLists.forEach((item) => {
    if (item.id !== 'inbox') {
      createNavItem(item, frag);
    }
  });
  $('#sidebarMenu').appendChild(frag);

  // Render feather icons
  feather.replace();

  // Displays list on click
  const navLinksAll = $all('.sidebar__link');
  navLinksAll.forEach((link) => link.addEventListener('click', openList));
}