// NeverMiss background service worker

function getNextReminderDelayInMinutes(isoDate) {
  if (!isoDate) return 60 * 24 * 364;

  const source = new Date(isoDate);
  const now = new Date();
  const reminder = new Date(now.getFullYear(), source.getMonth(), source.getDate() - 1, 9, 0, 0, 0);

  if (reminder <= now) {
    reminder.setFullYear(reminder.getFullYear() + 1);
  }

  return Math.max(1, Math.round((reminder.getTime() - now.getTime()) / 60000));
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "save_moment") {
    chrome.storage.local.get({ moments: [], syncQueue: [] }, ({ moments, syncQueue }) => {
      const record = { ...msg.payload, syncStatus: "pending" };
      moments.push(record);
      syncQueue.push(record);

      chrome.storage.local.set({ moments, syncQueue }, () => {
        chrome.notifications?.create?.({
          type: "basic",
          iconUrl: "icon.png",
          title: "NeverMiss",
          message: `Saved ${msg.payload.name}'s ${msg.payload.occasion}. We'll remind you next year.`,
        });
        chrome.alarms?.create?.(`moment:${msg.payload.name}:${msg.payload.occasion}`, {
          delayInMinutes: getNextReminderDelayInMinutes(msg.payload.date),
        });
        sendResponse?.({ ok: true });
      });
    });
    return true;
  }
});

chrome.alarms?.onAlarm.addListener((alarm) => {
  const [, name, occasion] = alarm.name.split(":");
  chrome.notifications?.create?.({
    type: "basic",
    iconUrl: "icon.png",
    title: `Tomorrow: ${name}'s ${occasion}`,
    message: "Open NeverMiss to draft a wish.",
  });
});

// Open side panel on action click (Chrome 114+)
chrome.action?.onClicked?.addListener?.((tab) => {
  if (chrome.sidePanel && tab.windowId) {
    chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
  }
});
