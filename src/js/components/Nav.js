import { $, $all, createNode } from '../lib/helpers.js';

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