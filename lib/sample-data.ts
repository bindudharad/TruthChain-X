import { TrendingAlert } from "@/lib/types";

export const trendingAlerts: TrendingAlert[] = [
  {
    id: "alert-1",
    label: "Election deepfake speech clip",
    riskLevel: "critical",
    region: "North America",
    volume: 94,
    category: "Political Video"
  },
  {
    id: "alert-2",
    label: "Celebrity crypto giveaway image",
    riskLevel: "high",
    region: "Europe",
    volume: 76,
    category: "Synthetic Image"
  },
  {
    id: "alert-3",
    label: "Fake health advisory chain message",
    riskLevel: "high",
    region: "South Asia",
    volume: 81,
    category: "Text Claim"
  },
  {
    id: "alert-4",
    label: "Flood rescue fundraiser impersonation",
    riskLevel: "moderate",
    region: "Africa",
    volume: 58,
    category: "Scam Campaign"
  }
];

export const demoSamples = {
  text: "Breaking: Scientists confirm drinking silver solution eliminates all viruses in 24 hours. Share before this gets removed.",
  imagePrompt: "Celebrity selfie with mismatched lighting and blurred ear edges",
  videoPrompt: "Campaign speech clip with lip-sync drift and inconsistent blinking"
};
