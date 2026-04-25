import { SimilarityPlatform, UnifiedReportDispatch } from "@/lib/types";

const platformLinks: Record<SimilarityPlatform, string> = {
  Facebook: "https://www.facebook.com/help/contact/209046679279097",
  X: "https://help.x.com/forms/safety-and-sensitive-content",
  TikTok: "https://www.tiktok.com/legal/report/feedback",
  Instagram: "https://help.instagram.com/contact/383679321740945",
  YouTube: "https://support.google.com/youtube/answer/2802027",
  Telegram: "https://telegram.org/support",
  TruthChain: "/reports"
};

export async function dispatchModerationReport({
  platform,
  mode
}: {
  platform: SimilarityPlatform;
  mode: "link" | "api" | "demo";
}): Promise<UnifiedReportDispatch> {
  if (mode === "link") {
    return {
      mode,
      status: "ready",
      message: `Open the official ${platform} reporting flow with the prepared report details.`,
      reportingUrl: platformLinks[platform]
    };
  }

  if (mode === "api") {
    if (platform === "TruthChain") {
      return {
        mode,
        status: "sent",
        message: "Internal trust-and-safety API accepted the moderation payload.",
        provider: "truthchain-internal"
      };
    }

    return {
      mode,
      status: "pending",
      message: `${platform} does not expose a supported moderation API in demo mode. Use link dispatch instead.`,
      reportingUrl: platformLinks[platform]
    };
  }

  return {
    mode,
    status: "sent",
    message: `Demo dispatch completed for ${platform}. Report lifecycle is being tracked.`,
    provider: "demo-dispatch"
  };
}
