const STORAGE_KEY = 'groceries_v1';

let state = load();
let currentTab = 'edit';
let editingId = null;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && Array.isArray(p.common) && Array.isArray(p.list)) return p;
    }
  } catch {}
  return { common: [], list: [] };
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2);
}

const now = () => Date.now();

function nameFor(item) {
  if (item.type === 'oneoff') return item.name;
  const c = state.common.find(c => c.id === item.commonId);
  return c ? c.name : '';
}

function listEntryForCommon(commonId) {
  return state.list.find(i => i.type === 'common' && i.commonId === commonId);
}

// Operations

function addOneOff(name) {
  const n = name.trim();
  if (!n) return;
  state.list.push({
    id: uid(),
    type: 'oneoff',
    name: n,
    checked: false,
    addedAt: now(),
    stateChangedAt: now()
  });
  save();
}

function toggleCommonOnList(commonId) {
  const idx = state.list.findIndex(i => i.type === 'common' && i.commonId === commonId);
  if (idx >= 0) {
    state.list.splice(idx, 1);
  } else {
    state.list.push({
      id: uid(),
      type: 'common',
      commonId,
      checked: false,
      addedAt: now(),
      stateChangedAt: now()
    });
  }
  save();
}

function promoteOneOff(listItemId) {
  const item = state.list.find(i => i.id === listItemId);
  if (!item || item.type !== 'oneoff') return;
  const commonId = uid();
  state.common.push({ id: commonId, name: item.name });
  item.type = 'common';
  item.commonId = commonId;
  delete item.name;
  save();
}

function demoteCommon(commonId) {
  const c = state.common.find(c => c.id === commonId);
  if (!c) return;
  for (const item of state.list) {
    if (item.type === 'common' && item.commonId === commonId) {
      item.type = 'oneoff';
      item.name = c.name;
      delete item.commonId;
    }
  }
  state.common = state.common.filter(x => x.id !== commonId);
  save();
}

function deleteCommon(commonId) {
  state.common = state.common.filter(c => c.id !== commonId);
  state.list = state.list.filter(i => !(i.type === 'common' && i.commonId === commonId));
  save();
}

function removeOneOff(listItemId) {
  state.list = state.list.filter(i => i.id !== listItemId);
  save();
}

function renameCommon(commonId, newName) {
  const n = newName.trim();
  if (!n) return;
  const c = state.common.find(c => c.id === commonId);
  if (c) c.name = n;
  save();
}

function renameOneOff(listItemId, newName) {
  const n = newName.trim();
  if (!n) return;
  const item = state.list.find(i => i.id === listItemId);
  if (item && item.type === 'oneoff') item.name = n;
  save();
}

function toggleChecked(listItemId) {
  const item = state.list.find(i => i.id === listItemId);
  if (!item) return;
  item.checked = !item.checked;
  item.stateChangedAt = now();
  save();
}

function clearChecked() {
  state.list = state.list.filter(i => !i.checked);
  save();
}

function clearAll() {
  state.list = [];
  save();
}

// DOM helpers

function el(tag, attrs, ...children) {
  const e = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    }
  }
  for (const c of children) {
    if (c == null || c === false) continue;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
}

// Rendering

function setTab(tab) {
  currentTab = tab;
  editingId = null;
  render();
}

function render() {
  document.querySelectorAll('.tab').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === currentTab);
  });
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.toggle('active', s.dataset.screen === currentTab);
  });
  if (currentTab === 'edit') renderEdit();
  else renderShop();
  if (editingId !== null && currentTab === 'edit' && !(document.activeElement instanceof HTMLInputElement)) {
    const input = document.querySelector('.edit-panel input');
    if (input) {
      input.focus();
      input.select();
      input.scrollIntoView({ block: 'nearest' });
    }
  }
}

function renderEdit() {
  const commonList = document.getElementById('common-list');
  const oneoffList = document.getElementById('oneoff-list');
  commonList.innerHTML = '';
  oneoffList.innerHTML = '';

  if (state.common.length === 0) {
    commonList.appendChild(el('li', { class: 'empty' }, 'No common items yet. Add an item below, then promote it.'));
  } else {
    for (const c of state.common) {
      commonList.appendChild(renderCommonRow(c, !!listEntryForCommon(c.id), editingId === c.id));
    }
  }

  const oneoffs = state.list.filter(i => i.type === 'oneoff');
  if (oneoffs.length === 0) {
    oneoffList.appendChild(el('li', { class: 'empty' }, 'No one-off items on the list.'));
  } else {
    for (const item of oneoffs) {
      oneoffList.appendChild(renderOneoffRow(item, editingId === item.id));
    }
  }
}

function renderCommonRow(c, onList, editing) {
  const li = el('li');
  const row = el('div', { class: 'row' + (onList ? ' on' : '') });
  row.appendChild(el('button', {
    class: 'row-main',
    type: 'button',
    onclick: () => { toggleCommonOnList(c.id); render(); }
  },
    el('span', { class: 'indicator' }, onList ? '\u2713' : ''),
    el('span', { class: 'name' }, c.name)
  ));
  row.appendChild(el('button', {
    class: 'edit-btn',
    type: 'button',
    'aria-label': 'Edit',
    onclick: () => { editingId = editing ? null : c.id; render(); }
  }, '\u270E'));
  li.appendChild(row);
  if (editing) li.appendChild(renderCommonEditPanel(c));
  return li;
}

function renderCommonEditPanel(c) {
  const input = el('input', { type: 'text', value: c.name, autocomplete: 'off' });
  const doSave = () => { renameCommon(c.id, input.value); editingId = null; render(); };
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); doSave(); }
    else if (e.key === 'Escape') { editingId = null; render(); }
  });
  return el('div', { class: 'edit-panel' },
    input,
    el('button', { class: 'primary', type: 'button', onclick: doSave }, 'Save'),
    el('button', { type: 'button', onclick: () => { demoteCommon(c.id); editingId = null; render(); } }, 'Demote'),
    el('button', { class: 'danger', type: 'button', onclick: () => {
      if (confirm('Delete "' + c.name + '" from common items?')) {
        deleteCommon(c.id); editingId = null; render();
      }
    } }, 'Delete'),
    el('button', { type: 'button', onclick: () => { editingId = null; render(); } }, 'Cancel')
  );
}

function renderOneoffRow(item, editing) {
  const li = el('li');
  const row = el('div', { class: 'row' });
  row.appendChild(el('div', { class: 'row-main' },
    el('span', { class: 'name' }, item.name)
  ));
  row.appendChild(el('button', {
    class: 'edit-btn',
    type: 'button',
    'aria-label': 'Edit',
    onclick: () => { editingId = editing ? null : item.id; render(); }
  }, '\u270E'));
  li.appendChild(row);
  if (editing) li.appendChild(renderOneoffEditPanel(item));
  return li;
}

function renderOneoffEditPanel(item) {
  const input = el('input', { type: 'text', value: item.name, autocomplete: 'off' });
  const doSave = () => { renameOneOff(item.id, input.value); editingId = null; render(); };
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); doSave(); }
    else if (e.key === 'Escape') { editingId = null; render(); }
  });
  return el('div', { class: 'edit-panel' },
    input,
    el('button', { class: 'primary', type: 'button', onclick: doSave }, 'Save'),
    el('button', { type: 'button', onclick: () => { promoteOneOff(item.id); editingId = null; render(); } }, 'Promote'),
    el('button', { class: 'danger', type: 'button', onclick: () => { removeOneOff(item.id); editingId = null; render(); } }, 'Remove'),
    el('button', { type: 'button', onclick: () => { editingId = null; render(); } }, 'Cancel')
  );
}

function renderShop() {
  const ul = document.getElementById('shop-list');
  ul.innerHTML = '';
  const unchecked = state.list.filter(i => !i.checked).sort((a, b) => a.stateChangedAt - b.stateChangedAt);
  const checked = state.list.filter(i => i.checked).sort((a, b) => b.stateChangedAt - a.stateChangedAt);
  const all = [...unchecked, ...checked];
  if (all.length === 0) {
    ul.appendChild(el('li', { class: 'empty' }, 'List is empty. Switch to Edit to add items.'));
    return;
  }
  for (const item of all) ul.appendChild(renderShopRow(item));
}

function renderShopRow(item) {
  const li = el('li');
  const row = el('div', { class: 'row' + (item.checked ? ' checked' : '') });
  row.appendChild(el('button', {
    class: 'row-main',
    type: 'button',
    onclick: () => { toggleChecked(item.id); render(); }
  },
    el('span', { class: 'indicator' }, item.checked ? '\u2713' : ''),
    el('span', { class: 'name' }, nameFor(item))
  ));
  li.appendChild(row);
  return li;
}

// Wire up

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => setTab(btn.dataset.tab));
  });
  const form = document.getElementById('add-form');
  const input = document.getElementById('add-input');
  form.addEventListener('submit', e => {
    e.preventDefault();
    addOneOff(input.value);
    input.value = '';
    input.focus();
    render();
  });
  document.getElementById('clear-checked').addEventListener('click', () => {
    clearChecked(); render();
  });
  document.getElementById('clear-all').addEventListener('click', () => {
    if (state.list.length === 0) return;
    if (confirm('Clear the entire shopping list?')) { clearAll(); render(); }
  });
  render();
});
