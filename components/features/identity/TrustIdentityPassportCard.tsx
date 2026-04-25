"use client";

import { memo, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { BadgeCheck, Fingerprint, KeyRound, ShieldAlert, UserRound } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/services/api";
import { UserTrustPassport } from "@/lib/types";

type PermissionsResponse = {
  found: boolean;
  permissions: string[];
  uploadRestricted: boolean;
  role: string;
  trustScore: number;
};

function TrustIdentityPassportCardBase() {
  const [user, setUser] = useState<UserTrustPassport | null>(null);
  const [permissions, setPermissions] = useState<PermissionsResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get<{ found: boolean; user: UserTrustPassport }>("/api/user/profile"), api.get<PermissionsResponse>("/api/user/permissions")])
      .then(([profile, permissionData]) => {
        setUser(profile.user || null);
        setPermissions(permissionData || null);
        setError("");
      })
      .catch((nextError) => {
        setUser(null);
        setPermissions(null);
        setError(nextError instanceof Error ? nextError.message : "Profile backend is unavailable.");
      });
  }, []);

  if (!user) {
    return (
      <Card>
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-slate-100">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">Trust Identity Passport</p>
            <p className="text-sm text-slate-400">Sign in to activate live user trust, permissions, and badge controls.</p>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
          {error || "No authenticated user session found. Identity data is not connected yet."}
        </div>
        <div className="mt-4">
          <Link href="/auth" className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100">
            <KeyRound className="h-4 w-4" />
            Login or Register
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-slate-100">
            <Fingerprint className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{user.displayName}</p>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={user.role === "admin" || user.role === "enterprise" ? "info" : "neutral"}>{user.role}</Badge>
          {user.badges.includes("Verified") ? (
            <Badge tone="success" className="inline-flex items-center gap-1">
              <BadgeCheck className="h-4 w-4" />
              Verified
            </Badge>
          ) : null}
        </div>
      </div>

      {error ? <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{error}</div> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Trust Score" value={`${user.trustScore}%`} />
        <Stat label="Risk Level">
          <Badge tone={user.riskLevel === "high" ? "danger" : user.riskLevel === "medium" ? "warning" : "success"} className="text-sm capitalize">
            {user.riskLevel}
          </Badge>
        </Stat>
        <Stat label="Verification" value={user.verificationStatus} capitalize />
        <Stat label="Reports Logged" value={String(user.reportsCount)} />
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Permission Network</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {user.permissions.slice(0, 8).map((permission) => (
            <span key={permission} className="rounded-full border border-white/10 bg-slate-950/35 px-3 py-1 text-xs text-slate-300">
              {permission}
            </span>
          ))}
        </div>
        {permissions?.uploadRestricted ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-3 text-sm text-rose-100">
            <ShieldAlert className="mt-0.5 h-4 w-4" />
            Uploads are restricted until trust score improves above the minimum threshold.
          </div>
        ) : null}
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/25 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Identity Anchor</p>
        <p className="mt-3 break-all font-mono text-xs text-slate-400">{user.blockchainIdentityHash}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {user.badges.map((badge) => (
            <Badge key={badge} tone="info">
              {badge}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}

function Stat({
  label,
  value,
  children,
  capitalize = false
}: {
  label: string;
  value?: string;
  children?: ReactNode;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      {children || <p className={`mt-3 text-3xl font-semibold text-white ${capitalize ? "capitalize" : ""}`}>{value}</p>}
    </div>
  );
}

export const TrustIdentityPassportCard = memo(TrustIdentityPassportCardBase);
