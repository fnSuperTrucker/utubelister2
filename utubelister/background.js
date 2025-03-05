chrome.runtime.onInstalled.addListener(() => {
  // Show the page action on Rumble, Odysee, and Pilled
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostContains: 'rumble.com' },
          }),
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostContains: 'odysee.com' },
          }),
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostContains: 'pilled.net' },
          })
        ],
        actions: [ new chrome.declarativeContent.ShowAction() ]
      }
    ]);
  });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("links.html"),
    active: true
  });
});

// Existing message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateLinks") {
    // Here you might want to update the badge or icon, if desired
  }
});