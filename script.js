// Smooth scrolling for in-page anchors
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Mobile navigation
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) {
        toggle.addEventListener('click', () => {
            const open = navLinks.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open);
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('open'));
        });
    }
});

// Research hub tabs
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.hub-tab');
    const panels = document.querySelectorAll('.hub-panel');
    if (!tabs.length) return;

    const sortFilters = document.querySelector('.sort-filters');

    function activateTab(tabId) {
        tabs.forEach(tab => {
            const active = tab.dataset.tab === tabId;
            tab.classList.toggle('active', active);
            tab.setAttribute('aria-selected', active);
        });
        panels.forEach(panel => {
            panel.classList.toggle('active', panel.id === `panel-${tabId}`);
        });
        if (sortFilters) {
            sortFilters.hidden = tabId !== 'papers' && tabId !== 'presentations';
        }
        if (location.hash !== `#${tabId}`) {
            history.replaceState(null, '', `#${tabId}`);
        }
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => activateTab(tab.dataset.tab));
    });

    const hash = location.hash.replace('#', '');
    const validTabs = ['papers', 'presentations', 'awards', 'talks'];
    activateTab(validTabs.includes(hash) ? hash : 'papers');
});

// CV Publication Sorting and Filtering
document.addEventListener('DOMContentLoaded', () => {
    // Only run on CV page
    if (!document.getElementById('sort-by')) return;

    // Name mapping for English and Japanese names
    const nameMapping = {
        'A. Kitadai': '北代絢大',
        'Ayato Kitadai': '北代絢大',
        'M. Fujita': '藤田正典',
        'N. Nishino': '西野成昭',
        'Y. Tsurusaki': '鶴崎祐大',
        'Y. Fukasawa': '深澤祐援',
        'S. Lee': '李相直',
        'S.D.R. Lugo': 'S.D.R. Lugo',
        'S. D. R. Lugo': 'S.D.R. Lugo',
        'S. D. Rico Lugo': 'S.D.R. Lugo',
        'M. Kobayashi': '小林美充希',
        'U. Sato': '佐藤詩',
        'K. Akashi': '赤司一真',
        'S. Sugihara': '杉原翔太',
        'Y. Takenoya': '竹ノ谷悠',
        'K. Ogawa': '小川一仁',
        'T. Nakashima': '中島拓也',
        'R. Ishikawa': '石川竜一郎',
        'J. Teng': '滕健勇',
        'K. Nishiyama': '西山浩平',
        'H. Sawazaki': '澤崎遙夏',
        'T. Oyama': '大山拓',
        'R. Wada': '和田亮',
        'R. Miratsu': '見良津亮',
        'T. Nakamura': '中村太一',
        'H. Watanabe': '渡邊光',
        'Y. Nagaai': '永合由美子',
        'T. Natsume': '夏目哲',
        'F. Miyahara': '宮原史明',
        'T. Itoh': '伊藤拓海',
        'H. Takahashi': '高橋裕紀',
        'K. Sumikura': '隅藏康一',
        'N. Mizutani': '水谷直樹',
        'Z. Zhou': '周澤宇',
        'Z. Cheng': 'Z. Cheng',
        // Add missing Japanese authors
        '藤田正典': '藤田正典',
        '西野成昭': '西野成昭',
        '鶴崎祐大': '鶴崎祐大',
        '深澤祐援': '深澤祐援',
        '李相直': '李相直',
        '小林美充希': '小林美充希',
        '佐藤詩': '佐藤詩',
        '赤司一真': '赤司一真',
        '杉原翔太': '杉原翔太',
        '竹ノ谷悠': '竹ノ谷悠',
        '小川一仁': '小川一仁',
        '中島拓也': '中島拓也',
        '石川竜一郎': '石川竜一郎',
        '滕健勇': '滕健勇',
        '西山浩平': '西山浩平',
        '澤崎遙夏': '澤崎遙夏',
        '大山拓': '大山拓',
        '和田亮': '和田亮',
        '見良津亮': '見良津亮',
        '中村太一': '中村太一',
        '渡邊光': '渡邊光',
        '永合由美子': '永合由美子',
        '夏目哲': '夏目哲',
        '宮原史明': '宮原史明',
        '伊藤拓海': '伊藤拓海',
        '高橋裕紀': '高橋裕紀',
        '隅藏康一': '隅藏康一',
        '水谷直樹': '水谷直樹',
        '周澤宇': '周澤宇',
        '成也': '成也'
    };

    // Chinese names that should remain in Roman letters or Chinese characters
    const chineseNames = ['Z. Cheng', 'Y. Dai', 'X. Shang', 'L. Zhang'];

    const pageLang = document.documentElement.lang === 'ja' ? 'ja' : 'en';

    // Create reverse mapping (Japanese to preferred English key)
    const reverseNameMapping = {};
    Object.keys(nameMapping).forEach(english => {
        if (/^[A-Za-z]/.test(english)) {
            reverseNameMapping[nameMapping[english]] = english;
        }
    });

    function normalizeInitials(name) {
        return name
            .replace(/^([A-Z])\.\s+([A-Z])\.\s+([A-Z])\.\s+/g, '$1.$2.$3. ')
            .replace(/^([A-Z])\.\s+([A-Z])\.\s+/g, '$1.$2. ');
    }

    function isSelfName(name) {
        const trimmed = name.trim();
        return trimmed === 'A. Kitadai' || trimmed === 'Ayato Kitadai' || trimmed === '北代絢大';
    }

    // Canonical key for matching (English key when available)
    function toCanonicalName(name) {
        const trimmed = name.trim();
        if (isSelfName(trimmed)) return '__self__';

        if (chineseNames.includes(trimmed)) {
            return trimmed;
        }

        if (/^S\.?\s*D\.?\s*R\.?\s*Lugo$/i.test(trimmed) || /^S\.?\s*D\.?\s*Rico\s+Lugo$/i.test(trimmed)) {
            return 'S.D.R. Lugo';
        }

        const normalizedInitials = normalizeInitials(trimmed);

        if (/^[A-Za-z]/.test(trimmed) && nameMapping[trimmed]) {
            return trimmed;
        }
        if (/^[A-Za-z]/.test(normalizedInitials) && nameMapping[normalizedInitials]) {
            return normalizedInitials;
        }
        if (reverseNameMapping[trimmed]) {
            return reverseNameMapping[trimmed];
        }
        if (nameMapping[trimmed] && /^[A-Za-z]/.test(trimmed)) {
            return trimmed;
        }

        return normalizedInitials !== trimmed ? normalizedInitials : trimmed;
    }

    function getDisplayName(canonical) {
        if (pageLang === 'ja' && nameMapping[canonical]) {
            return nameMapping[canonical];
        }
        return canonical;
    }

    function normalizeAuthorName(name) {
        return toCanonicalName(name);
    }

    function isSamePerson(name1, name2) {
        return toCanonicalName(name1) === toCanonicalName(name2);
    }

    const sortSelect = document.getElementById('sort-by');
    const filterSelect = document.getElementById('filter-category');
    const coauthorsSelect = document.getElementById('filter-coauthors');
    const firstAuthorCheckbox = document.getElementById('filter-first-author');
    const resetButton = document.getElementById('reset-sort');

    // Store original order
    const originalOrder = new Map();

    // Initialize original order and extract coauthors
    const allCoauthors = new Map();

    const coauthorListClasses = ['journals', 'proceedings', 'working-papers', 'international', 'domestic', 'scheduled'];

    document.querySelectorAll('.cv-publication-list').forEach(list => {
        const items = Array.from(list.children);
        originalOrder.set(list, items.map(item => item.cloneNode(true)));

        const isCoauthorSource = coauthorListClasses.some(cls => list.classList.contains(cls));
        if (!isCoauthorSource) return;

        // Extract coauthors from each publication
        items.forEach(item => {
            const authors = extractAllAuthors(item.innerHTML);
            authors.forEach(author => {
                const canonical = toCanonicalName(author);
                if (canonical !== '__self__') {
                    allCoauthors.set(canonical, (allCoauthors.get(canonical) || 0) + 1);
                }
            });
        });
    });

    // Filter coauthors who appear in 2+ publications
    const frequentCoauthors = Array.from(allCoauthors.entries())
        .filter(([author, count]) => count >= 2)
        .map(([author]) => author)
        .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b), pageLang === 'ja' ? 'ja' : 'en'));

    // Populate coauthors select
    populateCoauthorsSelect(frequentCoauthors);

    const MONTH_MAP = {
        january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
        july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
    };

    function toSortKey(year, month, day) {
        return year * 10000 + month * 100 + day;
    }

    // Numeric date key (YYYYMMDD) for chronological sort; uses latest date in the entry
    function extractSortDate(text) {
        let best = 0;

        const jaRange = text.matchAll(/(\d{4})年(\d{1,2})月(\d{1,2})-\d{1,2}日?/g);
        for (const m of jaRange) {
            best = Math.max(best, toSortKey(+m[1], +m[2], +m[3]));
        }

        const ja = text.matchAll(/(\d{4})年(\d{1,2})月(?:(\d{1,2})日)?/g);
        for (const m of ja) {
            const day = m[3] ? +m[3] : 1;
            best = Math.max(best, toSortKey(+m[1], +m[2], day));
        }

        const monthDayYear = text.matchAll(
            /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:-\d{1,2})?,?\s+(\d{4})\b/gi
        );
        for (const m of monthDayYear) {
            const month = MONTH_MAP[m[1].toLowerCase()];
            best = Math.max(best, toSortKey(+m[3], month, +m[2]));
        }

        const monthYear = text.matchAll(
            /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi
        );
        for (const m of monthYear) {
            const month = MONTH_MAP[m[1].toLowerCase()];
            best = Math.max(best, toSortKey(+m[2], month, 1));
        }

        const dayRangeMonthYear = text.matchAll(
            /\b(\d{1,2})-\d{1,2},?\s+(January|February|March|April|May|June|July|August|September|October|November|December),?\s+(\d{4})\b/gi
        );
        for (const m of dayRangeMonthYear) {
            const month = MONTH_MAP[m[2].toLowerCase()];
            best = Math.max(best, toSortKey(+m[3], month, +m[1]));
        }

        const dayRangeMonthYear2 = text.matchAll(
            /\b(\d{1,2})-\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi
        );
        for (const m of dayRangeMonthYear2) {
            const month = MONTH_MAP[m[2].toLowerCase()];
            best = Math.max(best, toSortKey(+m[3], month, +m[1]));
        }

        if (best > 0) return best;

        const yearMatches = text.match(/\b(19\d{2}|20\d{2})\b/g);
        if (!yearMatches) return 0;
        const years = yearMatches.map(Number).filter(year => year >= 1900 && year <= 2035);
        const year = years.length > 0 ? Math.max(...years) : 0;
        return year ? toSortKey(year, 6, 1) : 0;
    }

    function extractYear(text) {
        const key = extractSortDate(text);
        return key ? Math.floor(key / 10000) : 0;
    }

    // Extract author from publication text
    function extractAuthor(text) {
        const authorMatch = text.match(/^([^;]+)/);
        return authorMatch ? authorMatch[1].trim() : '';
    }

    // Check if a string is likely to be a person's name
    function isPersonName(name) {
        // Remove common title/degree patterns
        const cleanName = name.replace(/^(Dr\.?|Prof\.?|Mr\.?|Ms\.?|Mrs\.?)\s+/i, '');

        // Exclude patterns that are clearly not names
        const excludePatterns = [
            /^\d+年\d+月$/,           // 2023年3月 format
            /^\d{4}年\d{1,2}月$/,     // Year-month format
            /^\d{4}$/,               // Just year numbers
            /^\d+月$/,               // Just month
            /^\d+年$/,               // Just year with 年
            /^\d+月\d+日$/,          // Date format
            /^\d+日$/,               // Just day
            /\d{4}年\d{1,2}月/,     // Contains year-month anywhere
            /^(大阪|東京|京都|神奈川|愛知|福岡|北海道|沖縄|島根|高知|兵庫|千葉|埼玉|茨城|栃木|群馬|山梨|長野|新潟|富山|石川|福井|静岡|岐阜|三重|滋賀|奈良|和歌山|鳥取|岡山|広島|山口|徳島|香川|愛媛|佐賀|長崎|熊本|大分|宮崎|鹿児島|青森|岩手|宮城|秋田|山形|福島)$/,
            /^(pp?\.|pages?|vol\.|volume|no\.|number)\s*\d+/i,  // Page numbers, volumes
            /^IEEE|ACM|IFIP|CIRP|Conference|Workshop|Symposium/i,  // Conference names
            /^Proceedings|Journal|Trans\.|Trans|Transactions/i,     // Publication types
            /^\d+\s*-\s*\d+$/,       // Page ranges like "3250-3257"
            /^\d+\s*,\s*\d+/,        // Number sequences
            /^R&R$/,                 // R&R (Revise and Resubmit)
            /^Under Review$/i,       // Under Review
            /Italia?|Portugal|Spain|United Kingdom|Mexico|Greece/i,  // Country names
            /^(January|February|March|April|May|June|July|August|September|October|November|December)$/i,  // Months
            /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?$/i,  // Abbreviated months
            /^\d+\s*-\s*\d+,?\s+(June|July|March|April|May|August|September|October|November|December)\s*,?\s*\d{4}/i,  // Date ranges
            /^\d+\s*,\s*\d+\s*-\s*\d+$/,  // Volume, page range
            /^\w+\s+(Italy|Portugal|Spain|United Kingdom|Mexico|Greece|Japan|USA|UK)$/i,  // City, Country
            /^\w+\s*,\s*\w+\s*,\s*\d+\s*-\s*\d+,?\s*\d{4}/,  // Complex publication info
            /^\[発表予定\]$/,           // [発表予定]
            /^発表予定$/,              // 発表予定
            /^\d+月\d+日-\d+日$/,      // Date ranges in Japanese
            /^\d+-\d+\s*月$/,           // Month ranges
            /^\d+月\d+日$/,            // Specific dates
            /^\d+月\d+日-\d+日$/,      // Date ranges
            /\bAward\b/i,              // Best Paper Award, etc.
            /\b受賞\b/,
            /\b奨励賞\b/,
            /\b優秀賞\b/,
            /^GDN\b/i,
            /^Poster Presentation\b/i,
            /^行動経済学会/,
            /^サービス学会第\d+回/,
            /^The Group Decision/i,
            /^INFORMS$/i
        ];

        // Check if name matches any exclude pattern
        if (excludePatterns.some(pattern => pattern.test(cleanName))) {
            return false;
        }

        if (/^(Best Paper|Arai Award|\d{4} GDN)/i.test(cleanName)) {
            return false;
        }

        // Additional checks for person names
        // Names typically have alphabetic characters and maybe some punctuation
        if (!/^[A-Za-z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s\.,'-]+$/.test(cleanName)) {
            return false;
        }

        // Names are typically between 2-50 characters
        if (cleanName.length < 2 || cleanName.length > 50) {
            return false;
        }

        // Additional specific exclusions for common non-name patterns
        const specificExclusions = [
            '大阪', '東京', '京都', '神奈川', '愛知', '福岡', '北海道', '沖縄', '島根', '高知',
            '兵庫', '千葉', '埼玉', '茨城', '栃木', '群馬', '山梨', '長野', '新潟', '富山',
            '石川', '福井', '静岡', '岐阜', '三重', '滋賀', '奈良', '和歌山', '鳥取', '岡山',
            '広島', '山口', '徳島', '香川', '愛媛', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島',
            '青森', '岩手', '宮城', '秋田', '山形', '福島'
        ];

        if (specificExclusions.includes(cleanName)) {
            return false;
        }

        // Should contain at least one letter
        if (!/[A-Za-z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(cleanName)) {
            return false;
        }

        return true;
    }

    // Extract all authors from publication HTML
    function extractAllAuthors(html) {
        // Remove any leading numbering like "[P1] " or similar
        const cleanHtml = html.replace(/^\[[^\]]+\]\s*/, '');

        // First, try to extract the initial part that likely contains authors
        // This helps distinguish between Japanese and English publications
        let initialPart = '';
        const firstSentenceMatch = cleanHtml.match(/^([^.;："「]+)/);
        if (firstSentenceMatch) {
            initialPart = firstSentenceMatch[1];
        }

        // Check if the author section contains Japanese characters (excluding HTML tags)
        const initialPartText = initialPart.replace(/<[^>]*>/g, '');
        const isJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(initialPartText);

        let authorSection = '';

        if (isJapanese) {
            // For Japanese publications, extract everything before ：「 (colon followed by quote)
            const japaneseMatch = cleanHtml.match(/^([^：]+)：/);
            if (japaneseMatch) {
                authorSection = japaneseMatch[1];
            } else {
                // Fallback: try to extract before the first quote
                const quotMatch = cleanHtml.match(/^([^「"]+)/);
                if (quotMatch) {
                    authorSection = quotMatch[1];
                } else {
                    // Last resort: take first part before semicolon
                    const semiMatch = cleanHtml.match(/^([^;]+)/);
                    authorSection = semiMatch ? semiMatch[1] : cleanHtml;
                }
            }
        } else {
            // For English publications, extract everything before the first semicolon or quote
            const authorMatch = cleanHtml.match(/^([^;"]+)/);
            if (!authorMatch) return [];
            authorSection = authorMatch[1];
        }

        // Remove HTML tags and normalize whitespace
        const plainText = authorSection.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

        // Split by comma and "and" (with optional &), then clean up
        const authors = plainText.split(/,|\s+and\s+|\s+&\s+/)
            .map(author => author.trim())
            .filter(author => {
                // Basic filters
                if (author.length === 0 || author.match(/^\d+$/)) {
                    return false;
                }
                // Apply person name filter
                return isPersonName(author);
            });

        return authors;
    }

    // Populate coauthors select dropdown
    function populateCoauthorsSelect(authors) {
        const allLabel = pageLang === 'ja' ? 'すべて' : 'All';
        coauthorsSelect.innerHTML = `<option value="">${allLabel}</option>`;
        authors.forEach(canonical => {
            const option = document.createElement('option');
            option.value = canonical;
            option.textContent = getDisplayName(canonical);
            coauthorsSelect.appendChild(option);
        });
    }

    // Check if A.Kitadai or 北代絢大 is first author
    function isFirstAuthor(html) {
        // Remove any leading numbering like "[P1] " or similar
        const cleanHtml = html.replace(/^\[[^\]]+\]\s*/, '');

        // Check if text starts with A. Kitadai (English format)
        const isFirstEnglish = /^(<strong>)?\s*A\.\s*Kitadai(<\/strong>)?[\s,;]/.test(cleanHtml) ||
            /^<strong>A\.\s*Kitadai<\/strong>[\s,;]/.test(cleanHtml);

        // Check if text starts with 北代絢大 (Japanese format)
        const isFirstJapanese = /^(<strong>)?\s*北代絢大(<\/strong>)?[\s,;：]/.test(cleanHtml) ||
            /^<strong>北代絢大<\/strong>[\s,;：]/.test(cleanHtml);

        return isFirstEnglish || isFirstJapanese;
    }

    // Sort publications
    function sortPublications(sortBy) {
        document.querySelectorAll('.cv-publication-list').forEach(list => {
            const items = Array.from(list.children);

            let sortedItems;
            switch (sortBy) {
                case 'year-desc':
                    sortedItems = items.sort((a, b) => {
                        return extractSortDate(b.textContent) - extractSortDate(a.textContent);
                    });
                    break;

                case 'year-asc':
                    sortedItems = items.sort((a, b) => {
                        return extractSortDate(a.textContent) - extractSortDate(b.textContent);
                    });
                    break;

                case 'author':
                    sortedItems = items.sort((a, b) => {
                        const authorA = extractAuthor(a.textContent);
                        const authorB = extractAuthor(b.textContent);
                        return authorA.localeCompare(authorB);
                    });
                    break;

                default:
                    // Use original order
                    const originalItems = originalOrder.get(list);
                    if (originalItems) {
                        sortedItems = originalItems.map(item => item.cloneNode(true));
                    } else {
                        sortedItems = items;
                    }
                    break;
            }

            // Clear and re-append sorted items
            list.innerHTML = '';
            sortedItems.forEach(item => {
                list.appendChild(item);
            });

            // Add sorted class for styling
            if (sortBy !== 'default') {
                list.classList.add('sorted');
            } else {
                list.classList.remove('sorted');
            }
        });
    }

    // Filter publications by category
    function filterPublications(category) {
        document.querySelectorAll('.cv-subsection').forEach(section => {
            const list = section.querySelector('.cv-publication-list');
            if (!list) return;

            if (category === 'all') {
                section.classList.remove('hidden');
            } else {
                const hasCategory = list.classList.contains(category);
                section.classList.toggle('hidden', !hasCategory);
            }
        });
    }

    // Legacy function - now handled in applyAllFilters
    function filterByCoauthors(selectedAuthors) {
        // This function is now integrated into applyAllFilters
        // Keeping for backward compatibility
    }

    // Legacy function - now handled in applyAllFilters
    function filterByFirstAuthor(showFirstAuthorOnly) {
        // This function is now integrated into applyAllFilters
        // Keeping for backward compatibility
    }

    // Apply all filters
    function applyAllFilters() {
        const categoryFilter = filterSelect.value;
        const selectedCoauthors = coauthorsSelect.value;
        const firstAuthorFilter = firstAuthorCheckbox.checked;

        // Apply category filter (section level)
        filterPublications(categoryFilter);

        // Apply item-level filters
        document.querySelectorAll('.cv-publication-list').forEach(list => {
            const items = Array.from(list.children);

            items.forEach(item => {
                let shouldShow = true;

                // Check coauthor filter
                if (selectedCoauthors && selectedCoauthors.length > 0) {
                    const authors = extractAllAuthors(item.innerHTML);
                    const canonicalAuthors = authors.map(author => toCanonicalName(author));
                    const hasSelectedAuthor = canonicalAuthors.includes(selectedCoauthors);
                    if (!hasSelectedAuthor) {
                        shouldShow = false;
                    }
                }

                // Check first author filter
                if (firstAuthorFilter) {
                    const isFirst = isFirstAuthor(item.innerHTML);
                    if (!isFirst) {
                        shouldShow = false;
                    }
                }

                // Apply visibility
                if (shouldShow) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // Legacy function - now handled in applyAllFilters
    function updateItemVisibility() {
        // This function is now integrated into applyAllFilters
        // Keeping for backward compatibility
    }

    // Reset to original state
    function resetSortFilter() {
        sortSelect.value = 'year-desc';
        filterSelect.value = 'all';

        coauthorsSelect.value = '';
        firstAuthorCheckbox.checked = false;

        sortPublications('year-desc');
        applyAllFilters();
    }

    // Event listeners
    sortSelect.addEventListener('change', (e) => {
        sortPublications(e.target.value);
        // Apply filters after sorting
        setTimeout(() => applyAllFilters(), 10);
    });

    filterSelect.addEventListener('change', (e) => {
        applyAllFilters();
    });

    coauthorsSelect.addEventListener('change', (e) => {
        applyAllFilters();
    });

    firstAuthorCheckbox.addEventListener('change', (e) => {
        applyAllFilters();
    });

    resetButton.addEventListener('click', resetSortFilter);

    // Default: newest publications first
    sortSelect.value = 'year-desc';
    sortPublications('year-desc');
});