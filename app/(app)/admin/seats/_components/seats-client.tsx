"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Member = {
  id: string;
  full_name: string | null;
  role: "admin" | "member";
  created_at: string;
};

type Invite = {
  id: string;
  email: string;
  role: "admin" | "member";
  token: string;
  expires_at: string;
  created_at: string;
};

type Props = {
  currentUserId: string;
  members: Member[];
  initialInvites: Invite[];
};

export function SeatsClient({ currentUserId, members, initialInvites }: Props) {
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>(initialInvites);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      const newInvite: Invite = {
        id: json.invite.id,
        email: json.invite.email,
        role: json.invite.role,
        token: json.invite.token,
        expires_at: json.invite.expires_at,
        created_at: new Date().toISOString(),
      };
      setInvites((prev) =>
        prev.some((i) => i.id === newInvite.id) ? prev : [newInvite, ...prev],
      );
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite.");
    } finally {
      setPending(false);
    }
  }

  async function revoke(id: string) {
    const res = await fetch(`/api/admin/invites/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || `HTTP ${res.status}`);
      return;
    }
    setInvites((prev) => prev.filter((i) => i.id !== id));
  }

  async function removeMember(userId: string) {
    if (
      !confirm(
        "Remove this member? They'll lose access to the firm library; their drafts will stay accessible to them personally.",
      )
    ) {
      return;
    }
    const res = await fetch(`/api/admin/seats/${userId}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || `HTTP ${res.status}`);
      return;
    }
    router.refresh();
  }

  async function setMemberRole(userId: string, newRole: "admin" | "member") {
    const res = await fetch(`/api/admin/seats/${userId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || `HTTP ${res.status}`);
      return;
    }
    router.refresh();
  }

  async function copyInviteLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken((t) => (t === token ? null : t)), 2000);
    } catch {
      // Fallback: select-and-copy via prompt
      window.prompt("Copy this invite link:", url);
    }
  }

  return (
    <>
      {/* Invite form */}
      <div className="bg-surface border border-line p-6 sm:p-8 mb-8">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4">
          Invite a teammate
        </div>
        <form onSubmit={invite} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_120px] gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="atty.cruz@firm.ph"
            required
            className="bg-parchment border border-line px-3 py-[10px] font-sans text-[14px] text-ink rounded-[2px] focus:outline-none focus:border-ink"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "member")}
            className="bg-parchment border border-line px-3 py-[10px] font-sans text-[14px] text-ink rounded-[2px] focus:outline-none focus:border-ink"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={!email.trim() || pending}
            className="bg-ink text-parchment border-0 px-4 py-[8px] font-sans text-[13px] font-medium rounded-[2px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "Inviting…" : "Invite →"}
          </button>
        </form>
        {error && (
          <div className="mt-3 text-[12.5px] text-accent border-l-2 border-accent pl-3 py-1 leading-[1.45]">
            {error}
          </div>
        )}
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="mb-10">
          <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-3">
            Pending invites · {invites.length}
          </div>
          <div className="border border-line">
            {invites.map((inv) => {
              const expired = new Date(inv.expires_at) < new Date();
              return (
                <div
                  key={inv.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 sm:gap-4 px-4 py-3 border-b border-line-soft last:border-b-0 items-center"
                >
                  <div>
                    <div className="font-sans text-[14px] text-ink truncate">
                      {inv.email}
                    </div>
                    <div className="font-mono text-[10.5px] text-muted mt-0.5">
                      {inv.role} · expires{" "}
                      {new Date(inv.expires_at).toLocaleDateString("en-PH", {
                        timeZone: "Asia/Manila",
                      })}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyInviteLink(inv.token)}
                    disabled={expired}
                    className="font-mono text-[11px] text-ink border border-line px-3 py-[6px] rounded-[2px] bg-transparent hover:bg-parchment cursor-pointer disabled:opacity-50"
                  >
                    {copiedToken === inv.token ? "Copied" : "Copy link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => revoke(inv.id)}
                    className="font-mono text-[11px] text-accent bg-transparent border-0 cursor-pointer hover:underline"
                  >
                    Revoke
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Members */}
      <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-3">
        Members · {members.length}
      </div>
      <div className="border border-line">
        {members.map((m) => {
          const isCurrent = m.id === currentUserId;
          return (
            <div
              key={m.id}
              className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-3 sm:gap-4 px-4 py-3 border-b border-line-soft last:border-b-0 items-center"
            >
              <div>
                <div className="font-sans text-[14px] text-ink">
                  {m.full_name || "(unnamed)"}
                  {isCurrent && (
                    <span className="ml-2 font-mono text-[10px] text-muted">
                      you
                    </span>
                  )}
                </div>
                <div className="font-mono text-[10.5px] text-muted mt-0.5">
                  Joined{" "}
                  {new Date(m.created_at).toLocaleDateString("en-PH", {
                    timeZone: "Asia/Manila",
                  })}
                </div>
              </div>
              <select
                value={m.role}
                onChange={(e) =>
                  setMemberRole(m.id, e.target.value as "admin" | "member")
                }
                className="bg-parchment border border-line px-2 py-[5px] font-sans text-[12.5px] text-ink rounded-[2px] focus:outline-none focus:border-ink"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="button"
                onClick={() => removeMember(m.id)}
                className="font-mono text-[11px] text-accent bg-transparent border-0 cursor-pointer hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isCurrent && m.role === "admin"}
                title={
                  isCurrent && m.role === "admin"
                    ? "You can't remove yourself as the only admin. Promote someone else first."
                    : undefined
                }
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
