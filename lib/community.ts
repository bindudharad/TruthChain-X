import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { CommunityValidation } from "@/lib/types";

const dataDir = join(process.cwd(), "data");
const votesFile = join(dataDir, "community-votes.json");

function ensureVotesFile() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (!existsSync(votesFile)) writeFileSync(votesFile, "{}", "utf8");
}

function readVotes() {
  ensureVotesFile();
  return JSON.parse(readFileSync(votesFile, "utf8")) as Record<string, CommunityValidation>;
}

function writeVotes(votes: Record<string, CommunityValidation>) {
  ensureVotesFile();
  writeFileSync(votesFile, JSON.stringify(votes, null, 2), "utf8");
}

function labelForVotes(upvotes: number, downvotes: number) {
  if (upvotes === downvotes) return "Community split";
  return upvotes > downvotes ? "Community leans authentic" : "Community flags suspicious";
}

export function getCommunityValidation(hash: string): CommunityValidation {
  const votes = readVotes();
  return (
    votes[hash] || {
      upvotes: 0,
      downvotes: 0,
      consensusLabel: "No community signal yet"
    }
  );
}

export function voteOnContent(hash: string, direction: "up" | "down") {
  const votes = readVotes();
  const current = getCommunityValidation(hash);
  const next = {
    upvotes: current.upvotes + (direction === "up" ? 1 : 0),
    downvotes: current.downvotes + (direction === "down" ? 1 : 0),
    consensusLabel: labelForVotes(
      current.upvotes + (direction === "up" ? 1 : 0),
      current.downvotes + (direction === "down" ? 1 : 0)
    )
  };
  votes[hash] = next;
  writeVotes(votes);
  return next;
}
