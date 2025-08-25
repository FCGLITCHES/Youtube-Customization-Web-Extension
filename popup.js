document.addEventListener('DOMContentLoaded', () => {
  // --- Default values ---
  const defaults = {
    hideShorts: false,
    hideShortsSubs: false,
    hideWatched: false,
    regularColumns: 4,
    shortsSize: 160,
    hideSidebar: false,
    hideComments: false,
    hideSuggestions: false,
    hideEndscreen: false,
    hidePlaylistBar: false,
    hideDescription: false,
    hideLiveChat: false,
    minimalHeader: false,
    compactMode: false,
    showTooltips: false
  };

  // --- UI Elements ---
  const elements = {
    hideShorts: document.getElementById('hide-shorts'),
    hideShortsSubs: document.getElementById('hide-shorts-subs'),
    hideWatched: document.getElementById('hide-watched'),
    regularColumns: document.getElementById('regular-columns'),
    regularColumnsValue: document.getElementById('regular-columns-value'),
    shortsSize: document.getElementById('shortsColumnsSlider'),
    shortsSizeValue: document.getElementById('shortsSizeValue'),
    hideSidebar: document.getElementById('hide-sidebar'),
    hideComments: document.getElementById('hide-comments'),
    hideSuggestions: document.getElementById('hide-suggestions'),
    hideEndscreen: document.getElementById('hide-endscreen'),
    hidePlaylistBar: document.getElementById('hide-playlist-bar'),
    hideDescription: document.getElementById('hide-description'),
    hideLiveChat: document.getElementById('hide-live-chat'),
    minimalHeader: document.getElementById('minimal-header'),
    compactMode: document.getElementById('compact-mode'),
    showTooltips: document.getElementById('show-tooltips'),
    resetBtn: document.getElementById('reset-options'),
    resetLayoutBtn: document.getElementById('reset-layout'),
    exportSettingsBtn: document.getElementById('export-settings'),
    importSettingsBtn: document.getElementById('import-settings'),
    aboutHelpBtn: document.getElementById('about-help'),
    summaryActive: document.getElementById('summary-active'),
    openSettingsBtn: document.getElementById('open-settings'),
    closeSettingsBtn: document.getElementById('close-settings'),
    settingsPanel: document.getElementById('settings-panel'),
    dashboard: document.querySelector('.dashboard'),
    statusIcon: document.getElementById('status-icon'),
    statusText: document.getElementById('status-text')
  };

  // --- Check if we're on YouTube ---
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url && tabs[0].url.includes('youtube.com')) {
      elements.statusIcon.textContent = 'check_circle';
      elements.statusIcon.classList.remove('warning');
      elements.statusText.textContent = 'Extension Active';
      elements.statusText.classList.remove('warning');
    } else {
      elements.statusIcon.textContent = 'info';
      elements.statusIcon.classList.add('warning');
      elements.statusText.textContent = 'Open YouTube to see changes';
      elements.statusText.classList.add('warning');
    }
  });

  // --- Utility: Save + Notify content script ---
  function saveAndNotify(key, value) {
    chrome.storage.sync.set({ [key]: value });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('youtube.com')) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'optionChanged',
          setting: key,
          value: value
        }).catch(error => {
          console.log('Could not notify content script - this is normal if not on YouTube');
        });
      }
    });
    chrome.storage.sync.get(defaults, updateSummary);
  }

  // --- Load ALL settings into UI ---
  chrome.storage.sync.get(defaults, (settings) => {
    Object.keys(defaults).forEach((key) => {
      if (elements[key]) {
        if (elements[key].type === 'checkbox') {
          elements[key].checked = settings[key];
        } else if (elements[key].type === 'range') {
          elements[key].value = settings[key];
          if (key === 'regularColumns') {
            elements.regularColumnsValue.textContent = settings[key];
          }
          if (key === 'shortsSize') {
            elements.shortsSizeValue.textContent = `${settings[key]}px`;
          }
        }
      }
    });

    // Apply compact mode
    if (settings.compactMode) document.body.classList.add('compact');
    // Apply tooltips
    setTooltips(settings.showTooltips);

    updateSummary(settings);
  });

  // --- Event Listeners for ALL checkboxes ---
  [
    'hideShorts',
    'hideShortsSubs',
    'hideWatched',
    'hideSidebar',
    'hideComments',
    'hideSuggestions',
    'hideEndscreen',
    'hidePlaylistBar',
    'hideDescription',
    'hideLiveChat',
    'minimalHeader'
  ].forEach((key) => {
    if (elements[key]) {
      elements[key].addEventListener('change', (e) =>
        saveAndNotify(key, e.target.checked)
      );
    }
  });

  // --- Sliders ---
  elements.regularColumns.addEventListener('input', (e) => {
    elements.regularColumnsValue.textContent = e.target.value;
    saveAndNotify('regularColumns', parseInt(e.target.value, 10));
  });
  elements.shortsSize.addEventListener('input', (e) => {
    elements.shortsSizeValue.textContent = `${e.target.value}px`;
    saveAndNotify('shortsSize', parseInt(e.target.value, 10));
  });

  // --- Compact Mode ---
  elements.compactMode.addEventListener('change', (e) => {
    if (e.target.checked) {
      document.body.classList.add('compact');
    } else {
      document.body.classList.remove('compact');
    }
    saveAndNotify('compactMode', e.target.checked);
  });

  // --- Tooltips ---
  function setTooltips(enabled) {
    const controls = [
      elements.hideShorts,
      elements.hideShortsSubs,
      elements.hideWatched,
      elements.regularColumns,
      elements.shortsSize,
      elements.resetBtn
    ];
    controls.forEach((el) => {
      if (!el) return;
      if (enabled) {
        if (el === elements.hideShorts)
          el.title = 'Hide all YouTube Shorts everywhere';
        if (el === elements.hideShortsSubs)
          el.title = 'Hide Shorts only in Subscriptions feed';
        if (el === elements.hideWatched)
          el.title = 'Hide videos you have already watched';
        if (el === elements.regularColumns)
          el.title = 'Adjust number of columns for regular videos';
        if (el === elements.shortsSize)
          el.title = 'Adjust Shorts thumbnail size';
        if (el === elements.resetBtn)
          el.title = 'Reset all options to default values';
      } else {
        el.removeAttribute('title');
      }
    });
  }
  elements.showTooltips.addEventListener('change', (e) => {
    setTooltips(e.target.checked);
    saveAndNotify('showTooltips', e.target.checked);
  });

  // --- Reset All ---
  elements.resetBtn.addEventListener('click', () => {
    chrome.storage.sync.set(defaults, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('youtube.com')) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'optionsReset',
            settings: defaults
          }).catch(error => {
            console.log('Could not notify content script - this is normal if not on YouTube');
          });
        }
      });
      location.reload();
    });
  });

  // --- Reset Layout Only ---
  elements.resetLayoutBtn.addEventListener('click', () => {
    const layoutDefaults = {
      regularColumns: defaults.regularColumns,
      shortsSize: defaults.shortsSize
    };
    chrome.storage.sync.set(layoutDefaults, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('youtube.com')) {
          Object.keys(layoutDefaults).forEach((key) => {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'optionChanged',
              setting: key,
              value: layoutDefaults[key]
            }).catch(error => {
              console.log('Could not notify content script - this is normal if not on YouTube');
            });
          });
        }
      });
      location.reload();
    });
  });

  // --- Export Settings ---
  elements.exportSettingsBtn.addEventListener('click', () => {
    chrome.storage.sync.get(null, (all) => {
      const blob = new Blob([JSON.stringify(all, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'youtube-feed-customizer-settings.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    });
  });

  // --- Import Settings ---
  elements.importSettingsBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          chrome.storage.sync.set(data, () => {
            location.reload();
          });
        } catch (err) {
          alert('Invalid settings file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });

  // --- About/Help ---
  elements.aboutHelpBtn.addEventListener('click', () => {
    alert(
      'YouTube Feed Customizer\n\nModernizes and customizes your YouTube feed.\n\nFeatures:\n- Hide Shorts\n- Hide Watched\n- Adjust columns and Shorts size\n- Cleaner UI toggles\n- Import/Export settings\n\nFor support, visit the extension page.'
    );
  });

  // --- Settings Panel Toggle ---
  elements.openSettingsBtn.addEventListener('click', () => {
    elements.settingsPanel.classList.add('active');
    elements.dashboard.style.display = 'none';
  });
  elements.closeSettingsBtn.addEventListener('click', () => {
    elements.settingsPanel.classList.remove('active');
    elements.dashboard.style.display = '';
  });

  // --- Summary ---
  function updateSummary(settings) {
    const enabled = [];
    if (settings.hideShorts) enabled.push('Shorts hidden everywhere');
    if (settings.hideShortsSubs) enabled.push('Shorts hidden in Subscriptions');
    if (settings.hideWatched) enabled.push('Watched videos hidden');
    if (settings.hideSidebar) enabled.push('Sidebar hidden');
    if (settings.hideComments) enabled.push('Comments hidden');
    if (settings.hideSuggestions) enabled.push('Suggestions hidden');
    if (settings.hideEndscreen) enabled.push('Endscreen hidden');
    if (settings.hidePlaylistBar) enabled.push('Playlist bar hidden');
    if (settings.hideDescription) enabled.push('Description hidden');
    if (settings.hideLiveChat) enabled.push('Live chat hidden');
    if (settings.minimalHeader) enabled.push('Minimal header');
    enabled.push(`${settings.regularColumns} columns`);
    enabled.push(`${settings.shortsSize}px shorts`);

    elements.summaryActive.textContent =
      enabled.length > 0 ? enabled.join(' • ') : 'No features enabled';
  }
});