(function () {
  'use strict';

  // Порядок = иерархия (сверху вниз)
  var ROLES = [
    'Director', 'Deputy Director', 'Head of Department', 'Senior Researcher',
    'Researcher', 'Junior Researcher', 'Laboratory Assistant', 'Technician'
  ];
  var LEADERSHIP = ['Director', 'Deputy Director'];

  var grid = document.getElementById('memberGrid');
  var filtersBox = document.getElementById('filters');
  var searchInput = document.getElementById('search');
  var statusEl = document.getElementById('memberStatus');
  var members = [];
  var activeFilter = 'all';

  // Мобильное меню
  var nav = document.getElementById('nav');
  document.getElementById('burger').addEventListener('click', function () {
    nav.classList.toggle('open');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') nav.classList.remove('open');
  });
  document.getElementById('year').textContent = new Date().getFullYear();

  function roleRank(role) {
    var i = ROLES.indexOf(role);
    return i === -1 ? ROLES.length : i;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function buildAvatar(m) {
    var letter = (m.nickname || '?').trim().charAt(0).toUpperCase() || '?';
    function fallback() {
      return el('div', 'avatar avatar-fallback', letter);
    }
    if (!m.avatar) return fallback();
    var img = document.createElement('img');
    img.className = 'avatar';
    img.alt = m.nickname || 'avatar';
    img.loading = 'lazy';
    img.src = './' + String(m.avatar).replace(/^\.?\//, '');
    img.onerror = function () {
      img.onerror = null;
      if (img.parentNode) img.parentNode.replaceChild(fallback(), img);
    };
    return img;
  }

  function buildCard(m) {
    var isLead = LEADERSHIP.indexOf(m.role) !== -1;
    var card = el('div', 'member' + (isLead ? ' leader' : ''));
    card.appendChild(buildAvatar(m));

    var info = el('div', 'm-info');
    var name;
    if (m.discordUrl && String(m.discordUrl).trim() !== '') {
      name = el('a', 'm-name', m.nickname);
      name.href = m.discordUrl;
      name.target = '_blank';
      name.rel = 'noopener noreferrer';
    } else {
      name = el('span', 'm-name', m.nickname);
    }
    info.appendChild(name);
    info.appendChild(el('span', 'badge', m.role));
    card.appendChild(info);
    return card;
  }

  function matches(m) {
    var q = searchInput.value.trim().toLowerCase();
    if (q && String(m.nickname).toLowerCase().indexOf(q) === -1) return false;
    if (activeFilter === 'all') return true;
    if (activeFilter === 'leadership') return LEADERSHIP.indexOf(m.role) !== -1;
    return m.role === activeFilter;
  }

  function render() {
    grid.innerHTML = '';
    var list = members.filter(matches);
    list.forEach(function (m) { grid.appendChild(buildCard(m)); });
    statusEl.style.display = list.length ? 'none' : 'block';
    if (!list.length) statusEl.textContent = 'Сотрудники не найдены.';
  }

  function buildFilters() {
    var defs = [['all', 'Все'], ['leadership', 'Руководство']];
    ROLES.forEach(function (r) { defs.push([r, r]); });
    defs.forEach(function (d) {
      var b = el('button', 'chip' + (d[0] === 'all' ? ' active' : ''), d[1]);
      b.type = 'button';
      b.addEventListener('click', function () {
        activeFilter = d[0];
        Array.prototype.forEach.call(filtersBox.children, function (c) { c.classList.remove('active'); });
        b.classList.add('active');
        render();
      });
      filtersBox.appendChild(b);
    });
  }

  searchInput.addEventListener('input', render);
  buildFilters();

  fetch('./data/members.json', { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      members = (Array.isArray(data) ? data : data.members || []).slice();
      members.sort(function (a, b) {
        var d = roleRank(a.role) - roleRank(b.role);
        return d !== 0 ? d : String(a.nickname).localeCompare(String(b.nickname), 'ru');
      });
      render();
    })
    .catch(function (err) {
      statusEl.textContent = 'Не удалось загрузить data/members.json (' + err.message + '). ' +
        'При открытии файла двойным кликом (file://) браузер блокирует загрузку — используйте GitHub Pages или локальный сервер.';
    });
})();