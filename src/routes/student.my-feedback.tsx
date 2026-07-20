import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import bueLogo from "@/assets/bue-logo.png.asset.json";
import { LayoutDashboard, PencilLine, ClipboardList, LogOut, Star } from "lucide-react";

export const Route = createFileRoute("/student/my-feedback")({
  head: () => ({ meta: [{ title: "Feedback Feed | BUE Feedback Portal" }] }),
  component: MyFeedbackPage,
});

type FeedbackRow = {
  id: string;
  user_id: string;
  feedback_type: string;
  rating: number;
  comment: string | null;
  created_at: string;
  is_anonymous: boolean;
  modules?: { module_name: string } | null;
  profiles?: { full_name: string | null; email: string | null } | null;
};

function MyFeedbackPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);
  const [tab, setTab] = useState<"mine" | "community">("mine");
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate({ to: "/login" });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", data.user.id);
      if (roles?.some((r) => r.role === "admin")) {
        navigate({ to: "/admin" });
        return;
      }
      setUser({ id: data.user.id, email: data.user.email ?? null });
    })();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    (async () => {
      let query = supabase
        .from("feedback")
        .select(
          "id, user_id, feedback_type, rating, comment, created_at, is_anonymous, modules(module_name), profiles(full_name, email)",
        )
        .order("created_at", { ascending: false });
      if (tab === "mine") query = query.eq("user_id", user.id);
      const { data } = await query;
      setItems((data as FeedbackRow[]) ?? []);
      setLoading(false);
    })();
  }, [tab, user]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  const displayName = user?.email?.split("@")[0] ?? "Student";

  return (
    <div className="min-h-screen bg-neutral-100 p-2 sm:p-4">
      <div className="mx-auto max-w-[1400px] bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[calc(100vh-2rem)]">
        <aside className="lg:w-64 border-b lg:border-b-0 lg:border-r border-neutral-200 flex flex-col">
          <div className="p-6 flex items-center gap-2">
            <img src={bueLogo.url} alt="BUE" className="h-8 w-auto" />
            <span className="font-bold text-neutral-900 text-sm">BUE Feedback Portal</span>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            <Link to="/student"><NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" /></Link>
            <Link to="/student/feedback"><NavItem icon={<PencilLine size={18} />} label="Submit Feedback" /></Link>
            <Link to="/student/my-feedback"><NavItem icon={<ClipboardList size={18} />} label="My Feedback" active /></Link>
            <button onClick={signOut} className="w-full text-left">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 text-sm font-medium">
                <LogOut size={18} /> Log out
              </div>
            </button>
          </nav>
          <div className="p-4 border-t border-neutral-200 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#00BCD4] text-white flex items-center justify-center font-semibold shrink-0">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate capitalize">{displayName}</p>
              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-6">Feedback Feed</h1>

          <div className="flex gap-1 border-b border-neutral-200 mb-6">
            <TabButton active={tab === "mine"} onClick={() => setTab("mine")}>My Feedback</TabButton>
            <TabButton active={tab === "community"} onClick={() => setTab("community")}>Community Feedback</TabButton>
          </div>

          {loading ? (
            <p className="text-sm text-neutral-500">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-neutral-500">
              {tab === "mine" ? "You haven't submitted any feedback yet." : "No community feedback yet."}
            </p>
          ) : (
            <div className="space-y-4">
              {items.map((f) => {
                const author = f.is_anonymous
                  ? "Anonymous Student"
                  : f.profiles?.full_name || f.profiles?.email?.split("@")[0] || "Student";
                return (
                  <article key={f.id} className="border border-neutral-200 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-semibold text-neutral-900">
                          {f.modules?.module_name ?? "General Feedback"}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5 capitalize">by {author}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Stars value={f.rating} />
                        <CategoryBadge type={f.feedback_type} />
                        <span className="text-xs text-neutral-500">
                          {new Date(f.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {f.comment && (
                      <p className="mt-3 text-sm text-neutral-700 whitespace-pre-wrap">{f.comment}</p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active ? "border-[#00BCD4] text-[#00BCD4]" : "border-transparent text-neutral-600 hover:text-neutral-900"
      }`}
    >
      {children}
    </button>
  );
}

function NavItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
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

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={14} className={n <= value ? "fill-yellow-400 text-yellow-400" : "text-neutral-300"} />
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
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[type] ?? colors.general}`}>
      {label}
    </span>
  );
}
