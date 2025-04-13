// Domain to Display Name mapping
const SITE_DISPLAY_NAMES = {
  "www.youtube.com": "YouTube",
  "twitter.com": "Twitter/X",
  "x.com": "Twitter/X",
  "www.reddit.com": "Reddit",
  "instagram.com": "Instagram",
  "tiktok.com": "TikTok",
  "www.tiktok.com": "TikTok",
  "stackoverflow.com": "Stack Overflow",
  "en.wikipedia.org": "Wikipedia",
  "medium.com": "Medium",
  "quora.com": "Quora",
  "imgur.com": "Imgur",
  "www.imdb.com": "IMDB",
  "translate.google.com": "Google Translate",
  "fandom.com": "Fandom",
  "genius.com": "Genius",
  "bandcamp.com": "Bandcamp",
  "github.com": "GitHub"
};

// Group related domains (like www and non-www versions)
const DOMAIN_GROUPS = {
  "YouTube": ["www.youtube.com"],
  "Twitter/X": ["twitter.com", "x.com"],
  "Reddit": ["www.reddit.com"],
  "Instagram": ["instagram.com", "www.instagram.com"],
  "TikTok": ["tiktok.com", "www.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"],
  "Stack Overflow": ["stackoverflow.com"],
  "Wikipedia": ["en.wikipedia.org"],
  "Medium": ["medium.com"],
  "Quora": ["quora.com"],
  "Imgur": ["imgur.com"],
  "IMDB": ["www.imdb.com"],
  "Google Translate": ["translate.google.com"],
  "Fandom": ["fandom.com", "www.fandom.com"],
  "Genius": ["genius.com", "www.genius.com"],
  "Bandcamp": ["bandcamp.com", "www.bandcamp.com"],
  "GitHub": ["github.com", "www.github.com"]
};

const DEFAULT_MAP = {
  "www.youtube.com": "https://farside.link/invidious",
  "twitter.com": "https://farside.link/nitter",
  "x.com": "https://farside.link/nitter",
  "www.reddit.com": "https://farside.link/libreddit",
  "instagram.com": "https://farside.link/proxigram",
  "tiktok.com": "https://farside.link/proxitok",
  "www.tiktok.com": "https://farside.link/proxitok",
  "stackoverflow.com": "https://farside.link/anonymousoverflow",
  "en.wikipedia.org": "https://farside.link/wikiless",
  "medium.com": "https://farside.link/scribe",
  "quora.com": "https://farside.link/quetre",
  "imgur.com": "https://farside.link/rimgo",
  "www.imdb.com": "https://farside.link/libremdb",
  "translate.google.com": "https://farside.link/simplytranslate",
  "fandom.com": "https://farside.link/breezewiki",
  "genius.com": "https://farside.link/dumb",
  "bandcamp.com": "https://farside.link/tent",
  "github.com": "https://farside.link/gothub"
};

// Services organized by category with updated mappings and reordered by popularity
const CATEGORIZED_QUICK_LINKS = {
  "Search": ["whoogle", "searx", "searxng", "4get", "librey"],
  "Google Translate": ["lingva", "simplytranslate"],
  "YouTube": ["invidious", "piped"],
  "Twitter": ["nitter"],
  "Reddit": ["libreddit", "redlib", "teddit"],
  "Instagram": ["proxigram"],
  "TikTok": ["proxitok"],
  "StackOverflow": ["anonymousoverflow"],
  "Wikipedia": ["wikiless"],
  "GitHub": ["gothub"],
  "Medium": ["scribe"],
  "Quora": ["quetre"],
  "Imgur": ["rimgo"],
  "IMDB": ["libremdb"],
  "Fandom": ["breezewiki"],
  "Genius.com": ["dumb"],
  "Bandcamp": ["tent"]
};

// Flat list for backward compatibility
const QUICK_LINKS = Object.values(CATEGORIZED_QUICK_LINKS).flat();

// Settings initialization
const globalToggleContainer = document.querySelector('.toggle-row:first-of-type');
const siteOptions = document.getElementById("site-options");

// Replace global toggle with static text
globalToggleContainer.innerHTML = '<strong>All Redirects Enabled</strong> (toggle individual sites below)';

// Ensure global redirect is always enabled
chrome.storage.sync.set({ enabled: true }, () => {
  chrome.runtime.sendMessage({
    type: 'updateSettings',
    enabled: true
  });
});

chrome.storage.sync.get(["customMap"], (res) => {
  const customMap = res.customMap ?? DEFAULT_MAP;

  // Track processed groups to avoid duplicates
  const processedGroups = new Set();
  
  // Process domains by their group name
  for (const [domain, redirect] of Object.entries(DEFAULT_MAP)) {
    const displayName = SITE_DISPLAY_NAMES[domain];
    
    // Skip if this group is already processed
    if (processedGroups.has(displayName)) continue;
    processedGroups.add(displayName);
    
    // Get all domains in this group
    const domains = DOMAIN_GROUPS[displayName];
    
    // Check if any domain in the group is enabled
    const groupEnabled = domains.some(d => customMap[d] !== "");
    
    const row = document.createElement("label");
    row.className = "toggle-row";
    row.innerHTML = `<span>${displayName}</span>
                    <input type="checkbox" data-group="${displayName}" 
                    data-domains='${JSON.stringify(domains)}' ${groupEnabled ? "checked" : ""}>`;
    siteOptions.appendChild(row);
  }
});

siteOptions.addEventListener("change", (event) => {
  if (event.target.type === "checkbox" && event.target.dataset.group) {
    const groupName = event.target.dataset.group;
    const domains = JSON.parse(event.target.dataset.domains);
    const enabled = event.target.checked;
    
    chrome.storage.sync.get(['customMap'], (result) => {
      const customMap = result.customMap || {};
      
      // Update all domains in this group
      domains.forEach(domain => {
        customMap[domain] = enabled ? DEFAULT_MAP[domain] : "";
      });
      
      // Save to storage
      chrome.storage.sync.set({ customMap }, notifyBackground);
    });
  }
});

function notifyBackground() {
  chrome.storage.sync.get(["customMap"], (res) => {
    chrome.runtime.sendMessage({
      type: "updateSettings",
      enabled: true, // Always ensure enabled is true
      updatedMap: res.customMap ?? DEFAULT_MAP
    });
  });
}

// Quick Links Tab with improved categorized UI
function populateQuickLinks() {
  const container = document.getElementById("quicklinks-container");
  container.innerHTML = "";
  
  // Loop through each category
  for (const [category, services] of Object.entries(CATEGORIZED_QUICK_LINKS)) {
    // Create category section
    const categorySection = document.createElement("div");
    categorySection.className = "quickaccess-category";
    
    // Create category header
    const categoryHeader = document.createElement("h3");
    categoryHeader.className = "category-title";
    categoryHeader.textContent = category;
    categorySection.appendChild(categoryHeader);
    
    // Create buttons container
    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "category-buttons";
    
    // Add service buttons
    services.forEach(service => {
      const btn = document.createElement("button");
      btn.className = "quicklink-button";
      btn.textContent = service;
      btn.title = `Open ${service} via Farside.link`;
      btn.onclick = () => window.open(`https://farside.link/${service}`, "_blank");
      buttonsContainer.appendChild(btn);
    });
    
    categorySection.appendChild(buttonsContainer);
    container.appendChild(categorySection);
  }
}

// Tab switch
document.getElementById("settings-tab").onclick = () => {
  document.getElementById("settings-view").style.display = "block";
  document.getElementById("quicklinks-view").style.display = "none";
  document.getElementById("settings-tab").classList.add("active");
  document.getElementById("quicklinks-tab").classList.remove("active");
};

document.getElementById("quicklinks-tab").onclick = () => {
  document.getElementById("settings-view").style.display = "none";
  document.getElementById("quicklinks-view").style.display = "block";
  document.getElementById("quicklinks-tab").classList.add("active");
  document.getElementById("settings-tab").classList.remove("active");
  populateQuickLinks();
};
