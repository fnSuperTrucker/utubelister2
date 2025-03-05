const platforms = {
  rumble: {
    container: [
      '[data-testid="chat-panel"]',
      '.chat-container',
      '#chat-scroll',
      '.livestream-chat',
      '#chat-history-list' // Updated selector for Rumble chat
    ],
    messages: '.chat-history--row, .js-chat-history-item' // Updated selector for messages
  },
  // ... other platforms ...
};

const youtubeRegex = /https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})(?![^?]*\/shorts)/gi;
let currentPlatform = detectPlatform();
let scanIntervalId = null;
let observer;

function detectPlatform() {
  const host = window.location.hostname;
  if (host.includes('rumble')) return platforms.rumble;
  if (host.includes('odysee')) return platforms.odysee;
  if (host.includes('pilled')) return platforms.pilled;
  return null;
}

function scanChat() {
  try {
    console.log('Scanning chat for links...');
    if (!currentPlatform) {
      console.log('No platform detected');
      return;
    }

    let container = null;
    for (let sel of currentPlatform.container) {
      try {
        container = document.querySelector(sel);
        if (container) break;
      } catch (error) {
        console.warn('Error querying selector:', sel, error);
      }
    }

    if (!container) {
      console.log('No chat container detected; possibly on a page without chat.');
      return;
    }

    console.log('Chat container found:', container);
    try {
      const messages = container.querySelectorAll(currentPlatform.messages);
      if (messages.length === 0) {
        console.log('No messages found in the chat');
      } else {
        console.log(`Found ${messages.length} messages`);
      }
      
      messages.forEach(msg => {
        if (msg.dataset.processed) return;
        console.log('Processing message:', msg.textContent);
        const links = [...msg.textContent.matchAll(youtubeRegex)].map(m => m[0]);
        
        if (links.length) {
          console.log('Found links:', links);
          if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get({links: []}, data => {
              if (Array.isArray(data.links)) {
                const newLinks = [...new Set([...data.links, ...links])];
                chrome.storage.local.set({links: newLinks.slice(-100)}, function() {
                  if (chrome.runtime.lastError) {
                    console.error("Error setting storage: ", chrome.runtime.lastError);
                  } else {
                    console.log("Links updated in storage");
                    if (chrome.runtime && chrome.runtime.sendMessage) {
                      chrome.runtime.sendMessage({action: "updateLinks"});
                    } else {
                      console.warn("chrome.runtime.sendMessage not available");
                    }
                  }
                });
              } else {
                console.error("Stored links are not an array");
              }
            });
          } else {
            console.warn('Chrome storage API not available, skipping link storage');
          }
        }
        msg.dataset.processed = true;
      });
    } catch (messagesError) {
      console.error('Error querying messages:', messagesError);
    }
  } catch (error) {
    console.error('An error occurred while scanning chat:', error);
  }
}

function observeMutations() {
  if (!observer && document.body) {
    observer = new MutationObserver(() => {
      console.log('DOM change detected, initiating scan');
      scanChat(); // Scan whenever there's a change in the DOM
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

function startScanning() {
  if (scanIntervalId) clearInterval(scanIntervalId);
  
  setTimeout(() => {
    scanIntervalId = setInterval(scanChat, 500); // More frequent scans after initial delay
    scanChat(); // Immediate scan
    observeMutations(); // Start observing mutations
  }, 2000); // Initial delay
}

document.addEventListener('DOMContentLoaded', startScanning);
window.addEventListener('load', startScanning);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startScanning);
} else {
  startScanning();
}