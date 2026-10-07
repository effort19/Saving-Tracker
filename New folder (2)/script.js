(() => {
  const STORAGE_KEY = 'balance-tracker-v2';
  const OLD_KEY = 'balance-tracker-v1';

  const COLORS = [
    { id: 'navy',   a: '#27476E', b: '#101D31' },
    { id: 'teal',   a: '#12806F', b: '#0A3D3A' },
    { id: 'plum',   a: '#8E2C5A', b: '#3E1230' },
    { id: 'forest', a: '#3C7A3E', b: '#173A1D' },
    { id: 'slate',  a: '#56616D', b: '#252B33' },
    { id: 'indigo', a: '#4B49B0', b: '#1D1B55' },
  ];
  const gradientOf = (id) => {
    const c = COLORS.find((x) => x.id === id) || COLORS[0];
    return `linear-gradient(135deg, ${c.a}, ${c.b})`;
  };

  // Amounts are stored as integer cents to avoid floating-point errors.
  const defaultCurrency = (navigator.language || '').toUpperCase().endsWith('-PH') ? 'PHP' : 'USD';
  let state = { currency: defaultCurrency, accounts: [], transactions: [], selectedId: null };

  const $ = (id) => document.getElementById(id);
  const els = {
    total: $('total'),
    currency: $('currency'),
    cards: $('cards'),
    noAccounts: $('no-accounts'),
    accForm: $('acc-form'),
    bank: $('bank'),
    bankOtherWrap: $('bank-other-wrap'),
    bankOther: $('bank-other'),
    nickname: $('nickname'),
    accStart: $('acc-start'),
    accGoal: $('acc-goal'),
    swatches: $('swatches'),
    accError: $('acc-error'),
    txForm: $('tx-form'),
    txAccount: $('tx-account'),
    amount: $('amount'),
    date: $('date'),
    note: $('note'),
    error: $('form-error'),
    list: $('tx-list'),
    empty: $('empty'),
    filterLabel: $('filter-label'),
    showAll: $('show-all'),
    toast: $('toast'),
    undo: $('undo'),
  };

  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // ---------- Storage ----------
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        state.currency = saved.currency || state.currency;
        state.accounts = Array.isArray(saved.accounts) ? saved.accounts : [];
        state.transactions = Array.isArray(saved.transactions) ? saved.transactions : [];
        return;
      }
      // Migrate data from the first version (single balance, no accounts).
      const old = localStorage.getItem(OLD_KEY);
      if (old) {
        const o = JSON.parse(old);
        const txs = Array.isArray(o.transactions) ? o.transactions : [];
        if (txs.length || o.startingBalance) {
          const acc = { id: newId(), bank: 'My account', nickname: '', color: 'navy', startingBalance: o.startingBalance || 0 };
          state.accounts = [acc];
          state.transactions = txs.map((t) => ({ ...t, accountId: acc.id }));
        }
        state.currency = o.currency || state.currency;
        save();
      }
    } catch (e) {
      console.warn('Could not read saved data:', e);
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save data:', e);
    }
  }

  // ---------- Helpers ----------
  const toCents = (value) => Math.round(parseFloat(value) * 100);

  function money(cents) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: state.currency }).format(cents / 100);
  }

  function todayISO() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function prettyDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function balanceOf(acc) {
    let b = acc.startingBalance;
    for (const t of state.transactions) {
      if (t.accountId !== acc.id) continue;
      b += t.type === 'deposit' ? t.amount : -t.amount;
    }
    return b;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // ---------- Render: ATM cards ----------
  const CONTACTLESS_SVG =
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
    '<path d="M8 8c2.5 2.5 2.5 5.5 0 8"/><path d="M12 5c4 4 4 10 0 14"/><path d="M16 2c5.5 5.5 5.5 14.5 0 20"/></svg>';

  function cardEl(acc) {
    const selected = state.selectedId === acc.id;
    const wrap = el('div');

    const card = el(
      'div',
      'relative rounded-2xl p-5 text-white aspect-[1.586/1] min-h-[170px] flex flex-col justify-between cursor-pointer shadow-md ' +
        'focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2' +
        (selected ? ' ring-2 ring-ink ring-offset-2' : '')
    );
    card.style.background = gradientOf(acc.color);
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-pressed', String(selected));
    card.setAttribute('aria-label', `${acc.bank} ${acc.nickname}, balance ${money(balanceOf(acc))}. Tap to filter transactions.`);

    const top = el('div', 'flex items-start justify-between');
    top.append(el('p', 'text-lg font-semibold leading-tight', acc.bank));
    const wifi = el('span', 'text-white/80');
    wifi.innerHTML = CONTACTLESS_SVG; // constant markup, no user text
    top.append(wifi);

    const chip = el('div', 'chip w-11 h-8 rounded-md');

    const bottom = el('div');
    bottom.append(el('p', 'text-xs text-white/70 truncate', acc.nickname || 'Balance'));
    const bal = balanceOf(acc);
    bottom.append(el('p', 'tabular text-2xl font-extrabold break-words', money(bal)));
    if (acc.goal > 0) {
      const pct = Math.max(0, Math.min(100, Math.round((bal / acc.goal) * 100)));
      const track = el('div', 'h-2 rounded-full bg-white/25 mt-2 overflow-hidden');
      const fill = el('div', 'h-full rounded-full bg-white');
      fill.style.width = pct + '%';
      track.append(fill);
      bottom.append(track, el('p', 'text-xs text-white/80 mt-1', `${pct}% of ${money(acc.goal)} goal`));
    }

    card.append(top, chip, bottom);

    const toggle = () => {
      state.selectedId = selected ? null : acc.id;
      if (state.selectedId) els.txAccount.value = acc.id;
      render();
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });

    const actions = el('div', 'flex gap-4 mt-2 text-sm text-slate2');
    const edit = el('button', 'underline rounded focus:outline-none focus:ring-2 focus:ring-ink', 'Edit starting balance');
    edit.type = 'button';
    edit.addEventListener('click', () => editStart(acc));
    const goalBtn = el('button', 'underline rounded focus:outline-none focus:ring-2 focus:ring-ink', acc.goal > 0 ? 'Edit goal' : 'Set goal');
    goalBtn.type = 'button';
    goalBtn.addEventListener('click', () => editGoal(acc));
    const remove = el('button', 'underline rounded hover:text-spend focus:outline-none focus:ring-2 focus:ring-ink', 'Remove account');
    remove.type = 'button';
    remove.addEventListener('click', () => removeAccount(acc));
    actions.append(edit, goalBtn, remove);

    wrap.append(card, actions);
    return wrap;
  }

  // ---------- Render: everything ----------
  function render() {
    // Make sure the selected account still exists
    if (state.selectedId && !state.accounts.some((a) => a.id === state.selectedId)) state.selectedId = null;

    els.currency.value = state.currency;

    // Total
    const total = state.accounts.reduce((sum, a) => sum + balanceOf(a), 0);
    els.total.textContent = money(total);

    // Cards
    els.cards.replaceChildren(...state.accounts.map(cardEl));
    els.noAccounts.classList.toggle('hidden', state.accounts.length > 0);

    // Account dropdown in the transaction form
    const prev = els.txAccount.value;
    els.txAccount.replaceChildren();
    if (!state.accounts.length) {
      const o = el('option', '', 'Add an account first');
      o.value = '';
      els.txAccount.append(o);
    }
    for (const a of state.accounts) {
      const o = el('option', '', a.nickname ? `${a.bank} \u2013 ${a.nickname}` : a.bank);
      o.value = a.id;
      els.txAccount.append(o);
    }
    const want = state.selectedId || prev;
    if (state.accounts.some((a) => a.id === want)) els.txAccount.value = want;

    renderList();
  }

  function renderList() {
    const accById = Object.fromEntries(state.accounts.map((a) => [a.id, a]));
    const filtered = state.transactions.filter((t) => !state.selectedId || t.accountId === state.selectedId);
    const sorted = [...filtered].sort((a, b) =>
      a.date === b.date ? b.created - a.created : b.date.localeCompare(a.date)
    );

    const sel = accById[state.selectedId];
    els.filterLabel.textContent = sel ? (sel.nickname ? `${sel.bank} \u2013 ${sel.nickname}` : sel.bank) : 'All accounts';
    els.showAll.classList.toggle('hidden', !sel);

    els.list.replaceChildren();
    els.empty.classList.toggle('hidden', sorted.length > 0);

    for (const t of sorted) {
      const isIn = t.type === 'deposit';
      const acc = accById[t.accountId];

      const li = el('li', 'flex items-center gap-3 py-3');
      const info = el('div', 'flex-1 min-w-0');
      const note = el('p', 'font-semibold truncate', t.note || (isIn ? 'Deposit' : 'Withdrawal'));
      const meta = prettyDate(t.date) + (!state.selectedId && acc ? ` \u00B7 ${acc.bank}` : '');
      info.append(note, el('p', 'text-sm text-slate2 truncate', meta));

      const amt = el('p', 'tabular font-semibold whitespace-nowrap ' + (isIn ? 'text-gain' : 'text-spend'),
        (isIn ? '+' : '\u2212') + money(t.amount));

      const del = el('button', 'text-sm text-slate2 hover:text-spend rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ink', 'Delete');
      del.type = 'button';
      del.setAttribute('aria-label', `Delete ${note.textContent} on ${prettyDate(t.date)}`);
      del.addEventListener('click', () => removeTransaction(t.id));

      li.append(info, amt, del);
      els.list.append(li);
    }
  }

  // ---------- Account actions ----------
  function renderSwatches() {
    els.swatches.replaceChildren();
    COLORS.forEach((c, i) => {
      const label = el('label', 'cursor-pointer');
      const input = el('input', 'peer sr-only');
      input.type = 'radio';
      input.name = 'color';
      input.value = c.id;
      input.checked = i === 0;
      input.setAttribute('aria-label', c.id);
      const dot = el('span', 'block w-8 h-8 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-ink');
      dot.style.background = gradientOf(c.id);
      label.append(input, dot);
      els.swatches.append(label);
    });
  }

  function addAccount(event) {
    event.preventDefault();
    els.accError.textContent = '';

    const isOther = els.bank.value === '__other';
    const bank = (isOther ? els.bankOther.value : els.bank.value).trim();
    const startRaw = els.accStart.value;
    const start = startRaw === '' ? 0 : toCents(startRaw);

    const goalRaw = els.accGoal.value;
    const goal = goalRaw === '' ? 0 : toCents(goalRaw);

    if (!bank) {
      els.accError.textContent = 'Enter a bank name.';
      els.bankOther.focus();
      return;
    }
    if (!Number.isFinite(start)) {
      els.accError.textContent = 'Enter a valid starting balance.';
      els.accStart.focus();
      return;
    }

    if (!Number.isFinite(goal) || goal < 0) {
      els.accError.textContent = 'Enter a valid savings goal, or leave it empty.';
      els.accGoal.focus();
      return;
    }

    const color = (els.accForm.elements.color.value) || 'navy';
    const acc = { id: newId(), bank, nickname: els.nickname.value.trim(), color, startingBalance: start, goal };
    state.accounts.push(acc);
    state.selectedId = null;
    save();
    render();
    els.txAccount.value = acc.id;

    els.accForm.reset();
    els.bankOtherWrap.classList.add('hidden');
    renderSwatches();
  }

  function editStart(acc) {
    const input = window.prompt(`Starting balance for ${acc.bank}`, (acc.startingBalance / 100).toFixed(2));
    if (input === null) return;
    const cents = toCents(input);
    if (!Number.isFinite(cents)) return;
    acc.startingBalance = cents;
    save();
    render();
  }

  function editGoal(acc) {
    const input = window.prompt(
      `Savings goal for ${acc.bank} (leave empty for no goal)`,
      acc.goal > 0 ? (acc.goal / 100).toFixed(2) : ''
    );
    if (input === null) return;
    const cents = input.trim() === '' ? 0 : toCents(input);
    if (!Number.isFinite(cents) || cents < 0) return;
    acc.goal = cents;
    save();
    render();
  }

  function removeAccount(acc) {
    const count = state.transactions.filter((t) => t.accountId === acc.id).length;
    const msg = count
      ? `Remove ${acc.bank} and its ${count} transaction${count === 1 ? '' : 's'}? This cannot be undone.`
      : `Remove ${acc.bank}?`;
    if (!window.confirm(msg)) return;
    state.accounts = state.accounts.filter((a) => a.id !== acc.id);
    state.transactions = state.transactions.filter((t) => t.accountId !== acc.id);
    save();
    render();
  }

  // ---------- Transaction actions ----------
  function addTransaction(event) {
    event.preventDefault();
    els.error.textContent = '';

    const accountId = els.txAccount.value;
    const type = els.txForm.elements.type.value;
    const amount = toCents(els.amount.value);
    const date = els.date.value;
    const note = els.note.value.trim();

    if (!accountId) {
      els.error.textContent = 'Add a bank account first.';
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      els.error.textContent = 'Enter an amount greater than 0.';
      els.amount.focus();
      return;
    }
    if (!date) {
      els.error.textContent = 'Pick a date.';
      els.date.focus();
      return;
    }

    state.transactions.push({ id: newId(), accountId, type, amount, note, date, created: Date.now() });
    save();
    render();

    els.amount.value = '';
    els.note.value = '';
    els.amount.focus();
  }

  // Delete with a short undo window
  let lastDeleted = null;
  let toastTimer = null;

  function removeTransaction(id) {
    const index = state.transactions.findIndex((t) => t.id === id);
    if (index === -1) return;
    lastDeleted = { tx: state.transactions[index], index };
    state.transactions.splice(index, 1);
    save();
    render();
    showToast();
  }

  function showToast() {
    els.toast.classList.remove('hidden');
    els.toast.classList.add('flex');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 6000);
  }

  function hideToast() {
    els.toast.classList.add('hidden');
    els.toast.classList.remove('flex');
    lastDeleted = null;
  }

  function undoDelete() {
    if (!lastDeleted) return;
    state.transactions.splice(lastDeleted.index, 0, lastDeleted.tx);
    save();
    render();
    clearTimeout(toastTimer);
    hideToast();
  }

  // ---------- Init ----------
  load();
  els.date.value = todayISO();
  renderSwatches();

  els.bank.addEventListener('change', () => {
    const other = els.bank.value === '__other';
    els.bankOtherWrap.classList.toggle('hidden', !other);
    if (other) els.bankOther.focus();
  });
  els.accForm.addEventListener('submit', addAccount);
  els.txForm.addEventListener('submit', addTransaction);
  els.undo.addEventListener('click', undoDelete);
  els.showAll.addEventListener('click', () => { state.selectedId = null; render(); });
  els.currency.addEventListener('change', () => {
    state.currency = els.currency.value;
    save();
    render();
  });

  render();
})();
