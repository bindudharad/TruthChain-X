"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/services/api";
import { UserTrustPassport } from "@/lib/types";

type AdminUsersResponse = {
  users: Array<UserTrustPassport & { behavior: { suspicious: boolean; flags: string[]; copilotMessage: string } }>;
};

export function AdminIdentityPanel() {
  const [users, setUsers] = useState<AdminUsersResponse["users"]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<AdminUsersResponse>("/api/analytics/users")
      .then((data) => {
        setUsers(data.users || []);
        setError("");
      })
      .catch((nextError) => setError(nextError instanceof Error ? nextError.message : "Admin access required."));
  }, []);

  return (
    <Card>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-white">Admin Identity Oversight</p>
          <p className="text-sm text-slate-400">Role-gated monitoring for risky users, trust drift, and suspicious behavior.</p>
        </div>
        <Badge tone="info">{users.length} users</Badge>
      </div>
      {error ? <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{error}</div> : null}
      <div className="space-y-3">
        {users.slice(0, 6).map((user) => (
          <div key={user.userId} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">{user.displayName}</p>
                <p className="mt-1 text-xs text-slate-500">{user.role} | {user.email}</p>
              </div>
              <Badge tone={user.riskLevel === "high" ? "danger" : user.riskLevel === "medium" ? "warning" : "success"}>{user.trustScore}%</Badge>
            </div>
            <div className="mt-3 flex items-start gap-2 text-sm text-slate-300">
              {user.behavior.suspicious ? <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-200" /> : <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-200" />}
              <p>{user.behavior.copilotMessage}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
