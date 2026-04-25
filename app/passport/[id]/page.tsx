import Link from "next/link";
import { findVerificationByHash } from "@/lib/db";
import { ClientDateText } from "@/components/ui/ClientDateText";

export default async function PassportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await findVerificationByHash(id);

  if (!record) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-6 py-16 text-slate-100">
        <div className="panel rounded-xl p-8">
          <h1 className="text-2xl font-semibold">Risk Passport Not Found</h1>
          <p className="mt-4 text-slate-400">No passport exists for this phishing risk signature.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-16 text-slate-100">
      <div className="panel rounded-xl p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">TruthChain-X Passport</p>
            <h1 className="mt-2 text-3xl font-semibold">{record.fileName}</h1>
            <p className="mt-3 text-slate-400">{record.explanation}</p>
          </div>
          <Link href="/" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300">
            Open Dashboard
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <PassportItem label="Phishing Risk Score" value={`${record.truthScore}%`} />
          <PassportItem label="Fingerprint ID" value={record.trustFingerprint.fingerprintId} />
          <PassportItem label="Blockchain Status" value={record.blockchainStatus} />
          <PassportItem
            label="First Verified"
            value={<ClientDateText value={record.firstVerifiedAt} fallbackLabel={record.firstVerifiedAt.replace("T", " ").slice(0, 16)} />}
          />
          <PassportItem
            label="Last Checked"
            value={<ClientDateText value={record.lastVerifiedAt} fallbackLabel={record.lastVerifiedAt.replace("T", " ").slice(0, 16)} />}
          />
          <PassportItem label="Content Hash" value={record.hash} mono />
          <PassportItem label="Transaction" value={record.transactionHash} mono />
        </div>
      </div>
    </main>
  );
}

function PassportItem({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className={`mt-2 text-sm text-slate-200 ${mono ? "break-all font-mono" : ""}`}>{value}</p>
    </div>
  );
}
