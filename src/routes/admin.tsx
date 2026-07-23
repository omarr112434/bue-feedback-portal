import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  LogOut,
  Star,
  Download,
  Search,
  MessageSquare,
  Send,
  X,
  GraduationCap,
} from "lucide-react";

const BUE_LOGO_URL = "/bue-logo.png";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard | BUE" }] }),
  component: AdminDashboard,
});

type FeedbackRow = {
  id: string;
  user_id: string;
  feedback_type: string;
  rating: number;
  comment: string | null;
  created_at: string;
  is_anonymous: boolean;
  module_id: string | null;
  modules?: { module_name: string } | null;
};

type ProfileInfo = { id: string; full_name: string | null; email: string | null };

type ModuleInfo = { id: string; module_name: string };

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileInfo>>({});
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);

  // Filters
  const [filterModule, setFilterModule] = useState("");
  const [filterType, setFilterType] = useState("");
  const [searchText, setSearchText] = useState("");

  // Reply state
  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState<Record<string, string>>({});

  // Auth check
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate({ to: "/login" });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      if (!roles?.some((r) => r.role === "admin")) {
        navigate({ to: "/student" });
        return;
      }
      setUser({ id: data.user.id, email: data.user.email ?? null });
      setChecking(false);
    })();
  }, [navigate]);

  // Fetch data
  useEffect(() => {
    if (checking) return;
    (async () => {
      setLoading(true);

      const { data: fbData } = await supabase
        .from("feedback")
        .select(
          "id, user_id, feedback_type, rating, comment, created_at, is_anonymous, module_id, modules(module_name)",
        )
        .order("created_at", { ascending: false });
      const rows = (fbData as FeedbackRow[]) ?? [];
      setFeedback(rows);

      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email");
      const map: Record<string, ProfileInfo> = {};
      (profs ?? []).forEach((p) => {
        map[p.id] = p;
      });
      setProfiles(map);

      const { data: mods } = await supabase
        .from("modules")
        .select("id, module_name");
      setModules((mods as ModuleInfo[]) ?? []);

      setLoading(false);
    })();
  }, [checking]);

  // Computed stats
  const stats = useMemo(() => {
    const total = feedback.length;
    const avg = total
      ? (feedback.reduce((s, f) => s + f.rating, 0) / total).toFixed(1)
      : "0.0";
    const today = new Date();
    const newToday = feedback.filter((f) => {
      const d = new Date(f.created_at);
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    }).length;
    const uniqueStudents = new Set(feedback.map((f) => f.user_id)).size;
    return { total, avg, newToday, uniqueStudents };
  }, [feedback]);

  // Filtered data
  const filtered = useMemo(() => {
    let rows = feedback;
    if (filterModule) {
      rows = rows.filter((f) => f.module_id === filterModule);
    }
    if (filterType) {
      rows = rows.filter((f) => f.feedback_type === filterType);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      rows = rows.filter((f) => f.comment?.toLowerCase().includes(q));
    }
    return rows;
  }, [feedback, filterModule, filterType, searchText]);

  // Export CSV
  function exportCSV() {
    const header = ["Student Name", "Module", "Rating", "Feedback Type", "Date", "Sentiment", "Comment"];
    const csvRows = [header.join(",")];
    filtered.forEach((f) => {
      const p = profiles[f.user_id];
      const name = f.is_anonymous
        ? "Anonymous"
        : p?.full_name || p?.email?.split("@")[0] || "Unknown";
      const mod = f.modules?.module_name ?? "General";
      const sentiment = f.rating >= 4 ? "Positive" : f.rating === 3 ? "Neutral" : "Negative";
      const date = new Date(f.created_at).toLocaleDateString();
      const comment = (f.comment ?? "").replace(/"/g, '""');
      csvRows.push(
        `"${name}","${mod}",${f.rating},"${f.feedback_type}","${date}","${sentiment}","${comment}"`,
      );
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "feedback_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Reply handler
  function submitReply(feedbackId: string) {
    if (!replyText.trim()) return;
    setReplies((prev) => ({ ...prev, [feedbackId]: replyText.trim() }));
    setReplyText("");
    setReplyOpen(null);
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  const displayName = user?.email?.split("@")[0] ?? "Admin";

  if (checking) return null;

  return (
    <div className="min-h-screen bg-slate-100 p-2 sm:p-4">
      <div className="mx-auto max-w-[1400px] bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[calc(100vh-2rem)]">
        {/* Sidebar */}
        <aside className="lg:w-64 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col">
          <div className="p-6 flex items-center gap-2">
            <div className="bg-white p-2 rounded-lg shadow-sm flex items-center justify-center">
              <img src={BUE_LOGO_URL} alt="BUE" className="h-8 w-auto object-contain" />
            </div>
            <span className="font-bold text-white text-sm">BUE Feedback Portal</span>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active />
            <NavItem icon={<ClipboardList size={18} />} label="All Feedback" />
            <NavItem icon={<Users size={18} />} label="Instructor Ratings" />
            <Link to="/student" className="block">
              <NavItem icon={<GraduationCap size={18} />} label="Student View" />
            </Link>
            <button onClick={signOut} className="w-full text-left">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-300 hover:bg-slate-800 text-sm font-medium">
                <LogOut size={18} />
                Log out
              </div>
            </button>
          </nav>
          <div className="p-4 border-t border-slate-800 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-semibold shrink-0">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate capitalize">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-semibold text-white shrink-0"
              style={{ backgroundColor: "#0f172a" }}
            >
              Admin
            </span>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-4 sm:p-8 overflow-auto">
          <header className="flex items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium text-sm shrink-0"
              style={{ backgroundColor: "#0f172a" }}
            >
              <Download size={16} />
              Export CSV
            </button>
          </header>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Feedback" value={String(stats.total)} bg="bg-pink-100" />
            <StatCard label="Average Rating" value={stats.avg} bg="bg-orange-100" />
            <StatCard label="New Today" value={String(stats.newToday)} bg="bg-green-100" />
            <StatCard label="Total Students" value={String(stats.uniqueStudents)} bg="bg-purple-100" />
          </div>

          {/* Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white min-w-[180px]"
            >
              <option value="">All Modules</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.module_name}
                </option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white min-w-[160px]"
            >
              <option value="">All Types</option>
              <option value="module">Module</option>
              <option value="instructor">Instructor</option>
              <option value="general">General</option>
            </select>
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search comments…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg pl-9 pr-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="card-premium border-0 overflow-hidden">
            {loading ? (
              <div className="p-6 text-center">
                <p className="text-sm text-neutral-500">Loading feedback…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-neutral-500">No feedback matches your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="text-left px-4 py-3 font-semibold text-neutral-700">Student Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-neutral-700">Module</th>
                      <th className="text-left px-4 py-3 font-semibold text-neutral-700">Rating</th>
                      <th className="text-left px-4 py-3 font-semibold text-neutral-700">Type</th>
                      <th className="text-left px-4 py-3 font-semibold text-neutral-700">Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-neutral-700">Sentiment</th>
                      <th className="text-left px-4 py-3 font-semibold text-neutral-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filtered.map((f) => {
                      const p = profiles[f.user_id];
                      const studentName = f.is_anonymous
                        ? "Anonymous"
                        : p?.full_name || p?.email?.split("@")[0] || "Unknown";
                      const sentiment =
                        f.rating >= 4
                          ? { label: "Positive", cls: "bg-green-100 text-green-700" }
                          : f.rating === 3
                            ? { label: "Neutral", cls: "bg-yellow-100 text-yellow-700" }
                            : { label: "Negative", cls: "bg-red-100 text-red-700" };

                      return (
                        <Fragment key={f.id}>
                          <tr className="hover:bg-neutral-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-neutral-900">{studentName}</td>
                            <td className="px-4 py-3 text-neutral-700">
                              {f.modules?.module_name ?? "General"}
                            </td>
                            <td className="px-4 py-3">
                              <Stars value={f.rating} />
                            </td>
                            <td className="px-4 py-3">
                              <CategoryBadge type={f.feedback_type} />
                            </td>
                            <td className="px-4 py-3 text-neutral-500">
                              {new Date(f.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${sentiment.cls}`}
                              >
                                {sentiment.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {replies[f.id] ? (
                                <span className="text-xs text-green-600 font-medium">✓ Replied</span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setReplyOpen(replyOpen === f.id ? null : f.id);
                                    setReplyText("");
                                  }}
                                  className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                                  style={{ color: "#0f172a" }}
                                >
                                  <MessageSquare size={14} />
                                  Reply
                                </button>
                              )}
                            </td>
                          </tr>
                          {/* Inline reply row */}
                          {replyOpen === f.id && (
                            <tr>
                              <td colSpan={7} className="px-4 py-3 bg-neutral-50">
                                <div className="flex items-center gap-2 max-w-xl">
                                  <input
                                    type="text"
                                    placeholder="Write a reply…"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") submitReply(f.id);
                                    }}
                                    className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => submitReply(f.id)}
                                    className="p-2 rounded-lg text-white shrink-0"
                                    style={{ backgroundColor: "#0f172a" }}
                                  >
                                    <Send size={16} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReplyOpen(null);
                                      setReplyText("");
                                    }}
                                    className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-200 shrink-0"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                          {/* Show saved reply */}
                          {replies[f.id] && replyOpen !== f.id && (
                            <tr>
                              <td colSpan={7} className="px-4 py-2 bg-green-50">
                                <p className="text-xs text-neutral-600">
                                  <span className="font-semibold" style={{ color: "#0f172a" }}>
                                    Admin Reply:
                                  </span>{" "}
                                  {replies[f.id]}
                                </p>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-xs text-neutral-400 mt-4">
            Showing {filtered.length} of {feedback.length} feedback entries
          </p>
        </main>
      </div>
    </div>
  );
}

/* ─── Helper components ───────────────────────────────────────────── */

function NavItem({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
        active ? "bg-red-700 text-white" : "text-slate-200 hover:bg-slate-800"
      }`}
    >
      {icon}
      {label}
    </div>
  );
}

function StatCard({ label, value, bg: _bg }: { label: string; value: string; bg?: string }) {
  return (
    <div className="card-premium p-5">
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      <p className="text-sm text-neutral-700 mt-1">{label}</p>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          className={n <= value ? "fill-yellow-400 text-yellow-400" : "text-neutral-300"}
        />
      ))}
    </div>
  );
}

function CategoryBadge({ type }: { type: string }) {
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  const colors: Record<string, string> = {
    module: "bg-blue-100 text-blue-700",
    instructor: "bg-purple-100 text-purple-700",
    general: "bg-neutral-100 text-neutral-700",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[type] ?? colors.general}`}
    >
      {label}
    </span>
  );
}
