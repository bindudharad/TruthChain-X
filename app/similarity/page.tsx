import { SimilarityExplorerPage } from "@/components/features/similarity/SimilarityExplorerPage";
import { listRecentSimilarityMatches } from "@/services/similarity/engine";

export default async function SimilarityPageRoute() {
  const matches = await listRecentSimilarityMatches(12);
  return <SimilarityExplorerPage initialMatches={matches} />;
}
