"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Flame,
  Globe,
  Image as ImageIcon,
  PlayCircle,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Star
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";
import { api } from "@/services/api";
import { UserTrustPassport } from "@/lib/types";

type HistoryItem = {
  id: string;
  analysisId: string;
  inputValue: string;
  inputType: string;
  score: number;
  verdict: string;
  confidence: number;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
};

type HistoryDetail = {
  id: string;
  analysisId: string;
  inputValue: string;
  inputType: string;
  score: number;
  verdict: string;
  confidence: number;
  isBookmarked: boolean;
  explanation: string[];
  safeSignals: string[];
  riskSignals: string[];
  reports: Array<{
    id: string;
    title: string;
    source: string;
    url: string;
    image: string | null;
    description: string | null;
  }>;
  similarity: Array<{
    id: string;
    title: string;
    source: string | null;
    url: string | null;
    image: string | null;
    matchPercent: number;
  }>;
  createdAt: string;
  updatedAt: string;
};

type TrendingItem = {
  inputValue: string;
  count: number;
};

type GroupedHistory = {
  label: string;
  items: HistoryItem[];
};

function verdictTone(verdict: string) {
  if (verdict === "SAFE") return "success" as const;
  if (verdict === "SUSPICIOUS") return "warning" as const;
  return "danger" as const;
}

function typeIcon(type: string) {
  if (type === "url") return Globe;
  if (type === "image") return ImageIcon;
  if (type === "video") return PlayCircle;
  if (type === "qr") return QrCode;
  return FileText;
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function groupHistory(items: HistoryItem[]): GroupedHistory[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const groups: GroupedHistory[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "This Week", items: [] },
    { label: "Older", items: [] }
  ];

  for (const item of items) {
    const updatedAt = new Date(item.updatedAt);
    if (updatedAt >= startOfToday) {
      groups[0].items.push(item);
    } else if (updatedAt >= startOfYesterday) {
      groups[1].items.push(item);
    } else if (updatedAt >= startOfWeek) {
      groups[2].items.push(item);
    } else {
      groups[3].items.push(item);
    }
  }

  return groups.filter((group) => group.items.length);
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserTrustPassport | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detailCache, setDetailCache] = useState<Record<string, HistoryDetail>>({});
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [verdict, setVerdict] = useState("all");
  const [view, setView] = useState<"all" | "bookmarked">("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [hoveredId, setHoveredId] = useState("");
  const pageSize = 10;

  const selectedDetail = selectedId ? detailCache[selectedId] || null : null;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const groupedHistory = useMemo(() => groupHistory(history), [history]);

  useEffect(() => {
    let active = true;
    api
      .get<{ found: boolean; user?: UserTrustPassport }>("/api/user/profile")
      .then((response) => {
        if (!active) return;
        setProfile(response.user || null);
      })
      .catch(() => {
        if (!active) return;
        setProfile(null);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingList(true);

    api
      .get<{
        history: HistoryItem[];
        total: number;
        page: number;
        pageSize: number;
        storageAvailable: boolean;
        trending: TrendingItem[];
      }>("/api/profile/history", {
        params: {
          search: search || undefined,
          type: type !== "all" ? type : undefined,
          verdict: verdict !== "all" ? verdict : undefined,
          bookmarked: view === "bookmarked" ? true : undefined,
          page,
          pageSize
        }
      })
      .then((response) => {
        if (!active) return;
        setHistory(response.history || []);
        setTrending(response.trending || []);
        setTotal(response.total || 0);
        setStorageAvailable(response.storageAvailable !== false);

        if (response.history?.length) {
          setSelectedId((current) => (current && response.history.some((item) => item.id === current) ? current : response.history[0].id));
        } else {
          setSelectedId("");
        }
      })
      .catch(() => {
        if (!active) return;
        setHistory([]);
        setTrending([]);
        setTotal(0);
        setSelectedId("");
        setStorageAvailable(false);
      })
      .finally(() => {
        if (!active) return;
        setLoadingList(false);
      });

    return () => {
      active = false;
    };
  }, [page, search, type, verdict, view]);

  useEffect(() => {
    if (!selectedId || detailCache[selectedId]) return;
    let active = true;
    setLoadingDetail(true);

    api
      .get<HistoryDetail>(`/api/profile/history/${selectedId}`)
      .then((response) => {
        if (!active) return;
        setDetailCache((current) => ({ ...current, [selectedId]: response }));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!active) return;
        setLoadingDetail(false);
      });

    return () => {
      active = false;
    };
  }, [detailCache, selectedId]);

  const summaryStats = useMemo(() => {
    const risky = history.filter((item) => item.verdict === "HIGH_RISK").length;
    const bookmarked = history.filter((item) => item.isBookmarked).length;
    const average = history.length ? Math.round(history.reduce((sum, item) => sum + item.score, 0) / history.length) : 0;
    return { risky, bookmarked, average };
  }, [history]);

  async function toggleBookmark(itemId: string) {
    try {
      const response = await api.post<{ isBookmarked: boolean }>(`/api/profile/bookmark/${itemId}`);
      setHistory((current) => current.map((item) => (item.id === itemId ? { ...item, isBookmarked: response.isBookmarked } : item)));
      setDetailCache((current) =>
        current[itemId]
          ? {
              ...current,
              [itemId]: {
                ...current[itemId],
                isBookmarked: response.isBookmarked
              }
            }
          : current
      );
    } catch {
      // keep UI stable
    }
  }

  function exportReport(itemId: string) {
    window.open(`/api/profile/history/${itemId}/export`, "_blank");
  }

  return (
    <AppShell
      title="Profile"
      subtitle="Manage saved analyses, bookmarks, and trusted history."
      trustScore={profile?.trustScore}
      riskLabel={profile?.riskLevel}
      userName={profile?.displayName}
      verified={profile?.verificationStatus === "verified"}
    >
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: "easeInOut" }} className="grid gap-6 xl:grid-cols-[320px,1fr]">
        <aside className="space-y-6">
          <Card hover={false} className="rounded-[28px] border border-white/[0.08] bg-white/[0.05] p-6 backdrop-blur-[10px]">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300/12 text-cyan-100">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/75">User Profile</p>
                <h1 className="mt-2 text-2xl font-semibold text-white">{profile?.displayName || "Secure User"}</h1>
                <p className="mt-2 text-sm text-slate-400">{profile?.email || "Signed-in account"}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <ProfileStat label="Trust Score" value={profile?.trustScore ?? 0} />
              <ProfileStat label="Average Score" value={summaryStats.average} />
              <ProfileStat label="Bookmarked" value={summaryStats.bookmarked} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Badge tone={profile?.verificationStatus === "verified" ? "success" : "info"}>
                {profile?.verificationStatus === "verified" ? "Verified user" : "Account active"}
              </Badge>
              <Badge tone="info">{profile?.plan || "free"} plan</Badge>
            </div>
          </Card>

          <Card hover={false} className="rounded-[28px] border border-white/[0.08] bg-white/[0.05] p-5 backdrop-blur-[10px]">
            <p className="text-sm font-semibold text-white">Search + Filters</p>
            <div className="mt-4 space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => {
                    setPage(1);
                    setSearch(event.target.value);
                  }}
                  placeholder="Search input..."
                  className="h-12 w-full rounded-2xl border border-white/[0.08] bg-black/20 pl-11 pr-4 text-sm text-slate-100 outline-none transition focus:border-cyan-300/35"
                />
              </div>
              <select
                value={type}
                onChange={(event) => {
                  setPage(1);
                  setType(event.target.value);
                }}
                className="h-12 w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-300/35"
              >
                <option value="all">All Types</option>
                <option value="url">URL</option>
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="qr">QR</option>
              </select>
              <select
                value={verdict}
                onChange={(event) => {
                  setPage(1);
                  setVerdict(event.target.value);
                }}
                className="h-12 w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-300/35"
              >
                <option value="all">All Verdicts</option>
                <option value="SAFE">Safe</option>
                <option value="SUSPICIOUS">Suspicious</option>
                <option value="RISK">High Risk</option>
              </select>
            </div>
          </Card>

          <Card hover={false} className="rounded-[28px] border border-white/[0.08] bg-white/[0.05] p-5 backdrop-blur-[10px]">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-cyan-200" />
              <p className="text-sm font-semibold text-white">Trending Searches</p>
            </div>
            <div className="mt-4 space-y-2">
              {trending.length ? (
                trending.map((item) => (
                  <div key={item.inputValue} className="flex items-center justify-between rounded-2xl bg-black/20 px-4 py-3 text-sm">
                    <span className="line-clamp-1 text-slate-200">{item.inputValue}</span>
                    <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-cyan-100">{item.count}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-black/20 px-4 py-4 text-sm text-slate-400">Trending inputs will appear after repeated searches.</div>
              )}
            </div>
          </Card>
        </aside>

        <section className="space-y-6">
          <Card hover={false} className="rounded-[28px] border border-white/[0.08] bg-white/[0.05] p-5 backdrop-blur-[10px]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-white">Analysis History</p>
                <p className="mt-1 text-sm text-slate-400">Fast, grouped access to saved analyses with bookmarks and export.</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Sparkles className="h-4 w-4 text-cyan-200" />
                {storageAvailable ? "SQL storage active" : "SQL storage unavailable"}
              </div>
            </div>

            <div className="mt-5 inline-flex rounded-full bg-black/20 p-1">
              <ViewToggle active={view === "all"} label="All" onClick={() => { setPage(1); setView("all"); }} />
              <ViewToggle active={view === "bookmarked"} label="Bookmarked" onClick={() => { setPage(1); setView("bookmarked"); }} />
            </div>

            <div className="mt-5 space-y-5">
              {loadingList ? (
                <div className="rounded-2xl bg-black/20 p-6 text-sm text-slate-400">Loading history...</div>
              ) : groupedHistory.length ? (
                groupedHistory.map((group) => (
                  <div key={group.label} className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{group.label}</p>
                    {group.items.map((item) => {
                      const Icon = typeIcon(item.inputType);
                      const active = item.id === selectedId;
                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          whileHover={{ scale: 1.01, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          onMouseEnter={() => setHoveredId(item.id)}
                          onMouseLeave={() => setHoveredId("")}
                          onClick={() => setSelectedId(item.id)}
                          className={`relative w-full rounded-[24px] border p-4 text-left transition-all duration-200 ease-in-out ${
                            active
                              ? "border-cyan-300/25 bg-cyan-300/10 shadow-[0_16px_30px_rgba(14,165,233,0.10)]"
                              : "border-white/[0.08] bg-black/20 hover:border-white/15 hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-cyan-100">
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="line-clamp-1 text-sm font-semibold text-white">{item.inputValue}</p>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                  <span className="inline-flex items-center gap-1">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    {formatDate(item.updatedAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void toggleBookmark(item.id);
                                }}
                                className={`rounded-full p-2 transition ${item.isBookmarked ? "text-amber-300" : "text-slate-500 hover:text-slate-200"}`}
                              >
                                <Star className={`h-4 w-4 ${item.isBookmarked ? "fill-current" : ""}`} />
                              </button>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-white">{item.score}</p>
                                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">score</p>
                              </div>
                              <Badge tone={verdictTone(item.verdict)}>{item.verdict.replace("_", " ")}</Badge>
                            </div>
                          </div>

                          <AnimatePresence>
                            {hoveredId === item.id ? (
                              <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 6 }}
                                className="pointer-events-none absolute right-4 top-[calc(100%+8px)] z-10 rounded-2xl border border-white/[0.08] bg-[#0b0f1a]/95 px-4 py-3 text-xs shadow-[0_18px_40px_rgba(2,6,23,0.35)] backdrop-blur-[10px]"
                              >
                                <p className="text-slate-300">{item.score}/100</p>
                                <p className="mt-1 text-cyan-100">{item.verdict.replace("_", " ")}</p>
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-black/20 p-6 text-sm text-slate-400">No saved analyses match the current filter.</div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">Page {page} of {pageCount}</p>
              <div className="flex gap-2">
                <PagerButton disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} label="Previous" />
                <PagerButton disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} label="Next" />
              </div>
            </div>
          </Card>

          <Card hover={false} className="rounded-[28px] border border-white/[0.08] bg-white/[0.05] p-6 backdrop-blur-[10px]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-white">Stored Analysis</p>
                <p className="mt-1 text-sm text-slate-400">Open a saved record to view its explanation, reports, and similarity without re-running the scan.</p>
              </div>
              {selectedDetail ? (
                <div className="flex items-center gap-2">
                  <Badge tone={verdictTone(selectedDetail.verdict)}>{selectedDetail.verdict.replace("_", " ")}</Badge>
                  <button
                    type="button"
                    onClick={() => exportReport(selectedDetail.id)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white/[0.06] px-4 py-2 text-sm text-white transition hover:bg-white/[0.1]"
                  >
                    <Download className="h-4 w-4" />
                    Export Report
                  </button>
                </div>
              ) : null}
            </div>

            <AnimatePresence mode="wait">
              {loadingDetail && selectedId ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 rounded-2xl bg-black/20 p-6 text-sm text-slate-400">
                  Loading stored analysis...
                </motion.div>
              ) : selectedDetail ? (
                <motion.div key={selectedDetail.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-6 space-y-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    <SummaryCard label="Input" value={selectedDetail.inputValue} />
                    <SummaryCard label="Score" value={`${selectedDetail.score}/100`} />
                    <SummaryCard label="Verdict" value={selectedDetail.verdict.replace("_", " ")} />
                    <SummaryCard label="Confidence" value={`${selectedDetail.confidence}%`} />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <SignalGroup title="Safe Signals" items={selectedDetail.safeSignals} tone="safe" empty="No stored safe signals." />
                    <SignalGroup title="Risk Signals" items={selectedDetail.riskSignals} tone="risk" empty="No stored risk signals." />
                  </div>

                  <Card hover={false} className="rounded-[24px] border border-white/[0.08] bg-black/20 p-5">
                    <p className="text-sm font-semibold text-white">Explanation</p>
                    <div className="mt-4 space-y-2">
                      {selectedDetail.explanation.length ? (
                        selectedDetail.explanation.map((item, index) => (
                          <div key={`${selectedDetail.id}-exp-${index}`} className="rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
                            {item}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-slate-400">No stored explanation available.</div>
                      )}
                    </div>
                  </Card>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <StoredGrid title="Reports" items={selectedDetail.reports.map((item) => ({ ...item, meta: item.source }))} />
                    <StoredGrid
                      title="Similarity"
                      items={selectedDetail.similarity.map((item) => ({
                        ...item,
                        source: item.source || "Related",
                        description: `${item.matchPercent}% similarity match`,
                        meta: `${item.matchPercent}% match`
                      }))}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 rounded-2xl bg-black/20 p-6 text-sm text-slate-400">
                  Choose a history item to open its stored analysis.
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>
      </motion.div>
    </AppShell>
  );
}

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">
        <CountUp value={value} />
      </p>
    </div>
  );
}

function ViewToggle({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm transition ${active ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:text-white"}`}
    >
      {label}
    </button>
  );
}

function PagerButton({ disabled, onClick, label }: { disabled: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl bg-white/[0.05] px-4 py-2 text-sm text-white transition disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-sm font-medium leading-6 text-white">{value}</p>
    </div>
  );
}

function SignalGroup({ title, items, tone, empty }: { title: string; items: string[]; tone: "safe" | "risk"; empty: string }) {
  return (
    <Card hover={false} className="rounded-[24px] border border-white/[0.08] bg-black/20 p-5">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.length ? (
          items.map((item, index) => (
            <span
              key={`${title}-${index}-${item}`}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs ${
                tone === "safe" ? "bg-emerald-400/10 text-emerald-100" : "bg-rose-400/10 text-rose-100"
              }`}
            >
              {item}
            </span>
          ))
        ) : (
          <p className="text-sm text-slate-400">{empty}</p>
        )}
      </div>
    </Card>
  );
}

function StoredGrid({
  title,
  items
}: {
  title: string;
  items: Array<{ id: string; title: string; source: string; url: string | null; image: string | null; description: string | null; meta?: string }>;
}) {
  return (
    <Card hover={false} className="rounded-[24px] border border-white/[0.08] bg-black/20 p-5">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.length ? (
          items.map((item) => (
            <a
              key={item.id}
              href={item.url || "#"}
              target="_blank"
              rel="noreferrer"
              className="overflow-hidden rounded-[20px] bg-white/[0.04] transition hover:bg-white/[0.06]"
            >
              <div className="flex h-28 items-center justify-center bg-slate-950/50">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <Sparkles className="h-5 w-5 text-slate-500" />
                )}
              </div>
              <div className="space-y-2 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">{item.source}</p>
                <p className="line-clamp-2 text-sm font-semibold text-white">{item.title}</p>
                <p className="line-clamp-2 text-sm text-slate-400">{item.description || "Stored result"}</p>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span>{item.meta || "Open"}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </div>
              </div>
            </a>
          ))
        ) : (
          <div className="rounded-2xl bg-white/[0.04] px-4 py-5 text-sm text-slate-400">No stored {title.toLowerCase()} for this analysis.</div>
        )}
      </div>
    </Card>
  );
}
