const youtubeRegex = /https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/i;
const shortsRegex = /https?:\/\/(?:www\.)?youtube\.com\/shorts\/([\w-]{11})/i;
const twitterRegex = /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[\w-]+\/status\/\d+/i;
const urlRegex = /https?:\/\/[^\s]+/gi; // Broad regex for any URL
const currentPageUrl = window.location.href;

let isActive = false; // Track if scanning is active
let scanTimeout = null;

function isContextValid() {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && isActive;
}

function scanChat() {
  if (!isContextValid()) {
    console.log('Context invalid or scanning stopped, aborting.');
    return;
  }

  const chatContainer = document.getElementById('js-chat--height') || 
                       document.querySelector('#chat-history-list, .chat-history-list, .chat-container');

  if (!chatContainer) {
    console.log('Chat container not found yet, retrying in 1 second...');
    scanTimeout = setTimeout(scanChat, 1000);
    return;
  }

  console.log('Scanning chat:', chatContainer.id || chatContainer.className);

  const messages = chatContainer.querySelectorAll('div, span, p');
  let youtubeLinks = [];
  let shortsLinks = [];
  let twitterLinks = [];
  let otherLinks = [];

  messages.forEach(msg => {
    if (msg.dataset.processed) return;
    const text = msg.textContent.trim();
    if (!text) return;

    const allLinks = [...text.matchAll(urlRegex)]
      .map(m => m[0])
      .filter(link => link !== currentPageUrl);

    allLinks.forEach(link => {
      if (shortsRegex.test(link)) {
        console.log(`Assigned to Shorts: ${link}`);
        shortsLinks.push(link);
      } else if (youtubeRegex.test(link)) {
        console.log(`Assigned to YouTube: ${link}`);
        youtubeLinks.push(link);
      } else if (twitterRegex.test(link)) {
        console.log(`Assigned to Twitter/X: ${link}`);
        twitterLinks.push(link);
      } else {
        console.log(`Assigned to Other: ${link}`);
        otherLinks.push(link);
      }
    });

    msg.dataset.processed = true;
  });

  if (youtubeLinks.length || shortsLinks.length || twitterLinks.length || otherLinks.length) {
    console.log('Found links - YouTube:', youtubeLinks, 'Shorts:', shortsLinks, 'Twitter:', twitterLinks, 'Other:', otherLinks);
    storeLinks(youtubeLinks, shortsLinks, twitterLinks, otherLinks);
  } else {
    console.log('No new links found.');
  }

  scanTimeout = setTimeout(scanChat, 1000); // Continuous scan
}

function storeLinks(youtubeLinks, shortsLinks, twitterLinks, otherLinks) {
  if (!isContextValid()) {
    console.log('Context invalid, skipping storage.');
    return;
  }

  chrome.storage.local.get(
    { youtubeLinks: [], shortsLinks: [], twitterLinks: [], otherLinks: [] },
    data => {
      if (!isContextValid()) {
        console.log('Context invalidated during storage get, aborting.');
        return;
      }

      const newYoutube = [...new Set([...data.youtubeLinks, ...youtubeLinks])].slice(-250);
      const newShorts = [...new Set([...data.shortsLinks, ...shortsLinks])].slice(-250);
      const newTwitter = [...new Set([...data.twitterLinks, ...twitterLinks])].slice(-250);
      const newOther = [...new Set([...data.otherLinks, ...otherLinks])].slice(-250);

      chrome.storage.local.set(
        { youtubeLinks: newYoutube, shortsLinks: newShorts, twitterLinks: newTwitter, otherLinks: newOther },
        () => {
          if (!isContextValid()) {
            console.log('Context invalidated during storage set, aborting.');
            return;
          }
          if (chrome.runtime.lastError) {
            console.error('Storage set error:', chrome.runtime.lastError);
            return;
          }
          console.log('Links stored successfully.');
          // Removed chrome.runtime.sendMessage since the popup updates automatically
        }
      );
    }
  );
}

window.addEventListener('load', () => {
  console.log('Page loaded, starting scan.');
  isActive = true;
  scanChat();
});

window.addEventListener('unload', () => {
  console.log('Page unloading, stopping scan.');
  isActive = false;
  if (scanTimeout) {
    clearTimeout(scanTimeout);
    scanTimeout = null;
  }
});