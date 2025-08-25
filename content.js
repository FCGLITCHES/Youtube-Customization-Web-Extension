console.log('YouTube Feed Customizer content script loaded.');

// Utility: Check if current page is Subscriptions feed
function isSubscriptionsFeed() {
  return window.location.pathname === '/feed/subscriptions';
}

// Utility: Hide watched videos
function hideWatchedVideos() {
  // YouTube marks watched videos with a progress bar or overlay
  const watchedSelectors = [
    'ytd-thumbnail-overlay-resume-playback-renderer',
    'ytd-thumbnail-overlay-playback-status-renderer[overlay-style="UPLOADED"]'
  ];
  const videoItems = document.querySelectorAll('ytd-rich-item-renderer');
  videoItems.forEach(item => {
    let watched = false;
    watchedSelectors.forEach(sel => {
      if (item.querySelector(sel)) watched = true;
    });
    if (watched) {
      item.style.display = 'none';
    } else {
      item.style.display = '';
    }
  });
}

// Function to apply layout and filtering settings
function applyLayoutSettings(settings = {}) {
  console.log('Applying layout settings:', settings);

  // --- Regular Video Grid ---
  const regularColumns = settings.regularColumns;
  const gridRenderers = document.querySelectorAll('ytd-rich-grid-renderer');
  gridRenderers.forEach(gridRenderer => {
    const contentsElement = gridRenderer.querySelector('#contents');
    if (contentsElement && regularColumns && regularColumns > 0) {
      contentsElement.style.setProperty('--ytd-rich-grid-items-per-row', regularColumns);
    } else if (contentsElement) {
      contentsElement.style.removeProperty('--ytd-rich-grid-items-per-row');
    }
  });

  // --- Shorts Layout ---
  const hideShorts = settings.hideShorts ?? false;
  const hideShortsSubs = settings.hideShortsSubs ?? false;
  const shortsSize = settings.shortsSize ?? 160;
  const shortsShelves = document.querySelectorAll('ytd-rich-shelf-renderer');
  const onSubs = isSubscriptionsFeed();

  shortsShelves.forEach(shelf => {
    shelf.style.removeProperty('--ytd-rich-shelf-items-count');
    let shouldHide = false;
    if (hideShorts) {
      shouldHide = true;
    } else if (hideShortsSubs && onSubs) {
      shouldHide = true;
    }
    if (shouldHide) {
      shelf.style.setProperty('display', 'none', 'important');
      shelf.style.removeProperty('overflow-x');
    } else {
      shelf.style.setProperty('display', 'flex', 'important');
      shelf.style.setProperty('overflow-x', 'auto');
      const shortsItems = shelf.querySelectorAll('ytd-rich-item-renderer[is-slim-media]');
      shortsItems.forEach(item => {
        item.style.setProperty('width', `${shortsSize}px`, 'important');
        item.style.setProperty('flex-shrink', '0');
      });
    }
  });

  // --- Hide Watched Videos ---
  if (settings.hideWatched) {
    hideWatchedVideos();
  } else {
    // Reset display for all items
    const videoItems = document.querySelectorAll('ytd-rich-item-renderer');
    videoItems.forEach(item => {
      item.style.display = '';
    });
  }

  // --- Cleaner UI Features ---
  // Sidebar
  const sidebar = document.getElementById('guide');
  if (sidebar) sidebar.style.display = settings.hideSidebar ? 'none' : '';

  // Comments
  const comments = document.getElementById('comments');
  if (comments) comments.style.display = settings.hideComments ? 'none' : '';

  // Suggestions (Up Next)
  const secondary = document.getElementById('secondary');
  if (secondary) secondary.style.display = settings.hideSuggestions ? 'none' : '';

  // Endscreen overlays
  const endscreens = document.querySelectorAll(
    '.ytp-ce-element, .ytp-ce-covering-overlay, .ytp-ce-video, .ytp-ce-channel'
  );
  endscreens.forEach(el => {
    el.style.display = settings.hideEndscreen ? 'none' : '';
  });

  // Playlist bar
  const playlistBar = document.querySelector('ytd-miniplayer-bar-renderer');
  if (playlistBar) playlistBar.style.display = settings.hidePlaylistBar ? 'none' : '';

  // Description
  const description = document.querySelector('ytd-expander.ytd-video-secondary-info-renderer');
  if (description) description.style.display = settings.hideDescription ? 'none' : '';

  // Live Chat
  const liveChat = document.getElementById('chat');
  if (liveChat) liveChat.style.display = settings.hideLiveChat ? 'none' : '';

  // Minimal Header (fixed version)
  const masthead = document.getElementById('masthead-container');
  if (settings.minimalHeader) {
    if (masthead) {
      masthead.style.height = '48px';
      masthead.style.overflow = 'hidden';
      masthead.style.boxShadow = 'none';
      masthead.style.background = '#fff';
      masthead.style.display = 'flex';
      masthead.style.alignItems = 'center';
      masthead.style.justifyContent = 'space-between';
      masthead.style.padding = '0 12px';
    }
    const logo = document.querySelector('#logo');
    if (logo) {
      logo.style.transform = 'scale(0.8)';
      logo.style.transformOrigin = 'left center';
    }
    const buttons = document.querySelector('#end');
    if (buttons) {
      buttons.style.transform = 'scale(0.85)';
      buttons.style.transformOrigin = 'right center';
    }
    const search = document.querySelector('ytd-searchbox');
    if (search) {
      search.style.maxWidth = '400px';
      search.style.transform = 'scale(0.9)';
      search.style.transformOrigin = 'center';
    }
  } else {
    if (masthead) {
      masthead.style.height = '';
      masthead.style.overflow = '';
      masthead.style.boxShadow = '';
      masthead.style.background = '';
      masthead.style.display = '';
      masthead.style.alignItems = '';
      masthead.style.justifyContent = '';
      masthead.style.padding = '';
    }
    const logo = document.querySelector('#logo');
    if (logo) logo.style.transform = '';
    const buttons = document.querySelector('#end');
    if (buttons) buttons.style.transform = '';
    const search = document.querySelector('ytd-searchbox');
    if (search) {
      search.style.maxWidth = '';
      search.style.transform = '';
    }
  }

  // --- Remove Section Headers ---
  const sectionHeaders = document.querySelectorAll(
    'ytd-rich-grid-renderer > #contents > ytd-rich-section-renderer:not(:has(ytd-rich-shelf-renderer))'
  );
  sectionHeaders.forEach(header => header.remove());
}

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script:', request);
  if ((request.type === 'optionChanged' || request.type === 'updateLayout') && request.value !== undefined && request.setting) {
    // Define all settings keys and their defaults
    const allSettingsKeys = {
      hideShorts: false,
      hideShortsSubs: false,
      hideWatched: false,
      shortsSize: 160,
      regularColumns: 4,
      hideSidebar: false,
      hideComments: false,
      hideSuggestions: false,
      hideEndscreen: false,
      hidePlaylistBar: false,
      hideDescription: false,
      hideLiveChat: false,
      minimalHeader: false
    };
    chrome.storage.sync.get(allSettingsKeys, (currentSettings) => {
      currentSettings[request.setting] = request.value;
      applyLayoutSettings(currentSettings);
    });
  } else if (request.type === 'optionsReset' && request.settings) {
    applyLayoutSettings(request.settings);
  }
  return true;
});

// Load initial settings when the script is injected
const initialSettingsKeys = {
  hideShorts: false,
  hideShortsSubs: false,
  hideWatched: false,
  shortsSize: 160,
  regularColumns: 4,
  hideSidebar: false,
  hideComments: false,
  hideSuggestions: false,
  hideEndscreen: false,
  hidePlaylistBar: false,
  hideDescription: false,
  hideLiveChat: false,
  minimalHeader: false
};
chrome.storage.sync.get(initialSettingsKeys, (settings) => {
  console.log('Initial settings loaded:', settings);
  applyLayoutSettings(settings);
});

// Observe DOM changes to re-apply settings if needed
const observer = new MutationObserver((mutations) => {
  let settingsApplied = false;
  mutations.forEach(mutation => {
    let relevantChange = false;
    if (mutation.addedNodes.length) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && (node.matches('ytd-rich-grid-renderer, ytd-rich-shelf-renderer, ytd-rich-section-renderer'))) {
          relevantChange = true;
        }
      });
    }
    if (relevantChange && !settingsApplied) {
      settingsApplied = true;
      console.log('Relevant DOM change detected, re-applying settings.');
      chrome.storage.sync.get(initialSettingsKeys, (settings) => {
        applyLayoutSettings(settings);
        setTimeout(() => { settingsApplied = false; }, 50);
      });
    }
  });
});

// Start observing the body for changes
observer.observe(document.body, { childList: true, subtree: true });

console.log('YouTube Feed Customizer content script initialized.');