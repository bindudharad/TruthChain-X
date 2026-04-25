function setMeter(score, riskLevel) {
  const meter = document.getElementById("meter");
  if (!meter) return;

  const safeScore = Math.max(0, Math.min(100, Number(score || 0)));
  meter.style.setProperty("--value", `${(safeScore / 100) * 360}deg`);
  meter.style.setProperty("--meter-color", riskLevel === "dangerous" ? "#ef4444" : riskLevel === "suspicious" ? "#f59e0b" : "#10b981");
  meter.classList.toggle("pulse", riskLevel === "dangerous");
}

function buildReport(result) {
  return [
    `Risk Score: ${result.phishingRiskScore || 0}%`,
    `Risk Level: ${result.riskLevel || "unknown"}`,
    `Attack Type: ${String(result.attackType || "unknown").replace(/-/g, " ")}`,
    `URL: ${result.analyzedUrl || "N/A"}`,
    `Reasons: ${(result.reasons || []).join("; ") || "None"}`
  ].join("\n");
}

function updatePopup(result) {
  const statusBadge = document.getElementById("statusBadge");
  const score = document.getElementById("score");
  const attackType = document.getElementById("attackType");
  const summary = document.getElementById("summary");
  const reasons = document.getElementById("reasons");

  if (!result) {
    statusBadge.textContent = "No scan yet";
    statusBadge.className = "badge warning";
    setMeter(0, "suspicious");
    return;
  }

  statusBadge.textContent = String(result.riskLevel || "unknown").toUpperCase();
  statusBadge.className = `badge ${result.riskLevel === "dangerous" ? "danger" : result.riskLevel === "suspicious" ? "warning" : "safe"}`;
  score.textContent = `${result.phishingRiskScore || 0}%`;
  attackType.textContent = `Attack type: ${String(result.attackType || "unknown").replace(/-/g, " ")}`;
  summary.textContent =
    result.riskLevel === "dangerous"
      ? "This page should be treated as unsafe."
      : result.riskLevel === "suspicious"
        ? "Proceed carefully and verify the domain."
        : "No strong phishing indicators detected.";
  setMeter(result.phishingRiskScore || 0, result.riskLevel);

  reasons.innerHTML = "";
  (result.reasons || ["No phishing-specific reasons found."]).slice(0, 4).forEach((reason) => {
    const item = document.createElement("li");
    item.textContent = reason;
    reasons.appendChild(item);
  });
}

async function scanActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) return;

  chrome.tabs.sendMessage(tab.id, { type: "PING" }, async () => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  });
}

document.getElementById("scanNow")?.addEventListener("click", async () => {
  await scanActiveTab();
  window.setTimeout(() => {
    chrome.storage.local.get(["latestPhishingAnalysis"], ({ latestPhishingAnalysis }) => {
      updatePopup(latestPhishingAnalysis);
    });
  }, 900);
});

document.getElementById("copyReport")?.addEventListener("click", async () => {
  chrome.storage.local.get(["latestPhishingAnalysis"], async ({ latestPhishingAnalysis }) => {
    if (!latestPhishingAnalysis) return;
    try {
      await navigator.clipboard.writeText(buildReport(latestPhishingAnalysis));
      const button = document.getElementById("copyReport");
      if (button) {
        const previous = button.textContent;
        button.textContent = "Copied";
        window.setTimeout(() => {
          button.textContent = previous;
        }, 1400);
      }
    } catch {
      // Ignore clipboard errors in restricted contexts.
    }
  });
});

chrome.storage.local.get(["latestPhishingAnalysis"], ({ latestPhishingAnalysis }) => {
  updatePopup(latestPhishingAnalysis);
});

