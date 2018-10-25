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
  const accordion = $('.accordion');
  const accordionItems = accordion.getElementsByClassName('accordion__item');
  const selectedPanel = e.currentTarget.querySelector('.accordion__panel');
  for (let i = 0; i < accordionItems.length; i++) {
    if (accordionItems[i] === selectedPanel.parentNode) {
      accordionItems[i].classList.toggle('is-active');
    }
  }
}