/* ============================================================
   JEFF AI — ENGINE  (assistant.js)
   ------------------------------------------------------------
   This file contains NO user interface. It is the "brain" only.
   The look and feel lives in assistant-ui.js.

   Architecture (each layer only talks to the one below it):

     UI  (assistant-ui.js)
      └── Assistant        — session, memory, provider selection
           └── Provider    — LocalProvider (default) | LLMProvider (stub)
                └── Retriever   — ranks documents for a query
                     └── KnowledgeBase — indexes window.SITE_CONTENT

   The assistant answers ONLY from indexed portfolio content. It has no
   generative model, so it is structurally incapable of hallucinating —
   every sentence it returns is text that exists in your content.js.

   TO SWAP IN A REAL AI MODEL LATER: see LLMProvider at the bottom.
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------
     0. CONFIG — safe to edit
     --------------------------------------------------------- */
  const CONFIG = {
    assistantName: 'Jeff AI',
    // The assistant speaks ABOUT the owner in third person, never as them.
    subjectFallback: 'Jefferson',
    minScore: 0.8,            // below this, we say "couldn't find that"
    maxSources: 4,
    maxRelated: 3,
    offTopicReply:
      "I'm designed specifically to answer questions about {SUBJECT}'s portfolio and experience.",
    notFoundReply:
      "I couldn't find that information in {SUBJECT}'s portfolio.\nWould you like to explore one of these instead?"
  };

  /* ---------------------------------------------------------
     1. TEXT UTILITIES
     --------------------------------------------------------- */
  const STOP = new Set(('a an and are as at be been but by can could did do does for from had has have ' +
    'he her his how i if in into is it its me my of on or our she should so some tell that the their them ' +
    'then there these they this to us was we were what when where which who whom why will with would you ' +
    'your about show explain give list find know use used using make made get please').split(/\s+/));

  // Light stemmer: plurals and common verb endings only. Deliberately gentle —
  // aggressive stemming hurts short technical queries like "CAD" or "KV".
  function stem(w) {
    if (w.length <= 3) return w;
    return w
      .replace(/(ies)$/, 'y')
      .replace(/(sses|shes|ches|xes)$/, m => m.slice(0, -2))
      .replace(/([^s])s$/, '$1')
      .replace(/(ing|ed)$/, m => (w.length > 6 ? '' : m));
  }

  /* ---- VOICE CONVERSION -------------------------------------------------
     Your portfolio is written in first person ("I built the arm…"), but the
     assistant must never speak AS you. This rewrites quoted portfolio text
     into third person so the assistant always says "Jefferson built…".
     Past-tense verbs (-ed) need no conjugation; a small present-tense map
     handles the rest. ---------------------------------------------------- */
  const PRESENT = {
    build: 'builds', enjoy: 'enjoys', like: 'likes', love: 'loves', prefer: 'prefers',
    work: 'works', focus: 'focuses', use: 'uses', design: 'designs', create: 'creates',
    make: 'makes', want: 'wants', think: 'thinks', believe: 'believes', know: 'knows',
    have: 'has', am: 'is', do: 'does', go: 'goes', try: 'tries', study: 'studies',
    treat: 'treats', take: 'takes', learn: 'learns', solve: 'solves', run: 'runs',
    keep: 'keeps', find: 'finds', see: 'sees', get: 'gets', bring: 'brings', aim: 'aims'
  };

  function deVoice(text, name) {
    if (!text) return text;
    let s = String(text);
    const He = 'He', he = 'he';
    // Contractions first
    s = s.replace(/\bI've\b/g, 'he has').replace(/\bI'm\b/g, 'he is')
         .replace(/\bI'd\b/g, "he'd").replace(/\bI'll\b/g, 'he will');
    // Bare "I" + optional verb
    s = s.replace(/\bI\b(\s+)([a-z]+)?/g, (m, sp, verb) => {
      if (!verb) return he;
      if (/ed$/.test(verb) || PRESENT[verb] === undefined && /ing$/.test(verb)) return he + sp + verb;
      return he + sp + (PRESENT[verb] || verb);
    });
    s = s.replace(/\bI\b/g, he);
    // Possessives / objects
    s = s.replace(/\bmy\b/g, 'his').replace(/\bMy\b/g, 'His')
         .replace(/\bmine\b/g, 'his').replace(/\bmyself\b/g, 'himself')
         .replace(/\bme\b/g, 'him');
    // Re-capitalise sentence starts (not after em-dashes — those stay mid-sentence)
    s = s.replace(/(^|[.!?]\s+)([a-z])/g, (m, pre, ch) => pre + ch.toUpperCase());
    // "He" at the very start of a standalone quote reads better as the name
    if (/^He\b/.test(s) && name) s = s.replace(/^He\b/, name.split(' ')[0]);
    return s;
  }

  function isFirstPerson(t) { return /\b(I|I've|I'm|I'd|my|My|me|mine|myself)\b/.test(String(t || '')); }

  function tokenize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s-]/g, ' ')
      .split(/[\s\-.]+/)
      .filter(t => t && t.length > 1 && !STOP.has(t))
      .map(stem);
  }

  /* Synonyms let visitors use their own words. Left side = what they type,
     right side = extra terms added to the search. */
  const SYNONYMS = {
    ai: ['ai', 'artificial', 'intelligence', 'machine', 'learning', 'ml', 'claude', 'llm', 'model'],
    ml: ['machine', 'learning', 'ai', 'model'],
    'machine learning': ['machine', 'learning', 'ai', 'ml'],
    finance: ['finance', 'financial', 'treasury', 'banking', 'bank', 'market', 'forex', 'fx', 'currency', 'trading'],
    financial: ['finance', 'financial', 'treasury', 'banking'],
    fintech: ['finance', 'financial', 'forex', 'technology'],
    forex: ['forex', 'fx', 'currency', 'market', 'trading'],
    fx: ['forex', 'fx', 'currency'],
    treasury: ['treasury', 'banking', 'bank', 'cimb', 'niaga', 'financial'],
    bank: ['bank', 'banking', 'cimb', 'niaga', 'treasury'],
    engineering: ['engineering', 'engineer', 'mechanical', 'design', 'cad', 'manufacturing'],
    mechanical: ['mechanical', 'engineering', 'cad', 'solidwork', 'design'],
    cad: ['cad', 'solidwork', 'ansys', 'drawing', 'design', 'model'],
    robot: ['robot', 'robotic', 'arm', 'mechatronic'],
    robotics: ['robot', 'robotic', 'arm', 'mechatronic'],
    code: ['code', 'coding', 'programming', 'developer', 'software'],
    programming: ['programming', 'code', 'language', 'python', 'javascript', 'software'],
    language: ['language', 'programming', 'python', 'javascript', 'matlab'],
    languages: ['language', 'programming', 'python', 'javascript', 'matlab'],
    web: ['web', 'website', 'frontend', 'javascript', 'cloudflare'],
    react: ['react', 'javascript', 'frontend', 'web'],
    cloud: ['cloud', 'cloudflare', 'serverless', 'worker', 'edge'],
    resume: ['resume', 'cv', 'curriculum'],
    cv: ['resume', 'cv'],
    github: ['github', 'code', 'repository', 'repo', 'source'],
    contact: ['contact', 'email', 'reach', 'hire', 'linkedin'],
    hire: ['hire', 'contact', 'available', 'work', 'opportunity'],
    experience: ['experience', 'internship', 'intern', 'work', 'job', 'role'],
    internship: ['internship', 'intern', 'experience'],
    skill: ['skill', 'tool', 'technology', 'stack', 'know'],
    skills: ['skill', 'tool', 'technology', 'stack'],
    tech: ['technology', 'tool', 'stack', 'skill'],
    stack: ['stack', 'technology', 'tool', 'built'],
    project: ['project', 'work', 'built', 'build'],
    projects: ['project', 'work', 'built', 'build'],
    study: ['study', 'education', 'degree', 'academic', 'school', 'university'],
    education: ['education', 'degree', 'academic', 'study', 'university']
  };

  function expand(tokens, rawQuery) {
    const out = new Set(tokens);
    const lower = ' ' + String(rawQuery || '').toLowerCase() + ' ';
    tokens.forEach(t => (SYNONYMS[t] || []).forEach(s => out.add(stem(s))));
    Object.keys(SYNONYMS).forEach(key => {
      if (key.includes(' ') && lower.includes(' ' + key + ' ')) {
        SYNONYMS[key].forEach(s => out.add(stem(s)));
      }
    });
    return [...out];
  }

  /* ---------------------------------------------------------
     2. KNOWLEDGE BASE — turns SITE_CONTENT into searchable docs
     --------------------------------------------------------- */
  function KnowledgeBase(content) {
    const C = content || {};
    const P = C.profile || {};
    const docs = [];
    let uid = 0;

    function add(doc) {
      const text = [doc.title, doc.body, (doc.keywords || []).join(' ')].join(' ');
      docs.push(Object.assign({ id: 'd' + uid++, tokens: tokenize(text) }, doc));
    }

    /* --- profile / about --- */
    const about = C.about || {};
    add({
      type: 'about',
      title: 'About',
      label: 'About',
      href: '#about',
      body: [
        `${P.name || 'He'} is a ${P.role || 'engineer'} based in ${P.location || ''}.`.replace(/ based in \.$/, '.'),
        P.tagline || '',
        about.heading || '',
        (about.paragraphs || []).join(' ')
      ].filter(Boolean).join(' '),
      keywords: ['who', 'about', 'bio', 'introduction', 'summary', 'background', 'yourself', 'story']
        .concat(about.focus || [])
        .concat((P.name || '').split(/\s+/)),
      answer: {
        lead: `${P.name} is a ${P.role} based in ${P.location}.`,
        paras: [P.tagline].concat(about.paragraphs || []).filter(Boolean)
      }
    });

    /* --- focus areas --- */
    if ((about.focus || []).length) {
      add({
        type: 'focus',
        title: 'Focus areas',
        label: 'About',
        href: '#about',
        body: 'Focus areas: ' + about.focus.join(', '),
        keywords: ['focus', 'specialise', 'specialize', 'interested', 'area', 'domain'],
        answer: { lead: `${P.name}'s focus areas are:`, list: about.focus }
      });
    }

    /* --- skills (grouped) --- */
    const skillGroups = C.skills || {};
    const allSkills = [];
    Object.keys(skillGroups).forEach(group => {
      const items = skillGroups[group] || [];
      items.forEach(s => allSkills.push(s));
      add({
        type: 'skillgroup',
        title: group + ' skills',
        label: 'Skills',
        href: '#about',
        group: group,
        items: items,
        body: group + ': ' + items.join(', '),
        keywords: ['skill', 'tool', 'technology', 'know', 'stack', 'proficient', group].concat(items)
      });
    });
    // legacy `about.tools` still counts as skills
    (about.tools || []).forEach(t => { if (!allSkills.includes(t)) allSkills.push(t); });

    if (allSkills.length) {
      add({
        type: 'skills-all',
        title: 'Technical skills',
        label: 'Skills',
        href: '#about',
        body: 'Skills and tools: ' + allSkills.join(', '),
        keywords: ['skill', 'technical', 'tool', 'technology', 'stack', 'capability', 'competency'],
        answer: { lead: `${P.name}'s technical skills, by area:`, groups: skillGroups }
      });
    }

    /* --- experience --- */
    (C.experience || []).forEach((x, i) => {
      add({
        type: 'experience',
        index: i,
        title: `${x.role}${x.org ? ' — ' + x.org : ''}`,
        label: `${x.role}, ${x.org}`,
        href: '#about',
        body: [x.role, x.org, x.type, x.period, x.location, x.summary, (x.highlights || []).join(' '), (x.skills || []).join(' ')]
          .filter(Boolean).join(' '),
        keywords: ['experience', 'internship', 'intern', 'work', 'job', 'role', 'career', 'employment']
          .concat((x.skills || []))
          .concat(String(x.org || '').split(/\s+/)),
        answer: {
          lead: `${P.name} worked as ${/^[aeiou]/i.test(x.role || '') ? 'an' : 'a'} ${x.role}${x.org ? ' at ' + x.org : ''}${x.period ? ' (' + x.period + ')' : ''}.`,
          paras: [x.summary].filter(Boolean),
          list: x.highlights || [],
          tail: (x.skills || []).length ? 'Skills involved: ' + x.skills.join(', ') + '.' : ''
        }
      });
    });

    if ((C.experience || []).length) {
      add({
        type: 'experience-all',
        title: 'Work experience',
        label: 'Experience',
        href: '#about',
        body: 'Work experience overview: ' + (C.experience || []).map(x => `${x.role} at ${x.org}`).join('; '),
        keywords: ['experience', 'internship', 'intern', 'work', 'history', 'background', 'career', 'jobs'],
        answer: {
          lead: `${P.name} has ${(C.experience || []).length} roles listed in the portfolio:`,
          list: (C.experience || []).map(x =>
            `${x.role} — ${x.org}${x.period ? ' (' + x.period + ')' : ''}: ${x.summary}`)
        }
      });
    }

    /* --- projects --- */
    (C.projects || []).forEach((pr, i) => {
      const projectHref = (pr.links || []).find(l => l.url && !/^#/.test(l.url) && !/^https?:/.test(l.url));
      const external = (pr.links || []).find(l => /^https?:/.test(l.url || ''));
      add({
        type: 'project',
        index: i,
        title: pr.title,
        label: pr.title,
        href: projectHref ? projectHref.url : '#work',
        openProject: i,                 // tells the UI to open the project modal
        externalUrl: external ? external.url : '',
        tags: pr.tags || [],
        body: [pr.title, pr.category, pr.year, pr.summary, (pr.description || []).join(' '), (pr.tags || []).join(' ')]
          .filter(Boolean).join(' '),
        keywords: ['project', 'built', 'build', 'work', 'made', 'case', 'study', pr.category]
          .concat(pr.tags || []),
        answer: {
          lead: `${pr.title} — ${pr.category}, ${pr.year}.`,
          paras: [pr.summary].concat(pr.description || []),
          tail: (pr.tags || []).length ? 'Built with: ' + pr.tags.join(', ') + '.' : ''
        }
      });
    });

    if ((C.projects || []).length) {
      add({
        type: 'projects-all',
        title: 'Projects',
        label: 'Projects',
        href: '#work',
        body: 'All projects: ' + (C.projects || []).map(p => `${p.title} ${p.category} ${p.summary}`).join(' '),
        keywords: ['project', 'portfolio', 'work', 'built', 'showcase', 'everything', 'all'],
        answer: {
          lead: `${P.name} has ${(C.projects || []).length} project${(C.projects || []).length === 1 ? '' : 's'} in the portfolio:`,
          projects: (C.projects || []).map((p, i) => ({ i: i, title: p.title, summary: p.summary, category: p.category, year: p.year }))
        }
      });
    }

    /* --- resume --- */
    const resume = C.resume || {};
    add({
      type: 'resume',
      title: 'Resume',
      label: 'Resume',
      href: resume.url || '#contact',
      body: 'Resume CV curriculum vitae download document',
      keywords: ['resume', 'cv', 'curriculum', 'vitae', 'download', 'pdf', 'document'],
      answer: resume.url
        ? { lead: `You can download ${P.name}'s resume here:`, linkOut: { label: resume.label || 'Resume (PDF)', url: resume.url } }
        : { lead: `${P.name}'s portfolio doesn't have a downloadable resume linked yet. The fastest way to request one is by email:`, linkOut: { label: P.email, url: 'mailto:' + P.email } }
    });

    /* --- contact + social links --- */
    add({
      type: 'contact',
      title: 'Contact',
      label: 'Contact',
      href: '#contact',
      body: 'Contact email hire reach out available for work ' + (P.email || '') + ' ' +
        (C.links || []).map(l => l.label + ' ' + l.url).join(' '),
      keywords: ['contact', 'email', 'reach', 'hire', 'available', 'linkedin', 'github', 'social', 'connect']
        .concat((C.links || []).map(l => l.label)),
      answer: {
        lead: `The fastest way to reach ${P.name} is by email — he's open to new opportunities and collaborations.`,
        linkOut: P.email ? { label: P.email, url: 'mailto:' + P.email } : null,
        links: C.links || []
      }
    });

    (C.links || []).forEach(l => {
      add({
        type: 'link',
        title: l.label,
        label: l.label,
        href: l.url,
        external: true,
        body: l.label + ' profile link ' + l.url,
        keywords: [l.label, 'link', 'profile', 'social'],
        answer: { lead: `${P.name}'s ${l.label}:`, linkOut: { label: l.label, url: l.url } }
      });
    });

    /* --- document frequency, for IDF scoring --- */
    const df = Object.create(null);
    docs.forEach(d => new Set(d.tokens).forEach(t => { df[t] = (df[t] || 0) + 1; }));

    return {
      docs: docs,
      df: df,
      N: docs.length,
      profile: P,
      raw: C,
      subject: P.name || CONFIG.subjectFallback,
      firstName: (P.name || CONFIG.subjectFallback).split(' ')[0],
      projects: C.projects || [],
      skills: allSkills
    };
  }

  /* ---------------------------------------------------------
     3. RETRIEVER — BM25-style ranking over the knowledge base
     --------------------------------------------------------- */
  function Retriever(kb) {
    const avgLen = kb.docs.reduce((s, d) => s + d.tokens.length, 0) / Math.max(kb.N, 1);
    const k1 = 1.4, b = 0.72;

    function score(doc, terms, rawQuery) {
      let s = 0;
      const len = doc.tokens.length || 1;
      terms.forEach(t => {
        let f = 0;
        for (let i = 0; i < doc.tokens.length; i++) if (doc.tokens[i] === t) f++;
        if (!f) return;
        const idf = Math.log(1 + (kb.N - (kb.df[t] || 0) + 0.5) / ((kb.df[t] || 0) + 0.5));
        s += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * (len / avgLen)));
      });

      // Exact title match is a very strong signal ("explain ForexAnalyst")
      const q = String(rawQuery || '').toLowerCase().replace(/[^a-z0-9 ]/g, '');
      const title = String(doc.title || '').toLowerCase().replace(/[^a-z0-9 ]/g, '');
      const titleTight = title.replace(/\s/g, '');
      const qTight = q.replace(/\s/g, '');
      if (title && q.includes(title)) s += 9;
      else if (titleTight && qTight.includes(titleTight)) s += 9;   // "forexanalyst" vs "forex analyst"
      else if (titleTight.length > 4 && titleTight.includes(qTight) && qTight.length > 4) s += 4;

      // Tag / skill exact hit ("does he know React?")
      (doc.tags || []).concat(doc.items || []).forEach(tag => {
        const tg = String(tag).toLowerCase();
        if (tg && q.includes(tg)) s += 3.5;
      });
      return s;
    }

    /* Words that express intent ("show me projects") rather than topic ("machine
       learning"). When filtering by topic we ignore these, otherwise every
       project matches every "show me X projects" question. */
    const GENERIC = new Set(['project', 'work', 'built', 'build', 'portfolio', 'relat', 'related',
      'show', 'made', 'thing', 'stuff', 'case', 'study', 'experience', 'skill']);

    return {
      /* Score against topic words only — used to answer "his AI projects". */
      topicalSearch: function (query, type) {
        const terms = expand(tokenize(query), query).filter(t => !GENERIC.has(t));
        if (!terms.length) return [];
        return kb.docs
          .filter(d => !type || d.type === type)
          .map(d => ({ doc: d, score: score(d, terms, query) }))
          .filter(h => h.score > 0)
          .sort((a, b2) => b2.score - a.score);
      },
      search: function (query, opts) {
        const o = opts || {};
        const terms = expand(tokenize(query), query);
        if (!terms.length) return [];
        let hits = kb.docs
          .map(d => ({ doc: d, score: score(d, terms, query) }))
          .filter(h => h.score > 0);
        if (o.type) hits = hits.filter(h => h.doc.type === o.type);
        hits.sort((a, b2) => b2.score - a.score);
        return hits.slice(0, o.limit || 8);
      },
      scoreDoc: score
    };
  }

  /* ---------------------------------------------------------
     4. INTENT ROUTER — decides what KIND of question this is
     --------------------------------------------------------- */
  function classify(query, kb) {
    const q = ' ' + String(query || '').toLowerCase().trim() + ' ';
    const has = re => re.test(q);

    if (has(/\b(hi|hello|hey|yo|good (morning|afternoon|evening))\b/) && q.trim().length < 22) return 'greeting';
    if (has(/\b(thanks|thank you|cheers|appreciate)\b/)) return 'thanks';
    if (has(/\b(who are you|what are you|your name|jeff ai|are you jefferson|are you a bot|are you an ai)\b/)) return 'meta';
    if (has(/\b(resume|cv|curriculum vitae)\b/)) return 'resume';
    if (has(/\b(contact|email|reach|hire|get in touch|available)\b/)) return 'contact';
    if (has(/\b(github|linkedin|twitter|social)\b/)) return 'link';
    if (has(/\b(language|languages)\b/) && has(/\b(programming|code|coding|speak|use|know)\b/)) return 'languages';
    if (has(/\b(does he know|do you know|is he familiar|has he used|can he use|does he use|experience with|worked with)\b/)) return 'skillcheck';
    if (has(/\b(skill|skills|tech stack|technolog|tool|tools|proficient)\b/)) return 'skills';
    if (has(/\b(internship|intern|experience|worked|work history|career|job|employment)\b/)) return 'experience';
    if (has(/\b(project|projects|built|build|portfolio|work)\b/)) return 'projects';
    if (has(/\b(who is|tell me about|about him|about jeff|about jefferson|introduce|background|bio)\b/)) return 'about';
    return 'search';
  }

  /* Is this question even about the portfolio? */
  function isOffTopic(query, kb) {
    const q = String(query || '').toLowerCase();
    const OFF = /\b(world cup|weather|president|election|stock price|bitcoin price|recipe|joke|poem|translate|capital of|who won|movie|football|nba|meaning of life|write me|code for me|math|calculate|solve)\b/;
    if (!OFF.test(q)) return false;
    // If it also mentions something we actually know about, treat it as on-topic.
    const kbTerms = expand(tokenize(q), q);
    const anyHit = kb.docs.some(d => kbTerms.some(t => d.tokens.includes(t) && (kb.df[t] || 0) < kb.N * 0.6));
    return !anyHit;
  }

  /* ---------------------------------------------------------
     5. ANSWER COMPOSER — builds structured, source-cited answers
     Blocks: {type:'p'|'list'|'projects'|'groups'|'link'|'chips', ...}
     --------------------------------------------------------- */
  function compose(kb, intent, query, hits, memory, topical) {
    const S = kb.subject, F = kb.firstName;
    const blocks = [];
    const sources = [];
    const related = [];
    const top = hits[0] && hits[0].doc;

    const pushSource = d => {
      if (d && !sources.some(s => s.label === d.label)) {
        sources.push({ label: d.label, href: d.href, openProject: d.openProject, external: d.external });
      }
    };

    function fromAnswer(doc) {
      const a = doc.answer || {};
      if (a.lead) blocks.push({ type: 'p', text: a.lead });
      // Portfolio prose is first-person; convert so the assistant never speaks as him.
      (a.paras || []).forEach((t, i) => {
        const converted = isFirstPerson(t) ? deVoice(t, S) : t;
        blocks.push({ type: 'p', text: converted, quoted: isFirstPerson(t) && i === 0 ? false : false });
      });
      if (a.list && a.list.length) blocks.push({ type: 'list', items: a.list.map(t => isFirstPerson(t) ? deVoice(t, S) : t) });
      if (a.groups) blocks.push({ type: 'groups', groups: a.groups });
      if (a.projects) blocks.push({ type: 'projects', items: a.projects });
      if (a.links && a.links.length) blocks.push({ type: 'links', items: a.links });
      if (a.linkOut) blocks.push({ type: 'link', label: a.linkOut.label, url: a.linkOut.url });
      if (a.tail) blocks.push({ type: 'p', text: a.tail });
      pushSource(doc);
    }

    const docOfType = t => kb.docs.find(d => d.type === t);

    switch (intent) {
      case 'greeting':
        blocks.push({ type: 'p', text: `Hi! I'm ${CONFIG.assistantName}. Ask me anything about ${S}'s work, experience, or skills.` });
        return { blocks, sources: [], related: [], chips: true };

      case 'thanks':
        blocks.push({ type: 'p', text: `Happy to help. Anything else you'd like to know about ${F}'s work?` });
        return { blocks, sources: [], related: [], chips: true };

      case 'meta':
        blocks.push({ type: 'p', text: `I'm ${CONFIG.assistantName} — an assistant that answers questions using only the content of ${S}'s portfolio. I'm not ${F} himself, and I only cover what's published here.` });
        return { blocks, sources: [], related: [], chips: true };

      case 'about': {
        // "Tell me about the Robotic Arm" is about a PROJECT, not the bio.
        // If the question names a specific entity, answer with that instead.
        const named = hits.find(h =>
          (h.doc.type === 'project' || h.doc.type === 'experience') && h.score > 6);
        if (named) {
          fromAnswer(named.doc);
          break;
        }
        const d = docOfType('about');
        if (d) fromAnswer(d);
        const exp = docOfType('experience-all');
        const proj = docOfType('projects-all');
        if (exp) related.push({ label: 'Experience', href: exp.href });
        if (proj) related.push({ label: 'Projects', href: proj.href });
        break;
      }

      case 'projects': {
        // A specific project named in the question wins over the list.
        const specific = hits.find(h => h.doc.type === 'project' && h.score > 6);
        if (specific) { fromAnswer(specific.doc); break; }

        // Filtered project search: "show me his AI projects"
        // Match on TOPIC words only, so "machine learning" doesn't drag in
        // unrelated mechanical work just because both are "projects".
        const projHits = (topical || []).filter(h => h.doc.type === 'project' && h.score >= 1.5);
        const best = projHits.length ? projHits[0].score : 0;
        const filtered = projHits.filter(h => h.score >= best * 0.4);
        const generic = /\b(what|which|show|list|all|any)\b.*\bprojects?\b/.test(query.toLowerCase()) &&
          !/\b(ai|ml|machine|finance|financial|engineering|mechanical|web|robot|forex|cloud)\b/.test(query.toLowerCase());

        if (!generic && filtered.length) {
          blocks.push({ type: 'p', text: `Here are the projects in ${S}'s portfolio that match that:` });
          blocks.push({
            type: 'projects',
            items: filtered.map(h => ({
              i: h.doc.index,
              title: h.doc.title,
              summary: kb.projects[h.doc.index].summary,
              category: kb.projects[h.doc.index].category,
              year: kb.projects[h.doc.index].year
            }))
          });
          filtered.forEach(h => pushSource(h.doc));
        } else {
          const d = docOfType('projects-all');
          if (d) fromAnswer(d);
        }
        break;
      }

      case 'experience': {
        const specific = hits.find(h => h.doc.type === 'experience' && h.score > 3);
        if (specific) {
          fromAnswer(specific.doc);
          const other = kb.docs.filter(d => d.type === 'experience' && d !== specific.doc);
          other.forEach(d => related.push({ label: d.label, href: d.href }));
        } else {
          const d = docOfType('experience-all');
          if (d) fromAnswer(d);
        }
        break;
      }

      case 'skills': {
        const d = docOfType('skills-all');
        if (d) fromAnswer(d);
        break;
      }

      case 'languages': {
        const groups = kb.raw.skills || {};
        const langs = groups['Programming'] || [];
        if (langs.length) {
          blocks.push({ type: 'p', text: `According to ${S}'s portfolio, he works with these programming languages:` });
          blocks.push({ type: 'list', items: langs });
          const web = groups['Web & Cloud'] || [];
          if (web.length) blocks.push({ type: 'p', text: 'Alongside these platforms and libraries: ' + web.join(', ') + '.' });
          pushSource(kb.docs.find(x => x.type === 'skillgroup' && x.group === 'Programming') || docOfType('skills-all'));
        }
        break;
      }

      case 'skillcheck': {
        // Pull the thing being asked about out of the question.
        const q = query.toLowerCase();
        const match = kb.skills.find(s => q.includes(String(s).toLowerCase()));
        const tagMatch = !match && kb.projects.some(p => (p.tags || []).some(t => q.includes(String(t).toLowerCase())))
          ? kb.projects.flatMap(p => p.tags || []).find(t => q.includes(String(t).toLowerCase()))
          : null;
        const found = match || tagMatch;

        if (found) {
          const usedIn = kb.projects
            .map((p, i) => ({ p, i }))
            .filter(x => (x.p.tags || []).some(t => String(t).toLowerCase() === String(found).toLowerCase()));
          const inExp = (kb.raw.experience || []).filter(x => (x.skills || []).some(s => String(s).toLowerCase() === String(found).toLowerCase()));

          blocks.push({ type: 'p', text: `Yes — ${found} appears in ${S}'s portfolio.` });
          if (usedIn.length) {
            blocks.push({ type: 'p', text: `He used it in:` });
            blocks.push({ type: 'projects', items: usedIn.map(x => ({ i: x.i, title: x.p.title, summary: x.p.summary, category: x.p.category, year: x.p.year })) });
            usedIn.forEach(x => pushSource(kb.docs.find(d => d.type === 'project' && d.index === x.i)));
          }
          if (inExp.length) {
            blocks.push({ type: 'list', items: inExp.map(x => `${x.role} at ${x.org}`) });
            inExp.forEach(x => pushSource(kb.docs.find(d => d.type === 'experience' && kb.raw.experience[d.index] === x)));
          }
          if (!usedIn.length && !inExp.length) {
            const g = Object.keys(kb.raw.skills || {}).find(k => (kb.raw.skills[k] || []).some(s => String(s).toLowerCase() === String(found).toLowerCase()));
            blocks.push({ type: 'p', text: g ? `It's listed under his ${g} skills.` : `It's listed among his skills.` });
            pushSource(docOfType('skills-all'));
          }
        } else {
          // Explicitly NOT found — this is the honest branch.
          const subject = (query.match(/\b(?:know|used|use|familiar with|experience with|worked with)\s+([a-z0-9+#.\s-]{2,28})/i) || [])[1];
          const clean = subject ? subject.replace(/[?.!]/g, '').trim() : '';
          blocks.push({
            type: 'p',
            text: `I couldn't find ${clean ? '"' + clean + '"' : 'that'} in ${S}'s portfolio. That doesn't necessarily mean he hasn't used it — only that it isn't listed here.`
          });
          blocks.push({ type: 'p', text: `Here's what the portfolio does list:` });
          blocks.push({ type: 'groups', groups: kb.raw.skills || {} });
          pushSource(docOfType('skills-all'));
        }
        break;
      }

      case 'resume': { const d = docOfType('resume'); if (d) fromAnswer(d); break; }
      case 'contact': { const d = docOfType('contact'); if (d) fromAnswer(d); break; }
      case 'link': {
        const l = hits.find(h => h.doc.type === 'link');
        if (l) fromAnswer(l.doc);
        else { const d = docOfType('contact'); if (d) fromAnswer(d); }
        break;
      }

      default: {
        // Free search — answer from the single best document.
        if (top) fromAnswer(top);
        hits.slice(1, 1 + CONFIG.maxRelated).forEach(h => {
          if (h.score <= 1.5) return;
          if (sources.some(s => s.label === h.doc.label)) return;
          if (related.some(r => r.label === h.doc.label)) return;
          related.push({ label: h.doc.label, href: h.doc.href, openProject: h.doc.openProject });
        });
      }
    }

    if (!blocks.length) return null;

    // Related pages from remaining strong hits
    hits.slice(1).forEach(h => {
      if (related.length >= CONFIG.maxRelated) return;
      if (h.score < 1.5) return;
      if (sources.some(s => s.label === h.doc.label)) return;
      if (related.some(r => r.label === h.doc.label)) return;
      related.push({ label: h.doc.label, href: h.doc.href, openProject: h.doc.openProject });
    });

    return { blocks, sources: sources.slice(0, CONFIG.maxSources), related: related.slice(0, CONFIG.maxRelated) };
  }

  /* ---------------------------------------------------------
     6. PROVIDER INTERFACE
     Any provider must implement:  answer(query, ctx) -> Promise<Answer>
     Answer = { blocks, sources, related, chips? }
     --------------------------------------------------------- */
  function LocalProvider(kb) {
    const retriever = Retriever(kb);
    return {
      name: 'local-retrieval',
      answer: function (query, ctx) {
        return new Promise(resolve => {
          const resolved = ctx.resolveQuery(query);

          if (isOffTopic(resolved, kb)) {
            return resolve({
              blocks: [{ type: 'p', text: CONFIG.offTopicReply.replace('{SUBJECT}', kb.subject) }],
              sources: [], related: [], chips: true
            });
          }

          const intent = classify(resolved, kb);
          const hits = retriever.search(resolved, { limit: 8 });
          const topical = retriever.topicalSearch(resolved);
          const strong = hits.length && hits[0].score >= CONFIG.minScore;

          let out = null;
          const alwaysAnswerable = ['greeting', 'thanks', 'meta', 'resume', 'contact', 'skills', 'languages', 'projects', 'experience', 'about', 'skillcheck'];
          if (strong || alwaysAnswerable.indexOf(intent) !== -1) {
            out = compose(kb, intent, resolved, hits, ctx.memory, topical);
          }

          if (!out) {
            // Honest not-found + useful escape hatches
            const suggestions = [];
            const pAll = kb.docs.find(d => d.type === 'projects-all');
            const aAll = kb.docs.find(d => d.type === 'about');
            const eAll = kb.docs.find(d => d.type === 'experience-all');
            [aAll, pAll, eAll].forEach(d => d && suggestions.push({ label: d.label, href: d.href }));
            out = {
              blocks: [{ type: 'p', text: CONFIG.notFoundReply.replace(/\{SUBJECT\}/g, kb.subject) }],
              sources: [],
              related: suggestions.slice(0, 3),
              notFound: true
            };
          }
          resolve(out);
        });
      }
    };
  }

  /* ---------------------------------------------------------
     6b. LLMProvider — STUB for swapping in a real model later
     ---------------------------------------------------------
     The retrieval layer above stays exactly as it is: you keep grounding
     the model in real portfolio text, which is what stops hallucination.
     To activate:
       1. Deploy a tiny serverless function that holds your API key and
          forwards {system, messages} to Claude/OpenAI. NEVER put an API
          key in this file — it's public to every visitor.
       2. Assistant.use(Assistant.LLMProvider({ endpoint: '/api/chat' }))
     --------------------------------------------------------- */
  function LLMProvider(options) {
    const opts = options || {};
    return {
      name: 'llm',
      answer: function (query, ctx) {
        const kb = ctx.kb;
        const retriever = Retriever(kb);
        const resolved = ctx.resolveQuery(query);
        const hits = retriever.search(resolved, { limit: 5 });
        const context = hits.map(h => `[${h.doc.label}]\n${h.doc.body}`).join('\n\n');

        const system = [
          `You are ${CONFIG.assistantName}, an assistant for ${kb.subject}'s portfolio website.`,
          `You are NOT ${kb.firstName}. Never say "I built" — always say "${kb.firstName} built" or "According to ${kb.firstName}'s portfolio".`,
          `Answer ONLY from the CONTEXT below. Never invent or guess.`,
          `If the answer is not in the context, reply exactly: "I couldn't find that information in ${kb.subject}'s portfolio."`,
          `If asked about anything unrelated to this portfolio, reply exactly: "${CONFIG.offTopicReply.replace('{SUBJECT}', kb.subject)}"`,
          `Keep answers under 120 words. Cite which sections you used.`
        ].join('\n');

        return fetch(opts.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system: system,
            context: context,
            messages: ctx.memory.turns.slice(-6).map(t => ({ role: t.role, content: t.text })).concat([{ role: 'user', content: query }])
          })
        })
          .then(r => r.json())
          .then(data => ({
            blocks: [{ type: 'p', text: data.reply || '' }],
            sources: hits.slice(0, CONFIG.maxSources).map(h => ({ label: h.doc.label, href: h.doc.href, openProject: h.doc.openProject })),
            related: []
          }))
          .catch(() => ({
            blocks: [{ type: 'p', text: `I'm having trouble reaching my language model right now. You can still browse ${kb.subject}'s work directly.` }],
            sources: [], related: [], error: true
          }));
      }
    };
  }

  /* ---------------------------------------------------------
     7. ASSISTANT — session, memory, pronoun resolution
     --------------------------------------------------------- */
  function createAssistant(options) {
    const opts = options || {};
    const content = opts.content || global.SITE_CONTENT || {};
    const kb = KnowledgeBase(content);
    let provider = opts.provider || LocalProvider(kb);

    const memory = {
      turns: [],                 // {role:'user'|'assistant', text}
      lastTopic: null,           // last strongly-referenced doc
      lastProjectIndex: null
    };

    /* Rewrites "how did he build it?" → "how did he build Forex Analyst?" */
    function resolveQuery(q) {
      let out = String(q || '').trim();
      const hasPronoun = /\b(it|its|it's|that|this|the project|the same|there)\b/i.test(out);
      const namesSomething = kb.docs.some(d =>
        d.title && d.title.length > 3 && out.toLowerCase().includes(d.title.toLowerCase()));
      if (hasPronoun && !namesSomething && memory.lastTopic) {
        out = out.replace(/\b(it|its|it's|that|this|the project|the same)\b/gi, memory.lastTopic.title);
      }
      // Bare follow-ups like "how did he build it" / "why"
      if (out.split(/\s+/).length <= 3 && memory.lastTopic && !namesSomething) {
        out = out + ' ' + memory.lastTopic.title;
      }
      return out;
    }

    const ctx = {
      kb: kb,
      memory: memory,
      resolveQuery: resolveQuery
    };

    return {
      kb: kb,
      memory: memory,
      config: CONFIG,
      subject: kb.subject,
      firstName: kb.firstName,

      use: function (p) { provider = p; return this; },

      /* Main entry point. Returns a Promise of an Answer object. */
      ask: function (query) {
        memory.turns.push({ role: 'user', text: query });
        return provider.answer(query, ctx).then(ans => {
          // Remember the strongest referenced doc for pronoun resolution
          const src = (ans.sources || [])[0];
          if (src) {
            const doc = kb.docs.find(d => d.label === src.label);
            if (doc && (doc.type === 'project' || doc.type === 'experience')) {
              memory.lastTopic = doc;
              if (doc.type === 'project') memory.lastProjectIndex = doc.index;
            }
          }
          memory.turns.push({ role: 'assistant', text: (ans.blocks || []).map(b => b.text || '').join(' ') });
          return ans;
        });
      },

      reset: function () { memory.turns = []; memory.lastTopic = null; memory.lastProjectIndex = null; }
    };
  }

  /* ---------------------------------------------------------
     EXPORTS
     --------------------------------------------------------- */
  const API = {
    create: createAssistant,
    LocalProvider: LocalProvider,
    LLMProvider: LLMProvider,
    KnowledgeBase: KnowledgeBase,
    Retriever: Retriever,
    CONFIG: CONFIG,
    _internals: { tokenize, expand, classify, isOffTopic, compose }
  };

  global.JeffAI = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
