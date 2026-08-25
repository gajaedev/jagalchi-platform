import { createStore } from 'jotai';
import { describe, it, expect } from 'vitest';

import {
  breadcrumbPathAtom,
  searchQueryAtom,
  sortOrderAtom,
  sortByAtom,
  filterCategoryAtom,
  sidebarCategoryAtom,
} from './my-roadmaps.atoms';

describe('my-roadmaps atoms', () => {
  it('breadcrumbPathAtom starts empty', () => {
    const store = createStore();
    expect(store.get(breadcrumbPathAtom)).toEqual([]);
  });

  it('breadcrumbPathAtom can be updated', () => {
    const store = createStore();
    const id = '11111111-1111-4111-8111-111111111111';
    store.set(breadcrumbPathAtom, [{ id, name: 'Frontend' }]);
    expect(store.get(breadcrumbPathAtom)).toEqual([{ id, name: 'Frontend' }]);
  });

  it('searchQueryAtom defaults to empty string', () => {
    const store = createStore();
    expect(store.get(searchQueryAtom)).toBe('');
  });

  it('sortOrderAtom defaults to desc', () => {
    const store = createStore();
    expect(store.get(sortOrderAtom)).toBe('desc');
  });

  it('sortByAtom defaults to recent', () => {
    const store = createStore();
    expect(store.get(sortByAtom)).toBe('recent');
  });

  it('filterCategoryAtom defaults to all', () => {
    const store = createStore();
    expect(store.get(filterCategoryAtom)).toBe('all');
  });

  it('sidebarCategoryAtom defaults to my-roadmap', () => {
    const store = createStore();
    expect(store.get(sidebarCategoryAtom)).toBe('my-roadmap');
  });
});
