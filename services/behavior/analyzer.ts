import { UserTrustPassport } from "@/lib/types";

export function analyzeBehavior(user: Pick<UserTrustPassport, "trustScore" | "reportsCount" | "contentHistory">) {
  const flags: string[] = [];
  if (user.contentHistory.length >= 8) flags.push("high-upload-velocity");
  if (user.trustScore < 35) flags.push("repeated-fake-sharing-pattern");
  if (user.reportsCount > 10) flags.push("high-reporting-volume");

  return {
    suspicious: flags.length > 0,
    flags,
    scorePenalty: flags.includes("repeated-fake-sharing-pattern") ? 8 : flags.includes("high-upload-velocity") ? 4 : 0,
    copilotMessage:
      flags.length > 0
        ? "User showing suspicious behavior and should be monitored by Copilot."
        : "User behavior is currently within expected limits."
  };
}
