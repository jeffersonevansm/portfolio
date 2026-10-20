/* ============================================================
   JEFF AI — INTERFACE  (assistant-ui.js)
   ------------------------------------------------------------
   All look-and-feel lives here. It knows nothing about how answers
   are produced — it just calls assistant.ask() and renders blocks.
   That separation is what lets you swap the AI provider later
   without touching a single line of this file.

   Loads after: content.js → assistant.js → assistant-ui.js
   ============================================================ */
(function (global) {
  'use strict';

  const doc = global.document;
  if (!doc || !global.JeffAI) return;

  /* ---------------------------------------------------------
     THEME — reads the host page so it blends in automatically
     --------------------------------------------------------- */
  const THEME = {
    accent: '#e50914',
    accent2: '#ff4d5a',
    green: '#46d369'
  };

  /* ---------------------------------------------------------
     STYLES
     --------------------------------------------------------- */
  const CSS = `
  .jai, .jai *, .jai *::before, .jai *::after { box-sizing:border-box; }
  .jai {
    --jai-accent:${THEME.accent};
    --jai-accent2:${THEME.accent2};
    --jai-green:${THEME.green};
    --jai-bg:rgba(20,20,22,.72);
    --jai-panel:rgba(32,32,36,.66);
    --jai-ink:#f4f4f5;
    --jai-ink2:#a9a9b2;
    --jai-line:rgba(255,255,255,.12);
    --jai-user:rgba(229,9,20,.16);
    --jai-radius:22px;
    --jai-ease:cubic-bezier(.22,.61,.36,1);
    --jai-spring:cubic-bezier(.34,1.56,.64,1);
    font-family:"Manrope",-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
    -webkit-font-smoothing:antialiased;
  }
  /* Light-mode host pages */
  @media (prefers-color-scheme: light){
    .jai[data-theme="auto"]{
      --jai-bg:rgba(255,255,255,.74);
      --jai-panel:rgba(248,248,250,.72);
      --jai-ink:#16161a;
      --jai-ink2:#5c5c66;
      --jai-line:rgba(0,0,0,.10);
      --jai-user:rgba(229,9,20,.10);
    }
  }
  .jai[data-theme="light"]{
    --jai-bg:rgba(255,255,255,.74); --jai-panel:rgba(248,248,250,.72);
    --jai-ink:#16161a; --jai-ink2:#5c5c66; --jai-line:rgba(0,0,0,.10);
    --jai-user:rgba(229,9,20,.10);
  }

  /* ---------- LAUNCHER ---------- */
  .jai-fab{
    position:fixed; right:24px; bottom:24px; z-index:9998;
    width:60px; height:60px; border-radius:50%; border:none; cursor:pointer;
    display:grid; place-items:center; padding:0;
    background:linear-gradient(145deg, var(--jai-accent2), var(--jai-accent));
    box-shadow:0 10px 34px rgba(229,9,20,.42), 0 2px 10px rgba(0,0,0,.35);
    animation:jai-in .7s var(--jai-spring) .6s both;
    transition:transform .35s var(--jai-spring), box-shadow .35s var(--jai-ease);
  }
  .jai-fab:hover{ transform:translateY(-4px) scale(1.06); box-shadow:0 16px 44px rgba(229,9,20,.55); }
  .jai-fab:active{ transform:scale(.95); }
  .jai-fab svg{ width:26px; height:26px; fill:none; stroke:#fff; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; transition:opacity .25s, transform .35s var(--jai-spring); }
  .jai-fab .jai-x{ position:absolute; opacity:0; transform:rotate(-90deg) scale(.6); }
  .jai.open .jai-fab .jai-spark{ opacity:0; transform:rotate(90deg) scale(.6); }
  .jai.open .jai-fab .jai-x{ opacity:1; transform:none; }
  /* attention ping, once */
  .jai-fab::after{
    content:''; position:absolute; inset:0; border-radius:50%;
    border:2px solid var(--jai-accent); opacity:0;
    animation:jai-ping 2.6s var(--jai-ease) 1.6s 3;
  }
  @keyframes jai-ping{ 0%{opacity:.7; transform:scale(1)} 70%{opacity:0; transform:scale(1.5)} 100%{opacity:0} }
  @keyframes jai-in{ from{opacity:0; transform:translateY(28px) scale(.6)} to{opacity:1; transform:none} }

  .jai-badge{
    position:absolute; top:-2px; right:-2px; min-width:18px; height:18px; padding:0 5px;
    border-radius:99px; background:#fff; color:var(--jai-accent);
    font-size:10px; font-weight:800; line-height:18px; text-align:center;
    box-shadow:0 2px 8px rgba(0,0,0,.3); transition:opacity .3s, transform .3s var(--jai-spring);
  }
  .jai.open .jai-badge, .jai.seen .jai-badge{ opacity:0; transform:scale(.5); }

  /* ---------- PANEL ---------- */
  .jai-panel{
    position:fixed; right:24px; bottom:96px; z-index:9999;
    width:min(408px, calc(100vw - 32px));
    height:min(624px, calc(100vh - 132px));
    display:flex; flex-direction:column; overflow:hidden;
    border-radius:var(--jai-radius);
    background:var(--jai-bg);
    backdrop-filter:blur(28px) saturate(180%);
    -webkit-backdrop-filter:blur(28px) saturate(180%);
    border:1px solid var(--jai-line);
    box-shadow:0 32px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.05) inset;
    opacity:0; visibility:hidden;
    transform:translateY(22px) scale(.95);
    transform-origin:bottom right;
    transition:opacity .34s var(--jai-ease), transform .44s var(--jai-spring), visibility .34s;
  }
  .jai.open .jai-panel{ opacity:1; visibility:visible; transform:none; }
  /* soft glow along the top edge */
  .jai-panel::before{
    content:''; position:absolute; top:0; left:0; right:0; height:120px; pointer-events:none;
    background:radial-gradient(80% 100% at 50% 0%, rgba(229,9,20,.20), transparent 70%);
  }

  /* ---------- HEADER ---------- */
  .jai-head{ position:relative; display:flex; align-items:center; gap:12px; padding:16px 16px 14px; border-bottom:1px solid var(--jai-line); flex-shrink:0; }
  .jai-orb{
    width:38px; height:38px; border-radius:12px; flex-shrink:0; display:grid; place-items:center;
    background:linear-gradient(145deg, var(--jai-accent2), var(--jai-accent));
    box-shadow:0 6px 18px rgba(229,9,20,.4);
  }
  .jai-orb svg{ width:19px; height:19px; fill:none; stroke:#fff; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
  .jai-id{ flex:1; min-width:0; }
  .jai-id h3{ margin:0; font-size:14.5px; font-weight:800; color:var(--jai-ink); letter-spacing:-.01em; }
  .jai-id p{ margin:2px 0 0; font-size:11.5px; color:var(--jai-ink2); display:flex; align-items:center; gap:6px; }
  .jai-dot{ width:6px; height:6px; border-radius:50%; background:var(--jai-green); box-shadow:0 0 8px var(--jai-green); animation:jai-pulse 2.4s var(--jai-ease) infinite; }
  @keyframes jai-pulse{ 0%,100%{opacity:1} 50%{opacity:.35} }
  .jai-hbtn{ width:32px; height:32px; border:none; background:transparent; border-radius:9px; cursor:pointer; color:var(--jai-ink2); display:grid; place-items:center; transition:background .2s, color .2s; }
  .jai-hbtn:hover{ background:var(--jai-line); color:var(--jai-ink); }
  .jai-hbtn svg{ width:16px; height:16px; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }

  /* ---------- LOG ---------- */
  .jai-log{ flex:1; overflow-y:auto; overscroll-behavior:contain; padding:18px 16px 8px; display:flex; flex-direction:column; gap:14px; scroll-behavior:smooth; }
  .jai-log::-webkit-scrollbar{ width:6px; }
  .jai-log::-webkit-scrollbar-thumb{ background:var(--jai-line); border-radius:99px; }
  .jai-log::-webkit-scrollbar-track{ background:transparent; }

  .jai-msg{ display:flex; gap:9px; max-width:100%; animation:jai-msg-in .42s var(--jai-ease) both; }
  @keyframes jai-msg-in{ from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:none} }
  .jai-msg.user{ flex-direction:row-reverse; }
  .jai-av{ width:26px; height:26px; border-radius:8px; flex-shrink:0; display:grid; place-items:center; margin-top:2px; }
  .jai-msg.bot .jai-av{ background:linear-gradient(145deg, var(--jai-accent2), var(--jai-accent)); }
  .jai-msg.bot .jai-av svg{ width:14px; height:14px; fill:none; stroke:#fff; stroke-width:2.2; stroke-linecap:round; stroke-linejoin:round; }
  .jai-msg.user .jai-av{ background:var(--jai-line); color:var(--jai-ink2); font-size:11px; font-weight:800; }
  .jai-bub{
    padding:11px 14px; border-radius:16px; font-size:13.6px; line-height:1.62;
    color:var(--jai-ink); min-width:0; word-wrap:break-word; overflow-wrap:break-word;
  }
  .jai-msg.bot .jai-bub{ background:var(--jai-panel); border:1px solid var(--jai-line); border-top-left-radius:5px; max-width:calc(100% - 36px); }
  .jai-msg.user .jai-bub{ background:var(--jai-user); border:1px solid rgba(229,9,20,.24); border-top-right-radius:5px; max-width:calc(100% - 44px); }
  .jai-bub p{ margin:0 0 9px; }
  .jai-bub p:last-child{ margin-bottom:0; }
  .jai-bub strong{ font-weight:800; }

  .jai-bub ul{ margin:6px 0 9px; padding-left:16px; }
  .jai-bub li{ margin-bottom:5px; }
  .jai-bub li::marker{ color:var(--jai-accent); }

  /* skill groups */
  .jai-grp{ margin:8px 0; }
  .jai-grp b{ display:block; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--jai-ink2); margin-bottom:5px; font-weight:700; }
  .jai-pills{ display:flex; flex-wrap:wrap; gap:5px; margin-bottom:9px; }
  .jai-pill{ font-size:11.5px; padding:3px 9px; border-radius:6px; background:var(--jai-line); color:var(--jai-ink); }

  /* project cards inside answers */
  .jai-card{
    display:flex; align-items:center; gap:10px; width:100%; text-align:left;
    margin:6px 0; padding:10px 12px; border-radius:12px; cursor:pointer;
    background:var(--jai-line); border:1px solid transparent; color:var(--jai-ink);
    font:inherit; font-size:13px; transition:transform .25s var(--jai-spring), border-color .25s, background .25s;
  }
  .jai-card:hover{ transform:translateX(3px); border-color:var(--jai-accent); background:rgba(229,9,20,.12); }
  .jai-card .jai-cbody{ flex:1; min-width:0; }
  .jai-card b{ display:block; font-weight:800; font-size:13px; margin-bottom:1px; }
  .jai-card span{ display:block; font-size:11.5px; color:var(--jai-ink2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .jai-card .jai-arrow{ color:var(--jai-accent); font-size:15px; flex-shrink:0; transition:transform .25s var(--jai-spring); }
  .jai-card:hover .jai-arrow{ transform:translateX(3px); }

  .jai-out{ display:inline-flex; align-items:center; gap:6px; margin:4px 0; padding:8px 13px; border-radius:10px;
    background:linear-gradient(145deg, var(--jai-accent2), var(--jai-accent)); color:#fff; font-size:12.5px; font-weight:700;
    text-decoration:none; transition:transform .25s var(--jai-spring), box-shadow .25s; }
  .jai-out:hover{ transform:translateY(-2px); box-shadow:0 8px 20px rgba(229,9,20,.4); }
  .jai-links{ display:flex; flex-wrap:wrap; gap:6px; margin:7px 0; }
  .jai-links a{ font-size:12px; padding:6px 11px; border-radius:8px; background:var(--jai-line); color:var(--jai-ink); text-decoration:none; transition:background .2s, transform .2s; }
  .jai-links a:hover{ background:rgba(229,9,20,.18); transform:translateY(-1px); }

  /* sources + related */
  .jai-meta{ margin-top:11px; padding-top:9px; border-top:1px solid var(--jai-line); }
  .jai-meta h5{ margin:0 0 5px; font-size:9.5px; letter-spacing:.16em; text-transform:uppercase; color:var(--jai-ink2); font-weight:800; }
  .jai-meta + .jai-meta{ margin-top:8px; }
  .jai-srcs{ display:flex; flex-wrap:wrap; gap:5px; }
  .jai-src{ display:inline-flex; align-items:center; gap:4px; font-size:11px; padding:3px 9px; border-radius:99px;
    background:transparent; border:1px solid var(--jai-line); color:var(--jai-ink2); cursor:pointer; font-family:inherit;
    transition:border-color .2s, color .2s, background .2s; text-decoration:none; }
  .jai-src::before{ content:''; width:4px; height:4px; border-radius:50%; background:var(--jai-accent); }
  .jai-src:hover{ border-color:var(--jai-accent); color:var(--jai-ink); background:rgba(229,9,20,.10); }

  /* typing indicator */
  .jai-typing{ display:flex; gap:4px; padding:4px 2px; align-items:center; }
  .jai-typing i{ width:6px; height:6px; border-radius:50%; background:var(--jai-ink2); animation:jai-bounce 1.3s var(--jai-ease) infinite; }
  .jai-typing i:nth-child(2){ animation-delay:.16s; }
  .jai-typing i:nth-child(3){ animation-delay:.32s; }
  @keyframes jai-bounce{ 0%,60%,100%{transform:translateY(0); opacity:.45} 30%{transform:translateY(-5px); opacity:1} }

  /* streaming caret */
  .jai-caret{ display:inline-block; width:2px; height:1em; background:var(--jai-accent); margin-left:2px; vertical-align:text-bottom; animation:jai-blink .9s step-end infinite; }
  @keyframes jai-blink{ 50%{opacity:0} }

  /* ---------- CHIPS ---------- */
  .jai-chips{ display:flex; flex-wrap:wrap; gap:6px; padding:0 16px 12px; flex-shrink:0; }
  .jai-chip{
    font-family:inherit; font-size:12px; padding:7px 13px; border-radius:99px; cursor:pointer;
    background:var(--jai-panel); border:1px solid var(--jai-line); color:var(--jai-ink);
    transition:transform .25s var(--jai-spring), border-color .25s, background .25s;
    animation:jai-chip-in .4s var(--jai-spring) both;
  }
  .jai-chip:hover{ transform:translateY(-2px); border-color:var(--jai-accent); background:rgba(229,9,20,.14); }
  @keyframes jai-chip-in{ from{opacity:0; transform:translateY(8px) scale(.9)} to{opacity:1; transform:none} }

  /* ---------- COMPOSER ---------- */
  .jai-form{ display:flex; align-items:flex-end; gap:8px; padding:12px 14px 14px; border-top:1px solid var(--jai-line); flex-shrink:0; }
  .jai-input{
    flex:1; resize:none; max-height:104px; min-height:42px; padding:11px 14px;
    border-radius:14px; border:1px solid var(--jai-line); background:var(--jai-panel);
    color:var(--jai-ink); font:inherit; font-size:13.5px; line-height:1.45; outline:none;
    transition:border-color .25s, box-shadow .25s;
  }
  .jai-input::placeholder{ color:var(--jai-ink2); }
  .jai-input:focus{ border-color:var(--jai-accent); box-shadow:0 0 0 3px rgba(229,9,20,.16); }
  .jai-send{
    width:42px; height:42px; flex-shrink:0; border:none; border-radius:13px; cursor:pointer; display:grid; place-items:center;
    background:linear-gradient(145deg, var(--jai-accent2), var(--jai-accent)); color:#fff;
    transition:transform .25s var(--jai-spring), opacity .25s;
  }
  .jai-send:hover:not(:disabled){ transform:scale(1.07); }
  .jai-send:disabled{ opacity:.4; cursor:not-allowed; }
  .jai-send svg{ width:17px; height:17px; fill:none; stroke:currentColor; stroke-width:2.2; stroke-linecap:round; stroke-linejoin:round; }
  .jai-foot{ padding:0 16px 11px; font-size:10px; color:var(--jai-ink2); text-align:center; flex-shrink:0; }

  /* ---------- MOBILE ---------- */
  @media (max-width:560px){
    .jai-fab{ right:16px; bottom:16px; width:54px; height:54px; }
    .jai-panel{
      right:0; left:0; bottom:0; width:100%;
      height:min(86vh, calc(100vh - 56px));
      border-radius:22px 22px 0 0; transform-origin:bottom center;
      transform:translateY(100%);
    }
    .jai.open .jai-panel{ transform:none; }
    .jai-log{ padding:16px 13px 8px; }
  }
  @media (prefers-reduced-motion:reduce){
    .jai *, .jai *::before, .jai *::after{ animation-duration:.001ms !important; transition-duration:.001ms !important; }
  }
  `;

  /* ---------------------------------------------------------
     ICONS
     --------------------------------------------------------- */
  const ICON = {
    spark: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/><circle cx="12" cy="12" r="3.4"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7M21 3v6h-6"/>'
  };

  const svg = (paths, cls) =>
    `<svg viewBox="0 0 24 24" ${cls ? 'class="' + cls + '"' : ''} aria-hidden="true">${paths}</svg>`;

  const escapeHTML = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  /* ---------------------------------------------------------
     WIDGET
     --------------------------------------------------------- */
  function mount(options) {
    const opts = options || {};
    const assistant = opts.assistant || global.JeffAI.create();
    const kb = assistant.kb;
    const name = assistant.config.assistantName;
    const first = assistant.firstName;

    /* -- styles -- */
    const style = doc.createElement('style');
    style.id = 'jai-styles';
    style.textContent = CSS;
    doc.head.appendChild(style);

    /* -- root -- */
    const root = doc.createElement('div');
    root.className = 'jai';
    root.setAttribute('data-theme', opts.theme || 'dark');
    root.innerHTML = `
      <button class="jai-fab" id="jai-fab" aria-label="Open ${escapeHTML(name)}" aria-expanded="false">
        ${svg(ICON.spark, 'jai-spark')}
        ${svg(ICON.x, 'jai-x')}
        <span class="jai-badge" id="jai-badge">1</span>
      </button>
      <div class="jai-panel" id="jai-panel" role="dialog" aria-label="${escapeHTML(name)} assistant" aria-modal="false">
        <div class="jai-head">
          <div class="jai-orb">${svg(ICON.spark)}</div>
          <div class="jai-id">
            <h3>${escapeHTML(name)}</h3>
            <p><span class="jai-dot"></span> Portfolio assistant</p>
          </div>
          <button class="jai-hbtn" id="jai-reset" aria-label="Start over" title="Start over">${svg(ICON.refresh)}</button>
          <button class="jai-hbtn" id="jai-close" aria-label="Close">${svg(ICON.x)}</button>
        </div>
        <div class="jai-log" id="jai-log" role="log" aria-live="polite" aria-atomic="false"></div>
        <div class="jai-chips" id="jai-chips"></div>
        <form class="jai-form" id="jai-form">
          <textarea class="jai-input" id="jai-input" rows="1" placeholder="Ask about ${escapeHTML(first)}'s work…"
            aria-label="Ask a question" autocomplete="off"></textarea>
          <button class="jai-send" id="jai-send" type="submit" aria-label="Send" disabled>${svg(ICON.send)}</button>
        </form>
        <div class="jai-foot">Answers come only from ${escapeHTML(first)}'s portfolio</div>
      </div>`;
    doc.body.appendChild(root);

    const $ = id => root.querySelector('#' + id);
    const fab = $('jai-fab'), panel = $('jai-panel'), log = $('jai-log'),
      chipsBox = $('jai-chips'), form = $('jai-form'), input = $('jai-input'),
      sendBtn = $('jai-send');

    let busy = false, opened = false;

    /* ---------- suggested questions ---------- */
    const CHIPS = opts.chips || [
      'Tell me about ' + first,
      'Show projects',
      'Resume',
      'AI experience',
      'Finance experience',
      'Engineering',
      'GitHub',
      'Technical skills'
    ];

    function renderChips(list) {
      chipsBox.innerHTML = '';
      (list || CHIPS).forEach((c, i) => {
        const b = doc.createElement('button');
        b.className = 'jai-chip';
        b.type = 'button';
        b.textContent = c;
        b.style.animationDelay = (i * 45) + 'ms';
        b.addEventListener('click', () => submit(c));
        chipsBox.appendChild(b);
      });
    }

    /* ---------- scrolling ---------- */
    let pinned = true;
    log.addEventListener('scroll', () => {
      pinned = log.scrollHeight - log.scrollTop - log.clientHeight < 60;
    });
    const scrollDown = force => {
      if (pinned || force) log.scrollTop = log.scrollHeight;
    };

    /* ---------- navigation from inside an answer ---------- */
    function go(target) {
      if (!target) return;
      // A project the current page can open in its own modal.
      // (index.html declares openModal as a function, so it exists on window;
      //  its `const C` does not, so we read the projects from SITE_CONTENT.)
      const projects = (global.SITE_CONTENT && global.SITE_CONTENT.projects) || [];
      if (typeof target.openProject === 'number' && typeof global.openModal === 'function' &&
        projects[target.openProject]) {
        const cards = doc.querySelectorAll('#rail .card');
        global.openModal(projects[target.openProject], cards[target.openProject] || null);
        if (global.innerWidth < 560) close();
        return;
      }
      // Not on a page with the modal → send them to the project on the home page
      if (typeof target.openProject === 'number' && !target.href) {
        global.location.href = 'index.html#work';
        return;
      }
      const href = target.href || '';
      if (!href) return;
      if (/^#/.test(href)) {
        const el = doc.getElementById(href.slice(1));
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (global.innerWidth < 560) close();
          return;
        }
        // anchor lives on the home page, we're elsewhere
        global.location.href = 'index.html' + href;
        return;
      }
      if (/^(https?:|mailto:)/.test(href)) global.open(href, '_blank', 'noopener');
      else global.location.href = href;
    }

    /* ---------- message shells ---------- */
    function addMsg(who, htmlOrText, isHTML) {
      const wrap = doc.createElement('div');
      wrap.className = 'jai-msg ' + who;
      const av = doc.createElement('div');
      av.className = 'jai-av';
      av.innerHTML = who === 'bot' ? svg(ICON.spark) : escapeHTML('You'[0]);
      const bub = doc.createElement('div');
      bub.className = 'jai-bub';
      if (isHTML) bub.innerHTML = htmlOrText;
      else bub.textContent = htmlOrText;
      wrap.appendChild(av);
      wrap.appendChild(bub);
      log.appendChild(wrap);
      scrollDown();
      return bub;
    }

    function addTyping() {
      const bub = addMsg('bot', '<div class="jai-typing"><i></i><i></i><i></i></div>', true);
      bub.parentElement.dataset.typing = '1';
      scrollDown(true);
      return bub.parentElement;
    }

    /* ---------- render one answer block to HTML ---------- */
    function blockHTML(b) {
      switch (b.type) {
        case 'p': return '<p>' + escapeHTML(b.text) + '</p>';
        case 'list':
          return '<ul>' + b.items.map(i => '<li>' + escapeHTML(i) + '</li>').join('') + '</ul>';
        case 'groups':
          return Object.keys(b.groups).map(g =>
            '<div class="jai-grp"><b>' + escapeHTML(g) + '</b><div class="jai-pills">' +
            (b.groups[g] || []).map(s => '<span class="jai-pill">' + escapeHTML(s) + '</span>').join('') +
            '</div></div>').join('');
        case 'projects':
          return b.items.map(p =>
            '<button class="jai-card" data-project="' + p.i + '">' +
            '<span class="jai-cbody"><b>' + escapeHTML(p.title) + '</b><span>' +
            escapeHTML(p.summary || ((p.category || '') + (p.year ? ' · ' + p.year : ''))) +
            '</span></span><span class="jai-arrow">→</span></button>').join('');
        case 'link':
          return '<a class="jai-out" href="' + escapeHTML(b.url) + '"' +
            (/^https?:/.test(b.url) ? ' target="_blank" rel="noopener"' : '') + '>' +
            escapeHTML(b.label) + ' →</a>';
        case 'links':
          return '<div class="jai-links">' + b.items.map(l =>
            '<a href="' + escapeHTML(l.url) + '" target="_blank" rel="noopener">' +
            escapeHTML(l.label) + ' ↗</a>').join('') + '</div>';
        default: return '';
      }
    }

    function metaHTML(ans) {
      let h = '';
      if ((ans.sources || []).length) {
        h += '<div class="jai-meta"><h5>Source</h5><div class="jai-srcs">' +
          ans.sources.map((s, i) => '<button class="jai-src" data-nav="s' + i + '">' + escapeHTML(s.label) + '</button>').join('') +
          '</div></div>';
      }
      if ((ans.related || []).length) {
        h += '<div class="jai-meta"><h5>Related pages</h5><div class="jai-srcs">' +
          ans.related.map((s, i) => '<button class="jai-src" data-nav="r' + i + '">' + escapeHTML(s.label) + '</button>').join('') +
          '</div></div>';
      }
      return h;
    }

    /* ---------- wire up clicks inside a finished answer ---------- */
    function bind(bub, ans) {
      bub.querySelectorAll('[data-project]').forEach(el => {
        el.addEventListener('click', () => go({ openProject: +el.dataset.project, href: '#work' }));
      });
      bub.querySelectorAll('[data-nav]').forEach(el => {
        const k = el.dataset.nav;
        const target = k[0] === 's' ? (ans.sources || [])[+k.slice(1)] : (ans.related || [])[+k.slice(1)];
        el.addEventListener('click', () => go(target));
      });
    }

    /* ---------- streaming renderer ----------
       Types out paragraph text word-by-word, then snaps in the richer
       blocks (cards, pills, links) and finally the sources. */
    function stream(bub, ans, done) {
      const blocks = ans.blocks || [];
      let bi = 0;
      bub.innerHTML = '';

      function nextBlock() {
        if (bi >= blocks.length) {
          const meta = metaHTML(ans);
          if (meta) {
            const d = doc.createElement('div');
            d.innerHTML = meta;
            while (d.firstChild) bub.appendChild(d.firstChild);
          }
          bind(bub, ans);
          scrollDown();
          return done && done();
        }
        const b = blocks[bi++];
        if (b.type === 'p') {
          const p = doc.createElement('p');
          bub.appendChild(p);
          typeText(p, b.text, nextBlock);
        } else {
          const d = doc.createElement('div');
          d.innerHTML = blockHTML(b);
          while (d.firstChild) bub.appendChild(d.firstChild);
          scrollDown();
          setTimeout(nextBlock, 90);
        }
      }

      function typeText(el, text, cb) {
        const words = String(text || '').split(' ');
        let i = 0;
        const caret = doc.createElement('span');
        caret.className = 'jai-caret';
        el.appendChild(caret);
        const reduce = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) { el.textContent = text; return cb(); }
        // longer answers type faster so nobody waits
        const perTick = words.length > 60 ? 4 : words.length > 30 ? 3 : 2;
        (function tick() {
          i = Math.min(words.length, i + perTick);
          caret.remove();
          el.textContent = words.slice(0, i).join(' ');
          if (i < words.length) {
            el.appendChild(caret);
            scrollDown();
            setTimeout(tick, 26);
          } else {
            scrollDown();
            cb();
          }
        })();
      }

      nextBlock();
    }

    /* ---------- ask ---------- */
    function submit(text) {
      const q = String(text || '').trim();
      if (!q || busy) return;
      busy = true;
      sendBtn.disabled = true;
      input.value = '';
      input.style.height = 'auto';
      chipsBox.innerHTML = '';

      addMsg('user', q, false);
      const typingRow = addTyping();

      const started = Date.now();
      assistant.ask(q).then(ans => {
        // brief minimum delay so the typing indicator reads as "thinking"
        const wait = Math.max(0, 480 - (Date.now() - started));
        setTimeout(() => {
          typingRow.remove();
          const bub = addMsg('bot', '', true);
          stream(bub, ans, () => {
            busy = false;
            sendBtn.disabled = !input.value.trim();
            // offer follow-ups again once idle
            renderChips(ans.notFound || ans.chips ? null : followUps(ans));
            input.focus();
          });
        }, wait);
      }).catch(() => {
        typingRow.remove();
        addMsg('bot', 'Something went wrong on my side. Please try asking again.', false);
        busy = false;
        renderChips(null);
      });
    }

    /* Context-aware follow-up chips */
    function followUps(ans) {
      const src = (ans.sources || [])[0];
      const label = src && src.label;
      const proj = kb.projects.map(p => p.title);
      if (label && proj.indexOf(label) !== -1) {
        const others = proj.filter(t => t !== label);
        return ['What technologies were used?', 'Show other projects']
          .concat(others.slice(0, 1).map(t => 'Explain ' + t))
          .concat(['Technical skills']);
      }
      if (label === 'About') return ['Show projects', 'Work experience', 'Technical skills', 'Resume'];
      if (/Intern/.test(label || '')) return ['Show projects', 'Technical skills', 'Tell me about ' + first, 'Contact'];
      return CHIPS.slice(0, 5);
    }

    /* ---------- welcome ---------- */
    function welcome() {
      const bub = addMsg('bot', '', true);
      const ans = {
        blocks: [
          { type: 'p', text: "Hi! I'm " + name + '.' },
          { type: 'p', text: "I can help you explore " + assistant.subject + "'s portfolio." },
          { type: 'p', text: 'Try asking:' },
          {
            type: 'list', items: [
              'Tell me about ' + first,
              'Show AI projects',
              'Explain Forex Analyst',
              'Treasury internship',
              'Technical skills',
              'Engineering projects'
            ]
          }
        ],
        sources: [], related: []
      };
      stream(bub, ans, () => renderChips(null));
    }

    /* ---------- open / close ---------- */
    function open() {
      root.classList.add('open', 'seen');
      fab.setAttribute('aria-expanded', 'true');
      if (!opened) { opened = true; welcome(); }
      setTimeout(() => { if (global.innerWidth > 560) input.focus(); }, 380);
    }
    function close() {
      root.classList.remove('open');
      fab.setAttribute('aria-expanded', 'false');
    }
    function toggle() { root.classList.contains('open') ? close() : open(); }

    /* ---------- events ---------- */
    fab.addEventListener('click', toggle);
    $('jai-close').addEventListener('click', close);
    $('jai-reset').addEventListener('click', () => {
      assistant.reset();
      log.innerHTML = '';
      opened = true;
      welcome();
    });

    form.addEventListener('submit', e => { e.preventDefault(); submit(input.value); });
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 104) + 'px';
      sendBtn.disabled = busy || !input.value.trim();
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(input.value); }
    });
    doc.addEventListener('keydown', e => {
      if (e.key === 'Escape' && root.classList.contains('open')) close();
    });
    doc.addEventListener('click', e => {
      if (!root.classList.contains('open')) return;
      if (global.innerWidth <= 560) return;         // mobile sheet stays put
      if (root.contains(e.target)) return;
      close();
    });

    renderChips(null);

    return { open, close, toggle, ask: submit, assistant, root };
  }

  /* ---------------------------------------------------------
     AUTO-BOOT
     --------------------------------------------------------- */
  function boot() {
    if (doc.getElementById('jai-styles')) return;    // already mounted
    const assistant = global.JeffAI.create({ content: global.SITE_CONTENT });
    global.jeffAI = mount({ assistant: assistant, theme: 'dark' });
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();

  global.JeffAIUI = { mount: mount };
})(typeof window !== 'undefined' ? window : globalThis);
