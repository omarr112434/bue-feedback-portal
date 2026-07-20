import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import bueLogo from "@/assets/bue-logo.png.asset.json";
import { LayoutDashboard, PencilLine, ClipboardList, LogOut, Plus, Bell, Star } from "lucide-react";

export const Route = createFileRoute("/student/")({
  head: () => ({ meta: [{ title: "Student Dashboard | BUE Feedback Portal" }] }),
  component: StudentDashboard,
});

type FeedbackRow = {
  id: string;
  feedback_type: string;
  rating: number;
  comment: string | null;
  created_at: string;
  module_id: string | null;
  modules?: { module_name: string } | null;
};

function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);

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
      if (roles?.some((r) => r.role === "admin")) {
        navigate({ to: "/admin" });
        return;
      }
      setUser({ id: data.user.id, email: data.user.email ?? null });

      const { data: fb } = await supabase
        .from("feedback")
        .select("id, feedback_type, rating, comment, created_at, module_id, modules(module_name)")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false });
      setFeedback((fb as FeedbackRow[]) ?? []);
      setLoading(false);
    })();
  }, [navigate]);

  const stats = useMemo(() => {
    const total = feedback.length;
    const avg = total
      ? (feedback.reduce((s, f) => s + f.rating, 0) / total).toFixed(1)
      : "0.0";
    const last = feedback[0]
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(feedback[0].created_at).getTime()) / 86400000,
          ),
        )
      : null;
    const now = new Date();
    const thisMonth = feedback.filter((f) => {
      const d = new Date(f.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return { total, avg, last, thisMonth };
  }, [feedback]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  const displayName = user?.email?.split("@")[0] ?? "Student";

  return (
    <div className="min-h-screen bg-neutral-100 p-2 sm:p-4">
      <div className="mx-auto max-w-[1400px] bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[calc(100vh-2rem)]">
        {/* Sidebar */}
        <aside className="lg:w-64 border-b lg:border-b-0 lg:border-r border-neutral-200 flex flex-col">
          <div className="p-6 flex items-center gap-2">
            <img src={bueLogo.url} alt="BUE" className="h-8 w-auto" />
            <span className="font-bold text-neutral-900 text-sm">BUE Feedback Portal</span>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active />
            <Link to="/student/feedback" className="block w-full">
              <NavItem icon={<PencilLine size={18} />} label="Submit Feedback" />
            </Link>
            <Link to="/student/my-feedback">
              <NavItem icon={<ClipboardList size={18} />} label="My Feedback" />
            </Link>
            <button onClick={signOut} className="w-full text-left">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 text-sm font-medium">
                <LogOut size={18} />
                Log out
              </div>
            </button>
          </nav>
          <div className="p-4 border-t border-neutral-200 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#00BCD4] text-white flex items-center justify-center font-semibold shrink-0">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate capitalize">
                {displayName}
              </p>
              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-4 sm:p-8">
          <header className="flex items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-full hover:bg-neutral-100 relative">
                <Bell size={20} className="text-neutral-600" />
              </button>
              <Link
                to="/student/feedback"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium text-sm shrink-0"
                style={{ backgroundColor: "#00BCD4" }}
              >
                <Plus size={16} /> Submit Feedback
              </Link>
            </div>
          </header>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total Feedback" value={String(stats.total)} bg="bg-pink-100" />
            <StatCard label="Average Rating" value={stats.avg} bg="bg-orange-100" />
            <StatCard
              label="Last Submitted"
              value={stats.last === null ? "—" : stats.last === 0 ? "Today" : `${stats.last}d ago`}
              bg="bg-purple-100"
            />
          </div>

          {/* Profile */}
          <div className="mt-6 border border-neutral-200 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-[#00BCD4] text-white flex items-center justify-center text-xl font-bold shrink-0">
                {displayName[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-neutral-900 capitalize">{displayName}</p>
                <p className="text-sm text-neutral-500 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-neutral-600">
                  {stats.thisMonth} feedback submitted this month
                </span>
                <span className="font-semibold text-neutral-900">
                  {Math.min(100, stats.thisMonth * 20)}%
                </span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, stats.thisMonth * 20)}%`,
                    backgroundColor: "#00BCD4",
                  }}
                />
              </div>
            </div>
          </div>

          {/* My Recent Feedback */}
          <section id="my-feedback" className="mt-6 border border-neutral-200 rounded-xl p-5">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">My Recent Feedback</h2>
            {loading ? (
              <p className="text-sm text-neutral-500">Loading…</p>
            ) : feedback.length === 0 ? (
              <p className="text-sm text-neutral-500">
                No feedback yet. Click "Submit Feedback" to add your first one.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {feedback.map((f) => (
                  <li key={f.id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-900 truncate">
                        {f.modules?.module_name ?? "General Feedback"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Stars value={f.rating} />
                        <CategoryBadge type={f.feedback_type} />
                        <span className="text-xs text-neutral-500">
                          {new Date(f.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      className="text-sm font-medium shrink-0"
                      style={{ color: "#00BCD4" }}
                    >
                      View details →
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

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
        active ? "bg-[#00BCD4]/10 text-[#00BCD4]" : "text-neutral-700 hover:bg-neutral-100"
      }`}
    >
      {icon}
      {label}
    </div>
  );
}

function StatCard({ label, value, bg }: { label: string; value: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-5`}>
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
