function tone(score, verdict) {
  const text = String(verdict || "").toLowerCase();
  if (text.includes("risk") || score >= 71) return "danger";
  if (text.includes("suspicious") || score >= 31) return "warning";
  return "safe";
}

function updateResult(result) {
  const score = Number(result?.score ?? result?.trustScore ?? result?.phishingRiskScore ?? 0);
  const verdict = result?.verdict ?? result?.category ?? result?.riskLevel ?? (score >= 71 ? "High Risk" : score >= 31 ? "Suspicious" : "Safe");
  const explanation = result?.explanation ?? result?.reason ?? result?.simpleOutput?.reason ?? "Analysis completed.";
  const toneName = tone(score, verdict);
  document.getElementById("score").textContent = `${score}`;
  const badge = document.getElementById("verdict");
  badge.textContent = String(verdict).toUpperCase();
  badge.className = `badge ${toneName}`;
  document.getElementById("fill").style.width = `${Math.max(0, Math.min(100, score))}%`;
  document.getElementById("fill").style.background = toneName === "danger" ? "#fb7185" : toneName === "warning" ? "#fbbf24" : "#34d399";
  document.getElementById("explanation").textContent = explanation;
}

function setError(message) {
  document.getElementById("error").textContent = message || "";
}

async function analyze(inputType, inputData) {
  setError("");
  if (!inputData?.trim()) {
    setError("Add content before analyzing.");
    return;
  }
  const button = document.getElementById("analyze");
  const previous = button.textContent;
  button.textContent = "Analyzing...";
  button.disabled = true;
  chrome.runtime.sendMessage({ type: "ANALYZE_INPUT", payload: { inputType, inputData } }, (response) => {
    button.textContent = previous;
    button.disabled = false;
    if (!response?.ok) {
      setError(response?.error || "Analysis failed.");
      return;
    }
    updateResult(response.data);
  });
}

document.getElementById("analyze")?.addEventListener("click", async () => {
  const input = document.getElementById("input").value;
  const inputType = /^https?:\/\//i.test(input) ? "link" : "text";
  await analyze(inputType, input);
});

document.getElementById("scanPage")?.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await analyze("link", tab?.url || "");
});

document.getElementById("openApp")?.addEventListener("click", () => {
  chrome.tabs.create({ url: "http://localhost:3000/analyze" });
});

chrome.storage.local.get(["latestAnalysis", "latestPhishingAnalysis", "latestAnalysisError"], ({ latestAnalysis, latestPhishingAnalysis, latestAnalysisError }) => {
  if (latestAnalysis || latestPhishingAnalysis) updateResult(latestAnalysis || latestPhishingAnalysis);
  if (latestAnalysisError) setError(latestAnalysisError);
});
