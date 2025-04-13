// popup.js
// Handle UI interactions for the extension popup

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

// Import shared constants
const DEFAULT_REDIRECT_MAP = {
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

document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  const toggleCheckbox = document.getElementById('popup-toggle');
  const optionsButton = document.getElementById('open-options');
  const redirectsTab = document.getElementById('redirects-tab');
  const quickAccessTab = document.getElementById('quickaccess-tab');
  const redirectsContent = document.getElementById('redirects-tab-content');
  const quickAccessContent = document.getElementById('quickaccess-tab-content');

  // Tab switching
  redirectsTab.addEventListener('click', () => {
    redirectsTab.classList.add('active');
    quickAccessTab.classList.remove('active');
    redirectsContent.style.display = 'block';
    quickAccessContent.style.display = 'none';
  });

  quickAccessTab.addEventListener('click', () => {
    quickAccessTab.classList.add('active');
    redirectsTab.classList.remove('active');
    quickAccessContent.style.display = 'block';
    redirectsContent.style.display = 'none';
    
    // Populate quick access links if not already done
    if (quickAccessContent.children.length === 0) {
      populateQuickAccessLinks();
    }
  });

  // Load settings and populate redirect toggles
  loadSettings();

  // Update global toggle when changed
  toggleCheckbox.addEventListener('change', () => {
    const enabled = toggleCheckbox.checked;
    
    chrome.storage.sync.set({ enabled }, () => {
      chrome.runtime.sendMessage({
        type: 'updateSettings',
        enabled
      });
    });
  });

  // Open the options page when button is clicked
  optionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Function to load settings and populate UI
  function loadSettings() {
    chrome.storage.sync.get(['enabled', 'customMap'], (result) => {
      // Set global toggle
      toggleCheckbox.checked = result.enabled !== false; // Default to true if not set
      
      // Get custom map or use default
      const customMap = result.customMap || {};
      
      // Populate redirect toggles using site display names
      redirectsContent.innerHTML = '';
      
      // Track processed groups to avoid duplicates
      const processedGroups = new Set();
      
      // Process domains by their group name
      for (const [domain, defaultRedirect] of Object.entries(DEFAULT_REDIRECT_MAP)) {
        const displayName = SITE_DISPLAY_NAMES[domain];
        
        // Skip if this group is already processed
        if (processedGroups.has(displayName)) continue;
        processedGroups.add(displayName);
        
        // Get all domains in this group
        const domains = DOMAIN_GROUPS[displayName];
        
        // Check if any domain in the group is enabled
        const groupEnabled = domains.some(d => customMap[d] !== "");
        
        const toggleRow = document.createElement('div');
        toggleRow.className = 'toggle-container';
        
        // Create readable site name instead of domain
        const siteLabel = document.createElement('span');
        siteLabel.textContent = displayName;
        
        // Create toggle
        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.checked = groupEnabled;
        toggle.dataset.group = displayName;
        toggle.dataset.domains = JSON.stringify(domains);
        
        // Add toggle event listener
        toggle.addEventListener('change', handleGroupToggleChange);
        
        // Add elements to row
        toggleRow.appendChild(siteLabel);
        toggleRow.appendChild(toggle);
        
        // Add row to content
        redirectsContent.appendChild(toggleRow);
      }
    });
  }

  // Handle group toggle changes
  function handleGroupToggleChange(event) {
    const groupName = event.target.dataset.group;
    const domains = JSON.parse(event.target.dataset.domains);
    const enabled = event.target.checked;
    
    // Get current custom map
    chrome.storage.sync.get(['customMap'], (result) => {
      const customMap = result.customMap || {};
      
      // Update all domains in this group
      domains.forEach(domain => {
        customMap[domain] = enabled ? DEFAULT_REDIRECT_MAP[domain] : "";
      });
      
      // Save to storage
      chrome.storage.sync.set({ customMap }, () => {
        // Notify background script
        chrome.runtime.sendMessage({
          type: 'updateSettings',
          updatedMap: customMap
        });
      });
    });
  }

  // Populate quick access links with improved categorized UI
  function populateQuickAccessLinks() {
    quickAccessContent.innerHTML = '';
    
    // Create categorized sections
    for (const [category, services] of Object.entries(CATEGORIZED_QUICK_LINKS)) {
      // Create category container
      const categorySection = document.createElement('div');
      categorySection.className = 'quickaccess-category';
      
      // Create category header
      const categoryHeader = document.createElement('h4');
      categoryHeader.className = 'category-title';
      categoryHeader.textContent = category;
      categorySection.appendChild(categoryHeader);
      
      // Create buttons container
      const buttonsContainer = document.createElement('div');
      buttonsContainer.className = 'category-buttons';
      
      // Add service buttons
      services.forEach(service => {
        const btn = document.createElement('button');
        btn.className = 'quicklink-button';
        btn.textContent = service;
        btn.title = `Open ${service} via Farside.link`;
        btn.onclick = () => window.open(`https://farside.link/${service}`, '_blank');
        buttonsContainer.appendChild(btn);
      });
      
      categorySection.appendChild(buttonsContainer);
      quickAccessContent.appendChild(categorySection);
    }
  }
});