(async () => {
  const ignoredUntil = Number(window.sessionStorage.getItem("truthchain-ignore-until") || 0);
  if (ignoredUntil > Date.now()) return;

  const visibleText = Array.from(document.querySelectorAll("body"))
    .map((node) => node.innerText || "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2500);

  const imageUrls = Array.from(document.querySelectorAll("img"))
    .map((node) => node.currentSrc || node.src || "")
    .filter(Boolean)
    .slice(0, 3);

  const videoUrl =
    Array.from(document.querySelectorAll("video"))
      .map((node) => node.currentSrc || node.src || node.querySelector("source")?.src || "")
      .filter(Boolean)
      .slice(0, 1)[0] || undefined;

  chrome.runtime.sendMessage(
    {
      type: "ANALYZE_PAGE",
      payload: {
        url: window.location.href,
        content: visibleText,
        imageUrl: imageUrls[0],
        videoUrl
      }
    },
    (response) => {
      if (!response?.ok || !response.data) return;

      const result = response.data;
      if (result.riskLevel !== "dangerous") return;
      if (document.getElementById("truthchain-phishing-warning")) return;

      const banner = document.createElement("div");
      banner.id = "truthchain-phishing-warning";
      banner.innerHTML = `
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:42px;height:42px;border-radius:999px;background:rgba(255,255,255,0.14);display:flex;align-items:center;justify-content:center;font-size:18px;">!</div>
            <div>
              <div style="font-size:15px;font-weight:800;line-height:1.2;">This website may be a phishing attempt</div>
              <div style="font-size:12px;font-weight:500;opacity:0.88;margin-top:4px;">Do not enter your credentials or payment details until the site is verified.</div>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            <button id="truthchain-go-back" style="border:none;border-radius:10px;padding:10px 14px;background:#fff;color:#7f1d1d;font-weight:700;cursor:pointer;">Go Back</button>
            <button id="truthchain-ignore" style="border:1px solid rgba(255,255,255,0.22);border-radius:10px;padding:10px 14px;background:rgba(255,255,255,0.1);color:white;font-weight:700;cursor:pointer;">Ignore</button>
          </div>
        </div>
      `;
      banner.style.position = "fixed";
      banner.style.top = "0";
      banner.style.left = "0";
      banner.style.right = "0";
      banner.style.zIndex = "2147483647";
      banner.style.padding = "14px 18px";
      banner.style.background = "linear-gradient(90deg, #ef4444, #f97316)";
      banner.style.color = "white";
      banner.style.fontFamily = "Inter, Arial, sans-serif";
      banner.style.boxShadow = "0 10px 30px rgba(239,68,68,0.35)";
      banner.style.backdropFilter = "blur(10px)";

      const style = document.createElement("style");
      style.id = "truthchain-phishing-warning-style";
      style.textContent = `
        @keyframes truthchainSlideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes truthchainPulse {
          0%, 100% { box-shadow: 0 10px 30px rgba(239,68,68,0.35); }
          50% { box-shadow: 0 14px 36px rgba(239,68,68,0.48); }
        }
        #truthchain-phishing-warning {
          animation: truthchainSlideDown 260ms ease-out, truthchainPulse 1.8s ease-in-out infinite;
        }
      `;

      if (!document.getElementById(style.id)) {
        document.head.appendChild(style);
      }

      document.body.appendChild(banner);

      document.getElementById("truthchain-go-back")?.addEventListener("click", () => {
        window.history.back();
      });

      document.getElementById("truthchain-ignore")?.addEventListener("click", () => {
        window.sessionStorage.setItem("truthchain-ignore-until", String(Date.now() + 15 * 60 * 1000));
        banner.remove();
      });
    }
  );
})();
