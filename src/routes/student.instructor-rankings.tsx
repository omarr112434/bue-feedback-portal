import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  PencilLine,
  ClipboardList,
  LogOut,
  Star,
  Trophy,
  ShieldCheck, } from "lucide-react";

const BUE_LOGO_URL = "/bue-logo.png";

export const Route = createFileRoute("/student/instructor-rankings")({
  head: () => ({
    meta: [{ title: "Instructor Rankings | BUE Feedback Portal" }],
  }),
  component: InstructorRankingsPage,
});

type InstructorRow = {
  id: string;
  name: string;
  title: string | null;
  module_id: string | null;
  modules?: { module_name: string } | null;
};

type FeedbackAgg = {
  module_id: string;
  totalRating: number;
  count: number;
};

function InstructorRankingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [instructors, setInstructors] = useState<InstructorRow[]>([]);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackAgg>>({});
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
      setIsAdmin(!!roles?.some((r) => r.role === "admin"));
      setUser({ id: data.user.id, email: data.user.email ?? null });

      const { data: instrData } = await supabase
        .from("instructors")
        .select("id, name, title, module_id, modules(module_name)");
      setInstructors((instrData as InstructorRow[]) ?? []);

      const { data: fbData } = await supabase
        .from("feedback")
        .select("module_id, rating");

      const map: Record<string, FeedbackAgg> = {};
      ((fbData as { module_id: string | null; rating: number }[]) ?? []).forEach(
        (f) => {
          if (!f.module_id) return;
          if (!map[f.module_id]) {
            map[f.module_id] = { module_id: f.module_id, totalRating: 0, count: 0 };
          }
          map[f.module_id].totalRating += f.rating;
          map[f.module_id].count += 1;
        },
      );
      setFeedbackMap(map);
      setLoading(false);
    })();
  }, [navigate]);

  const ranked = useMemo(() => {
    return instructors
      .map((inst) => {
        const agg = inst.module_id ? feedbackMap[inst.module_id] : undefined;
        const avg = agg ? agg.totalRating / agg.count : 0;
        const count = agg ? agg.count : 0;
        return { ...inst, avg, count };
      })
      .sort((a, b) => b.avg - a.avg || b.count - a.count);
  }, [instructors, feedbackMap]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  const displayName = user?.email?.split("@")[0] ?? "Student";

  function trophyIcon(rank: number) {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-2 sm:p-4">
      <div className="mx-auto max-w-[1400px] bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[calc(100vh-2rem)]">
        {/* Sidebar */}
        <aside className="lg:w-64 border-b lg:border-b-0 lg:border-r border-neutral-200 flex flex-col">
          <div className="p-6 flex items-center gap-2">
            <img src={BUE_LOGO_URL} alt="BUE" className="h-8 w-auto object-contain mix-blend-multiply" />
            <span className="font-bold text-neutral-900 text-sm">
              BUE Feedback Portal
            </span>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            <Link to="/student">
              <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" />
            </Link>
            <Link to="/student/feedback">
              <NavItem icon={<PencilLine size={18} />} label="Submit Feedback" />
            </Link>
            <Link to="/student/my-feedback">
              <NavItem icon={<ClipboardList size={18} />} label="My Feedback" />
            </Link>
            <Link to="/student/instructor-rankings">
              <NavItem
                icon={<Trophy size={18} />}
                label="Instructor Rankings"
                active
              />
            </Link>
            {isAdmin && (
              <Link to="/admin" className="block">
                <NavItem icon={<ShieldCheck size={18} />} label="Admin Portal" />
              </Link>
            )}
            <button onClick={signOut} className="w-full text-left">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 text-sm font-medium">
                <LogOut size={18} />
                Log out
              </div>
            </button>
          </nav>
          <div className="p-4 border-t border-neutral-200 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-semibold shrink-0">
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
            <div className="flex items-center gap-3">
              <Trophy size={28} className="text-yellow-500" />
              <h1 className="text-2xl font-bold text-neutral-900">
                Instructor Rankings
              </h1>
            </div>
          </header>

          {loading ? (
            <p className="text-sm text-neutral-500">Loading…</p>
          ) : ranked.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No instructors found.
            </p>
          ) : (
            <div className="space-y-3">
              {ranked.map((inst, idx) => {
                const rank = idx + 1;
                const medal = trophyIcon(rank);
                return (
                  <div
                    key={inst.id}
                    className={`border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${
                      rank <= 3
                        ? "border-yellow-200 bg-yellow-50/40"
                        : "border-neutral-200"
                    }`}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-10 h-10 shrink-0">
                      {medal ? (
                        <span className="text-2xl">{medal}</span>
                      ) : (
                        <span className="text-lg font-bold text-neutral-400">
                          #{rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="h-12 w-12 rounded-full bg-[#0f172a] text-white flex items-center justify-center text-lg font-bold shrink-0">
                      {inst.name[0]?.toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-900">
                        {inst.name}
                      </p>
                      {inst.title && (
                        <p className="text-sm text-neutral-500">{inst.title}</p>
                      )}
                      {inst.modules?.module_name && (
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {inst.modules.module_name}
                        </p>
                      )}
                    </div>

                    {/* Rating & Stats */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex items-center gap-2">
                        <Stars value={Math.round(inst.avg)} />
                        <span className="text-sm font-semibold text-neutral-900">
                          {inst.avg.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">
                        {inst.count} {inst.count === 1 ? "review" : "reviews"}
                      </p>
                      {/* Progress bar */}
                      <div className="w-32 h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(inst.avg / 5) * 100}%`,
                            backgroundColor: "#0f172a",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
        active
          ? "bg-[#0f172a]/10 text-[#0f172a]"
          : "text-neutral-700 hover:bg-neutral-100"
      }`}
    >
      {icon}
      {label}
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
          className={
            n <= value ? "fill-yellow-400 text-yellow-400" : "text-neutral-300"
          }
        />
      ))}
    </div>
  );
}
