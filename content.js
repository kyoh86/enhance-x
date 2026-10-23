(() => {
  "use strict";

  let settings = { ...ENHANCE_X_DEFAULTS };
  let ready = false;
  const hiddenAttribute = "data-enhance-x-hidden";
  const moduleTitles = new Map([
    ...[
    "「いま」を見つけよう", "「いま」をみつけよう", "いまを見つけよう",
    "いまどうしてる？", "What’s happening", "What's happening",
    ].map((title) => [title, "trends"]),
    ...["おすすめユーザー", "Who to follow"].map((title) => [title, "users"]),
    ...["今日のニュース", "Today’s News", "Today's News"].map((title) => [title, "news"]),
    ...["プレミアムにサブスクライブ", "プレミアムにサブスクライブする", "Subscribe to Premium"]
      .map((title) => [title, "premium"]),
  ]);
  const recommendedTabs = new Set(["おすすめ", "For you"]);
  const followingTabs = new Set(["フォロー中", "Following"]);
  const attemptedTabs = new WeakSet();
  const normalize = (text) => text.replace(/\s+/g, " ").trim();
  const hide = (element) => element.setAttribute(hiddenAttribute, "");

  function isEmptyDecoration(node) {
    if (node.nodeType === Node.TEXT_NODE) return !normalize(node.textContent);
    if (node.nodeType !== Node.ELEMENT_NODE) return true;
    if (node.hasAttribute(hiddenAttribute)) return true;
    // Empty borders/spacers are disposable; controls and media are not.
    return !normalize(node.textContent) &&
      !node.matches('a, button, input, textarea, select, img, svg, video, [role], [tabindex]') &&
      !node.querySelector('a, button, input, textarea, select, img, svg, video, [role], [tabindex]');
  }

  function hideWithEmptyWrappers(element, boundary) {
    let target = element;
    while (target.parentElement && target.parentElement !== boundary) {
      const parent = target.parentElement;
      if (![...parent.childNodes].every((node) => node === target || isEmptyDecoration(node))) break;
      target = parent;
    }
    hide(target);
  }

  function cleanNavigation() {
    const groups = [
      ["explore", ["話題を検索", "Explore"], ["/explore"]],
      ["grok", ["Grok"], ["/i/grok"]],
      ["premium", ["プレミアム", "Premium", "プレミアムにサブスクライブ", "Subscribe to Premium"], ["/i/premium_sign_up", "/i/verified-choose"]],
      ["studio", ["クリエイタースタジオ", "Creator Studio"], ["/i/jf/creators/studio"]],
    ];
    for (const nav of document.querySelectorAll('header nav')) {
      for (const link of nav.querySelectorAll('a[href]')) {
        const path = new URL(link.getAttribute("href"), location.origin).pathname.replace(/\/$/, "");
        const label = normalize(link.getAttribute("aria-label") || link.textContent);
        if (groups.some(([key, labels, paths]) => settings[key] &&
            (paths.includes(path) || labels.includes(label)))) hideWithEmptyWrappers(link, nav);
      }
    }
  }

  function cleanModules() {
    // Limit heading matching to UI headings, so ordinary posts stay visible.
    for (const heading of document.querySelectorAll('h2, h3, [role="heading"], [data-testid="sidebarColumn"] span, [data-testid="sidebarColumn"] aside[aria-label]')) {
      const title = normalize(heading.getAttribute("aria-label") || heading.textContent);
      const key = moduleTitles.get(title);
      // Premium promos sometimes use a plain span instead of a semantic heading.
      if (!heading.matches('h2, h3, [role="heading"]') && key !== "premium") continue;
      if (!settings[key]) continue;
      if (heading.closest('article, [data-testid="tweet"], [role="dialog"]')) continue;

      const sidebar = heading.closest('[data-testid="sidebarColumn"]');
      if (sidebar) {
        // X wraps sidebar cards in a rounded, overflow-hidden container.
        // Walk only inside the sidebar and never hide the whole column.
        let card = heading.closest('aside, section, [role="region"]');
        if (!card || !sidebar.contains(card)) {
          card = heading.parentElement;
          let candidate = card;
          while (candidate && candidate !== sidebar) {
            if (getComputedStyle(candidate).overflow === "hidden") {
              card = candidate;
              break;
            }
            candidate = candidate.parentElement;
          }
        }
        if (card && card !== sidebar) hideWithEmptyWrappers(card, sidebar);
      } else if (moduleTitles.has(normalize(heading.textContent)) &&
                 ["おすすめユーザー", "Who to follow"].includes(normalize(heading.textContent))) {
        // Inline recommendations are individual virtualized timeline cells.
        const cell = heading.closest('[data-testid="cellInnerDiv"]');
        if (!cell) continue;
        hide(cell);
        let next = cell.nextElementSibling;
        while (next && next.querySelector('[data-testid="UserCell"], a[href*="/i/connect_people"]') &&
               !next.querySelector('article, [data-testid="tweet"]')) {
          hide(next);
          next = next.nextElementSibling;
        }
      }
    }
  }

  function cleanHomeTabs() {
    if (!settings.forYou) return;
    if (!/^\/home\/?$/.test(location.pathname)) return;
    for (const list of document.querySelectorAll('[data-testid="primaryColumn"] [role="tablist"]')) {
      const tabs = [...list.querySelectorAll('[role="tab"]')];
      const recommended = tabs.find((tab) => recommendedTabs.has(normalize(tab.textContent)));
      const following = tabs.find((tab) => followingTabs.has(normalize(tab.textContent)));
      if (!recommended || !following) continue;
      // The flex item may wrap the tab link and still occupy half the bar.
      hideWithEmptyWrappers(recommended, list);
      if (following.getAttribute("aria-selected") === "true") attemptedTabs.delete(recommended);
      if (recommended.getAttribute("aria-selected") === "true" && !attemptedTabs.has(recommended)) {
        attemptedTabs.add(recommended);
        following.click();
      }
    }
  }

  let scheduled = false;
  function schedule() {
    if (!ready || scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      // Virtualized cells can be reused for unrelated content.
      document.querySelectorAll(`[${hiddenAttribute}]`).forEach((element) => {
        element.removeAttribute(hiddenAttribute);
      });
      cleanModules();
      // A later card may have shared an outer wrapper with an earlier card.
      // Collapse it after all target cards have been marked.
      for (const sidebar of document.querySelectorAll('[data-testid="sidebarColumn"]')) {
        for (const hidden of sidebar.querySelectorAll(`[${hiddenAttribute}]`)) {
          hideWithEmptyWrappers(hidden, sidebar);
        }
      }
      cleanHomeTabs();
      cleanNavigation();
    });
  }

  new MutationObserver(schedule).observe(document, {
    subtree: true, childList: true, characterData: true,
    attributes: true, attributeFilter: ["aria-selected", "data-testid", "href"],
  });
  window.addEventListener("popstate", schedule);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    for (const key of Object.keys(ENHANCE_X_DEFAULTS)) {
      if (changes[key]) settings[key] = changes[key].newValue ?? ENHANCE_X_DEFAULTS[key];
    }
    schedule();
  });
  chrome.storage.local.get(ENHANCE_X_DEFAULTS).then((saved) => {
    settings = { ...settings, ...saved };
    ready = true;
    schedule();
  }).catch(() => {
    ready = true;
    schedule();
  });
})();
