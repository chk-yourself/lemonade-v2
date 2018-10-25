import {
  $
} from '../lib/helpers.js';

export default function expandSearchBar(e) {
  const searchBar = $('#searchBar');
  const inputSearch = $('#searchInput');

  e.stopPropagation();
  if (e.target === inputSearch) return;
  if (!searchBar.classList.contains('is-expanded')) {
    e.preventDefault();
    searchBar.classList.add('is-expanded');
    $('#searchInput').focus();
  } else if (
    searchBar.classList.contains('is-expanded') &&
    inputSearch.value == ''
  ) {
    searchBar.classList.remove('is-expanded');
  }
}

import { store } from '../store/index.js';

export default class SearchBar extends Component {
  constructor() {
    super({
      store
    });
  }

  render() {
    
  }
}
