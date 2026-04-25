async function resolveApiBases(fallback) {
  const stored = await chrome.storage.local.get(["apiBase"]);
  return [...new Set([stored.apiBase, fallback, "http://localhost:3000", "http://localhost:3001"].filter(Boolean))];
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "ANALYZE_PAGE") return false;

  resolveApiBases(message.apiBase)
    .then(async (apiBases) => {
      let lastError = null;

      for (const apiBase of apiBases) {
        try {
          const endpoint = `${apiBase}/api/analyze`;
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contentType: "text",
              url: message.payload.url,
              content: message.payload.content,
              imageUrl: message.payload.imageUrl,
              videoUrl: message.payload.videoUrl,
              fileName: "browser-capture.txt",
              demoMode: true,
              creatorId: "extension_user",
              creatorName: "Browser Extension"
            })
          });

          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(data.error || "Phishing scan failed.");
          }

          await chrome.storage.local.set({ latestPhishingAnalysis: data, apiBase });
          sendResponse({ ok: true, data });
          return;
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError || new Error("Phishing scan failed.");
    })
    .catch((error) => {
      sendResponse({ ok: false, error: error.message || "Phishing scan failed." });
    });

  return true;
});
