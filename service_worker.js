// service_worker.js
// Chrome Extension Background Script for Farside Redirector
// Redirects popular domains to their privacy-focused alternatives via farside.link

let isRedirectionEnabled = true;

const DEFAULT_REDIRECT_MAP = {
  "www.reddit.com": "https://farside.link/libreddit",
  "twitter.com": "https://farside.link/nitter",
  "x.com": "https://farside.link/nitter",
  "www.youtube.com": "https://farside.link/invidious",
  "instagram.com": "https://farside.link/proxigram",
  "www.instagram.com": "https://farside.link/proxigram",
  "tiktok.com": "https://farside.link/proxitok",
  "www.tiktok.com": "https://farside.link/proxitok",
  "vm.tiktok.com": "https://farside.link/proxitok",
  "vt.tiktok.com": "https://farside.link/proxitok",
  "medium.com": "https://farside.link/scribe",
  "translate.google.com": "https://farside.link/simplytranslate",
  "imgur.com": "https://farside.link/rimgo",
  "en.wikipedia.org": "https://farside.link/wikiless",
  "www.imdb.com": "https://farside.link/libremdb",
  "quora.com": "https://farside.link/quetre",
  "stackoverflow.com": "https://farside.link/anonymousoverflow",
  "fandom.com": "https://farside.link/breezewiki",
  "www.fandom.com": "https://farside.link/breezewiki",
  "genius.com": "https://farside.link/dumb",
  "www.genius.com": "https://farside.link/dumb",
  "bandcamp.com": "https://farside.link/tent",
  "www.bandcamp.com": "https://farside.link/tent",
  "github.com": "https://farside.link/gothub",
  "www.github.com": "https://farside.link/gothub"
};

let userRedirectMap = { ...DEFAULT_REDIRECT_MAP };

// Initialize settings from storage
chrome.storage.sync.get(["enabled", "customMap"], (res) => {
  isRedirectionEnabled = res.enabled ?? true;
  if (res.customMap) {
    userRedirectMap = { ...DEFAULT_REDIRECT_MAP, ...res.customMap };
  }
});

// Listen for options updates from the options page
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.type === "updateSettings") {
    isRedirectionEnabled = message.enabled;
    userRedirectMap = { ...DEFAULT_REDIRECT_MAP, ...message.updatedMap };
    sendResponse({ status: "settings_updated" });
  }
  return true;
});

// Core redirection logic using webNavigation API for Manifest V3
chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    // Only process main frame navigations (not iframes, etc)
    if (details.frameId !== 0) return;
    
    if (!isRedirectionEnabled) return;
    
    try {
      const url = new URL(details.url);
      let hostname = url.hostname;
      
      // Debug logging
      console.log("Navigation detected:", hostname, details.url);
      
      // Check for domain match
      let redirectBase = null;
      
      // Direct match check
      redirectBase = userRedirectMap[hostname];
      
      // If no match, try stripping 'www.' prefix
      if (!redirectBase && hostname.startsWith('www.')) {
        const nonWwwHostname = hostname.replace('www.', '');
        redirectBase = userRedirectMap[nonWwwHostname];
      }
      
      // If no match, try adding 'www.' prefix
      if (!redirectBase && !hostname.startsWith('www.')) {
        const wwwHostname = 'www.' + hostname;
        redirectBase = userRedirectMap[wwwHostname];
      }
      
      // Check for TikTok mobile or special domains
      if (!redirectBase && hostname.includes('tiktok')) {
        redirectBase = "https://farside.link/proxitok";
      }

      if (!redirectBase || redirectBase.trim() === "") {
        console.log("No redirect found for:", hostname);
        return;
      }

      console.log("Redirecting:", hostname, "to", redirectBase);
      const redirectUrl = redirectBase + url.pathname + url.search;
      
      // Redirect the tab
      chrome.tabs.update(details.tabId, { url: redirectUrl });
    } catch (error) {
      console.error("Error in redirection logic:", error);
    }
  }
);

// Listen for storage changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    isRedirectionEnabled = changes.enabled.newValue;
  }
  if (changes.customMap) {
    userRedirectMap = { ...DEFAULT_REDIRECT_MAP, ...changes.customMap.newValue };
  }
});
