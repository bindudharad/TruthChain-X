"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { api } from "@/services/api";
import { UserTrustPassport } from "@/lib/types";

type AuthResponse = {
  token: string;
  user: UserTrustPassport;
};

function getSafeNextPath(value: string | null) {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return "/analyze";
}

export function AuthExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const loginRequired = searchParams.get("message") === "login-required";
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("analyst@truthchain.ai");
  const [password, setPassword] = useState("demo12345");
  const [confirmPassword, setConfirmPassword] = useState("demo12345");
  const [displayName, setDisplayName] = useState("Trust Analyst");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    if (mode === "register" && password !== confirmPassword) {
      setStatus("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const data =
        mode === "register"
          ? await api.post<AuthResponse>("/api/auth/register", { email, password, displayName })
          : await api.post<AuthResponse>("/api/auth/login", { email, password });

      setStatus(`Welcome, ${data.user.displayName}. Redirecting...`);
      router.replace(nextPath);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to continue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.14),transparent_34%),linear-gradient(180deg,#0b1120_0%,#020617_100%)] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full rounded-2xl border border-white/10 bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        >
          <Link href="/" className="mb-8 inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="font-semibold text-white">TruthChain-X</span>
          </Link>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-200/80">Secure Access</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              {mode === "login" ? "Login to continue" : "Create your account"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              We require login to ensure safe and responsible usage.
            </p>
          </div>

          {loginRequired ? (
            <div className="mt-5 flex gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/8 p-4 text-sm leading-6 text-cyan-100">
              <LockKeyhole className="mt-0.5 h-4 w-4 flex-none" />
              <span>For your safety and to prevent misuse, login is required before scanning.</span>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-slate-950/35 p-1 text-sm">
            {(["login", "register"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setMode(value);
                  setStatus("");
                }}
                className={`rounded-lg px-3 py-2 capitalize transition ${
                  mode === value ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {value === "login" ? "Login" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "register" ? (
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Display name"
                className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-300/40 focus:shadow-[0_0_0_3px_rgba(103,232,249,0.08)]"
              />
            ) : null}
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-300/40 focus:shadow-[0_0_0_3px_rgba(103,232,249,0.08)]"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-300/40 focus:shadow-[0_0_0_3px_rgba(103,232,249,0.08)]"
            />
            {mode === "register" ? (
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm password"
                className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-300/40 focus:shadow-[0_0_0_3px_rgba(103,232,249,0.08)]"
              />
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-cyan-300 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 hover:shadow-[0_14px_36px_rgba(103,232,249,0.16)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Working..." : mode === "register" ? "Create Account" : "Login"}
            </button>
          </form>

          {status ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-200">
              {status}
            </div>
          ) : null}
        </motion.section>
      </div>
    </main>
  );
}
