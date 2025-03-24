function createLinkElement(url, clickedLinks) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = url;
  a.textContent = url;
  a.onclick = function(event) {
    event.preventDefault();
    chrome.storage.local.get({clickedLinks: []}, data => {
      const updatedClickedLinks = data.clickedLinks || [];
      if (!updatedClickedLinks.includes(url)) {
        updatedClickedLinks.push(url);
        chrome.storage.local.set({clickedLinks: updatedClickedLinks});
      }
    });
    chrome.tabs.create({ url: url }, function() {
      if (chrome.runtime.lastError) {
        console.error("Error creating tab:", chrome.runtime.lastError);
      }
    });
  };
  if (clickedLinks.includes(url)) {
    a.style.color = '#ff0000';
  }
  li.appendChild(a);
  return li;
}

function updateList() {
  chrome.storage.local.get({
    youtubeLinks: [],
    shortsLinks: [],
    twitterLinks: [],
    otherLinks: [],
    clickedLinks: []
  }, data => {
    const youtubeList = document.getElementById('youtubeList');
    const shortsList = document.getElementById('shortsList');
    const twitterList = document.getElementById('twitterList');
    const otherList = document.getElementById('otherList');
    
    youtubeList.innerHTML = '';
    shortsList.innerHTML = '';
    twitterList.innerHTML = '';
    otherList.innerHTML = '';
    
    const clickedLinks = data.clickedLinks || [];

    if (data.youtubeLinks?.length) {
      data.youtubeLinks.reverse().forEach(url => {
        youtubeList.appendChild(createLinkElement(url, clickedLinks));
      });
    } else {
      youtubeList.innerHTML = '<li>No YouTube links found.</li>';
    }

    if (data.shortsLinks?.length) {
      data.shortsLinks.reverse().forEach(url => {
        shortsList.appendChild(createLinkElement(url, clickedLinks));
      });
    } else {
      shortsList.innerHTML = '<li>No Shorts links found.</li>';
    }

    if (data.twitterLinks?.length) {
      data.twitterLinks.reverse().forEach(url => {
        twitterList.appendChild(createLinkElement(url, clickedLinks));
      });
    } else {
      twitterList.innerHTML = '<li>No Twitter links found.</li>';
    }

    if (data.otherLinks?.length) {
      data.otherLinks.reverse().forEach(url => {
        otherList.appendChild(createLinkElement(url, clickedLinks));
      });
    } else {
      otherList.innerHTML = '<li>No other links found.</li>';
    }
  });
}

setInterval(updateList, 1500);
updateList();

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "updateLinks") updateList();
});

document.getElementById('clearButton').addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all links?')) {
    chrome.storage.local.set({
      youtubeLinks: [],
      shortsLinks: [],
      twitterLinks: [],
      otherLinks: [],
      clickedLinks: []
    }, () => {
      updateList();
      chrome.runtime.sendMessage({ action: "clearLinks" });
    });
  }
});