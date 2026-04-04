async function saveCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab || !tab.url) return;

  await fetch('http://127.0.0.1:4312/bookmarks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: tab.url, title: tab.title || '' })
  });
}

chrome.commands.onCommand.addListener((command) => {
  if (command === 'save-bookmark') {
    saveCurrentTab().catch(console.error);
  }
});

chrome.action.onClicked.addListener(() => {
  saveCurrentTab().catch(console.error);
});
