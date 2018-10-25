// Generates unique ID string, used for identifying todo items.
export const uniqueID = () =>
  +Date.now() +
  Math.random()
    .toString(36)
    .slice(2);

// Returns string in camelCase format
export const camelCased = (text) =>
  text
    .trim()
    .replace(/[^A-Za-z0-9 ]/g, '')
    .split(' ')
    .map(
      (str, i) =>
        i === 0
          ? str.toLowerCase()
          : str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    )
    .join('');

/**
 * Selects single DOM element by id or class name(s)
 * @param {string} selector - selector(s) using valid CSS syntax to match against element
 * @param {Node} [context =document] - optional baseElement, of which the element is a descendant
 * @param {boolean} [all =false] - false to match single element; true to match all elements
 * @returns {Node} The first element found that matches the selector(s)
 */
export function $(selector, context = document) {
  // Checks if selector matches single CSS id selector syntax and context is set to document
  return /^#[\w-]+$/.test(selector) && context === document
    ? context.getElementById(selector.slice(1))
    : context.querySelector(selector);
}

export function $all(selector, context = document) {
  return context.querySelectorAll(selector);
}

export const clickTouch = () =>
  'ontouchstart' in document === true ? 'touchstart' : 'click';

/**
 * Creates HTML element with specified tagName, attributes and child nodes.
 * @param {string} tagName - The type of HTML element to create
 * @param {Object} attributes - HTML attributes, written as key/value pairs, including:
 *   - CSS classes (separate multiple classes with a single space)
 *   - data-* attributes (remember to enclose data- attribute name in quotes)
 * @param {string|Node} ...children - Child nodes to append; a string represents a Text node
 * @returns {Node} The new HTML element
 * @example
 * // `recipe` represents the following:
 * `<ul class="recipe" id="recipe-01">
 *    <li class="li ingredient" data-unit="tsp">1 tsp salt</li>
 * </ul>`
 * let ingredient = createNode('li', {class: 'li ingredient', 'data-unit': 'tsp'}, '1 tsp salt');
 * let recipe = createNode('ul', {class: 'recipe', id: 'recipe-01'}, ingredient);
 */
export const createNode = (tagName, attributes, ...children) => {
  const node = document.createElement(tagName);

  if (attributes) {
    Object.keys(attributes).forEach((key) => {
      if (key === 'class') {
        const classes = attributes[key].split(' ');
        classes.forEach((x) => node.classList.add(x));
      } else if (/^data-/.test(key)) {
        const dataProp = key
          .slice(5) // removes `data-`
          .split('-')
          .map(
            (str, i) =>
              i === 0
                ? str
                : str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
          )
          .join('');
        node.dataset[dataProp] = attributes[key];
      } else {
        node.setAttribute(key, attributes[key]);
      }
    });
  }

  children.forEach((child) => {
    if (typeof child === 'undefined' || child === null) {
      return;
    }
    if (typeof child === 'string') {
      node.appendChild(document.createTextNode(child));
    } else {
      node.appendChild(child);
    }
  });

  return node;
};

// Resizes text inputs and textareas to show all content within
export function autoHeightResize(elem) {
  elem.style.height = '0px';
  elem.style.height = `${elem.scrollHeight}px`;
}
