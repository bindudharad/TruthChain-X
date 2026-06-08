const DEFAULT_API_BASE = "http://localhost:3000";

async function getApiBase() {
  const stored = await chrome.storage.local.get(["apiBase"]);
  return stored.apiBase || DEFAULT_API_BASE;
}

function normalizeResult(data) {
  const score = data.score ?? data.simpleOutput?.score ?? data.trustScore ?? data.phishingRiskScore ?? 0;
  const verdict = data.category ?? data.simpleOutput?.category ?? data.riskLevel ?? (score >= 71 ? "Risk" : score >= 31 ? "Suspicious" : "Safe");
  return {
    ...data,
    score,
    verdict,
    explanation: data.reason ?? data.simpleOutput?.reason ?? data.explanation ?? "Analysis completed."
  };
}

async function analyzePayload(payload) {
  const apiBase = await getApiBase();
  const response = await fetch(`${apiBase}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contentType: payload.inputType === "image" ? "image" : "text",
      content: payload.inputData,
      url: payload.inputType === "link" ? payload.inputData : undefined,
      imageUrl: payload.inputType === "image" ? payload.inputData : undefined,
      fileName: `extension-${payload.inputType}.txt`,
      creatorId: "extension_user",
      creatorName: "Browser Extension",
      inputType: payload.inputType,
      inputData: payload.inputData
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Analysis failed.");
  const result = normalizeResult(data);
  await chrome.storage.local.set({ latestAnalysis: result, latestPhishingAnalysis: result, apiBase });
  return result;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "truthchain-link", title: "Analyze Link with TruthChain-X", contexts: ["link"] });
    chrome.contextMenus.create({ id: "truthchain-image", title: "Analyze Image with TruthChain-X", contexts: ["image"] });
    chrome.contextMenus.create({ id: "truthchain-selection", title: "Analyze Selected Text with TruthChain-X", contexts: ["selection"] });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    const inputType = info.menuItemId === "truthchain-image" ? "image" : info.menuItemId === "truthchain-link" ? "link" : "text";
    const inputData = info.srcUrl || info.linkUrl || info.selectionText || "";
    if (!inputData.trim()) throw new Error("No content selected.");
    const result = await analyzePayload({ inputType, inputData });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: "TRUTHCHAIN_RESULT", result }).catch(() => undefined);
    }
  } catch (error) {
    await chrome.storage.local.set({ latestAnalysisError: error.message || "Analysis failed." });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "ANALYZE_INPUT" && message?.type !== "ANALYZE_PAGE") return false;
  const payload =
    message.type === "ANALYZE_PAGE"
      ? { inputType: "link", inputData: `${message.payload?.url || ""}\n\n${message.payload?.content || ""}`.trim() }
      : message.payload;
  analyzePayload(payload)
    .then((result) => sendResponse({ ok: true, data: result }))
    .catch((error) => sendResponse({ ok: false, error: error.message || "Analysis failed." }));
  return true;
});
