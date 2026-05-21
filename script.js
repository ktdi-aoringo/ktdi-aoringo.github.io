// =====================================================================
// Kitadai Lab — v2 site script
// • Theme: light / dark / auto, persisted to localStorage, respects OS
// • Language: en / ja, persisted, swaps every [data-en]/[data-ja] string
// • Mobile menu
// • Research-hub: tab switching, sort, filter
// =====================================================================

(function () {
    'use strict';

    const root = document.documentElement;

    // Mark <html> as JS-enabled so CSS fallback rules don't apply.
    root.classList.add('js');

    // ----- Theme -----------------------------------------------------
    // Binary: 'light' | 'dark'. First visit reads OS preference.
    const THEME_KEY = 'ktdi-theme';
    const validTheme = (t) => t === 'light' || t === 'dark';
    const savedTheme = (function () {
        try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
    })();
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = validTheme(savedTheme) ? savedTheme : (prefersDark ? 'dark' : 'light');
    root.setAttribute('data-theme', initialTheme);

    function cycleTheme() {
        const current = root.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
        updateThemeLabel(next);
    }
    function updateThemeLabel(theme) {
        const btn = document.querySelector('.theme-toggle');
        if (!btn) return;
        btn.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }

    // ----- Language --------------------------------------------------
    const LANG_KEY = 'ktdi-lang';
    const savedLang = (function () {
        try { return localStorage.getItem(LANG_KEY); } catch (e) { return null; }
    })();
    const initialLang = (savedLang === 'ja' || savedLang === 'en') ? savedLang : 'en';

    function applyLang(lang) {
        root.setAttribute('lang', lang);

        // Swap any element carrying both [data-en] and [data-ja]
        document.querySelectorAll('[data-en], [data-ja]').forEach(el => {
            const next = el.getAttribute('data-' + lang);
            if (next === null) return;
            // <option> needs text rewrite via .text for older browsers, but
            // innerHTML works in every modern engine and lets us embed spans.
            el.innerHTML = next;
        });

        // Toggle button active state
        document.querySelectorAll('[data-lang-btn]').forEach(btn => {
            btn.classList.toggle('is-active', btn.getAttribute('data-lang-btn') === lang);
        });

        try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}

        // Page title
        const isResearch = /research\.html/i.test(location.pathname);
        if (lang === 'ja') {
            document.title = isResearch ? '研究業績 — 北代 絢大' : '北代 絢大 — Kitadai Lab';
        } else {
            document.title = isResearch ? 'Research — Ayato Kitadai' : 'Ayato Kitadai — Kitadai Lab';
        }
    }

    // ----- Mobile menu -----------------------------------------------
    function setupMenu() {
        const toggle = document.querySelector('.menu-toggle');
        const links  = document.querySelector('.nav-links');
        if (!toggle || !links) return;
        toggle.addEventListener('click', () => {
            const open = links.classList.toggle('open');
            toggle.setAttribute('aria-expanded', String(open));
        });
        links.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                links.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // ----- Scroll spy (home only) ------------------------------------
    function setupActiveLink() {
        const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
        if (!links.length) return;
        const targets = links
            .map(a => {
                const href = a.getAttribute('href');
                if (!href || href.length < 2) return null;
                const id = href.slice(1);
                const el = document.getElementById(id);
                return el ? { id, link: a, el } : null;
            })
            .filter(Boolean);
        if (!targets.length) return;

        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    targets.forEach(t => t.link.classList.toggle('active', t.id === e.target.id));
                }
            });
        }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
        targets.forEach(t => io.observe(t.el));
    }

    // ----- Research-hub tabs + sort + filter -------------------------
    function setupHub() {
        const tabs    = document.querySelectorAll('.hub-tab');
        const panels  = document.querySelectorAll('.hub-panel');
        const toolbar = document.getElementById('hub-toolbar');
        if (!tabs.length) return;

        // Remember the original order of each list so 'Original order' works.
        const originalOrder = new Map();
        document.querySelectorAll('.pub-list').forEach(list => {
            originalOrder.set(list, Array.from(list.children));
        });

        function setActiveTab(tabId) {
            tabs.forEach(t => {
                const active = t.getAttribute('data-tab') === tabId;
                t.classList.toggle('active', active);
                t.setAttribute('aria-selected', String(active));
            });
            panels.forEach(p => p.classList.toggle('active', p.id === 'panel-' + tabId));

            // Sort/filter only meaningful on Papers & Presentations
            const showToolbar = tabId === 'papers' || tabId === 'presentations';
            if (toolbar) toolbar.style.display = showToolbar ? '' : 'none';

            if (location.hash !== '#' + tabId) {
                history.replaceState(null, '', '#' + tabId);
            }
        }

        tabs.forEach(t => t.addEventListener('click', () => setActiveTab(t.getAttribute('data-tab'))));

        const validTabs = ['papers', 'presentations', 'awards', 'talks'];
        const hash = location.hash.replace('#', '');
        setActiveTab(validTabs.includes(hash) ? hash : 'papers');

        // Sort
        const sortSelect       = document.getElementById('sort-by');
        const categorySelect   = document.getElementById('filter-category');
        const firstAuthorCheck = document.getElementById('filter-first');
        const resetBtn         = document.getElementById('reset-filters');

        function sortLists(mode) {
            document.querySelectorAll('.pub-list').forEach(list => {
                const items = Array.from(list.children);
                let sorted;
                if (mode === 'year-desc') {
                    sorted = [...items].sort((a, b) =>
                        (parseInt(b.getAttribute('data-year'), 10) || 0) -
                        (parseInt(a.getAttribute('data-year'), 10) || 0));
                } else if (mode === 'year-asc') {
                    sorted = [...items].sort((a, b) =>
                        (parseInt(a.getAttribute('data-year'), 10) || 0) -
                        (parseInt(b.getAttribute('data-year'), 10) || 0));
                } else {
                    sorted = originalOrder.get(list) || items;
                }
                sorted.forEach(it => list.appendChild(it));
            });
        }

        function applyFilters() {
            const cat = categorySelect ? categorySelect.value : 'all';
            const firstOnly = firstAuthorCheck ? firstAuthorCheck.checked : false;

            document.querySelectorAll('.hub-subsection').forEach(sub => {
                const sc = sub.getAttribute('data-category');
                sub.classList.toggle('hidden', cat !== 'all' && cat !== sc);
            });

            document.querySelectorAll('.pub-item').forEach(item => {
                const isFirst = item.getAttribute('data-first') === 'true';
                item.classList.toggle('hidden', firstOnly && !isFirst);
            });
        }

        function reset() {
            if (sortSelect)       sortSelect.value         = 'year-desc';
            if (categorySelect)   categorySelect.value     = 'all';
            if (firstAuthorCheck) firstAuthorCheck.checked = false;
            sortLists('year-desc');
            applyFilters();
        }

        if (sortSelect)       sortSelect.addEventListener('change',  e => sortLists(e.target.value));
        if (categorySelect)   categorySelect.addEventListener('change', applyFilters);
        if (firstAuthorCheck) firstAuthorCheck.addEventListener('change', applyFilters);
        if (resetBtn)         resetBtn.addEventListener('click', reset);

        sortLists('year-desc');
        applyFilters();
    }

    // ----- Hero entrance (class-driven; reliable in throttled tabs) --
    function setupHeroEntrance() {
        const heroText = document.querySelector('.hero-text');
        const portrait = document.querySelector('.hero-portrait');
        // Two rAFs to ensure styles commit before class flip → transition fires.
        requestAnimationFrame(() => requestAnimationFrame(() => {
            if (heroText) heroText.classList.add('is-revealed');
            if (portrait) portrait.classList.add('is-revealed');
        }));
        // Safety: if transitions are paused (e.g. background tab), still show.
        setTimeout(() => {
            if (heroText) heroText.classList.add('is-revealed');
            if (portrait) portrait.classList.add('is-revealed');
        }, 1800);
    }

    // ----- Scroll-reveal observer (re-triggers each time element enters)
    function setupReveal() {
        const targets = document.querySelectorAll(
            '.section, .hub-subsection, .approach-row, .timeline-item, .pub-item, .contact-card, .interest-row'
        );
        if (!targets.length) return;
        targets.forEach(t => t.classList.add('reveal'));

        if (!('IntersectionObserver' in window)) {
            targets.forEach(t => t.classList.add('is-visible'));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('is-visible');
                } else if (e.boundingClientRect.top > 0) {
                    // Only reset when the element has scrolled below the viewport
                    // (so scrolling UP into it re-triggers). Don't reset when it
                    // exits above — that would re-animate on every scroll-up.
                    e.target.classList.remove('is-visible');
                }
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
        targets.forEach(t => io.observe(t));

        // Safety: force-show everything 3s after pageload in case observer is broken.
        setTimeout(() => {
            targets.forEach(t => t.classList.add('is-visible'));
        }, 3000);
    }

    // ----- Magnetic-button mouse tracking ----------------------------
    function setupMagneticButtons() {
        document.querySelectorAll('.btn.primary').forEach(btn => {
            btn.addEventListener('pointermove', (e) => {
                const r = btn.getBoundingClientRect();
                const x = ((e.clientX - r.left) / r.width)  * 100;
                const y = ((e.clientY - r.top)  / r.height) * 100;
                btn.style.setProperty('--mx', x + '%');
                btn.style.setProperty('--my', y + '%');
            });
        });
    }

    // ----- Init ------------------------------------------------------
    document.addEventListener('DOMContentLoaded', () => {
        applyLang(initialLang);
        updateThemeLabel(initialTheme);
        setupMenu();
        setupActiveLink();
        setupHub();
        setupHeroEntrance();
        setupReveal();
        setupMagneticButtons();

        const themeBtn = document.querySelector('.theme-toggle');
        if (themeBtn) themeBtn.addEventListener('click', cycleTheme);
        document.querySelectorAll('[data-lang-btn]').forEach(btn => {
            btn.addEventListener('click', () => applyLang(btn.getAttribute('data-lang-btn')));
        });
    });
})();
