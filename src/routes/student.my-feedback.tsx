import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, PencilLine, ClipboardList, LogOut, Star, Trophy, ThumbsUp, ThumbsDown, ShieldCheck } from "lucide-react";

const BUE_LOGO_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Ctext x='50%25' y='50%25' font-size='24' font-weight='bold' font-family='sans-serif' text-anchor='middle' dominant-baseline='middle' fill='%2300BCD4'%3EBUE%3C/text%3E%3C/svg%3E";

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
};

type ProfileInfo = { full_name: string | null; email: string | null };

function MyFeedbackPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<"mine" | "community">("mine");
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileInfo>>({});
  const [loading, setLoading] = useState(true);
  const [reactions, setReactions] = useState<Record<string, { helpful: number; not_helpful: number; mine?: string }>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate({ to: "/login" });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", data.user.id);
      setIsAdmin(!!roles?.some((r) => r.role === "admin"));
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
          "id, user_id, feedback_type, rating, comment, created_at, is_anonymous, modules(module_name)",
        )
        .order("created_at", { ascending: false });
      if (tab === "mine") query = query.eq("user_id", user.id);
      const { data } = await query;
      const rows = (data as FeedbackRow[]) ?? [];
      setItems(rows);

      const ids = Array.from(
        new Set(rows.filter((r) => !r.is_anonymous).map((r) => r.user_id)),
      );
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles").select("id, full_name, email").in("id", ids);
        const map: Record<string, ProfileInfo> = {};
        (profs ?? []).forEach((p) => {
          map[p.id] = { full_name: p.full_name, email: p.email };
        });
        setProfiles(map);
      } else {
        setProfiles({});
      }

      // Fetch reactions
      const feedbackIds = rows.map((r) => r.id);
      if (feedbackIds.length) {
        const { data: rxns } = await supabase
          .from("reactions")
          .select("feedback_id, reaction_type, user_id")
          .in("feedback_id", feedbackIds);
        const rxnMap: Record<string, { helpful: number; not_helpful: number; mine?: string }> = {};
        (rxns ?? []).forEach((r: any) => {
          if (!rxnMap[r.feedback_id]) rxnMap[r.feedback_id] = { helpful: 0, not_helpful: 0 };
          if (r.reaction_type === "helpful") rxnMap[r.feedback_id].helpful++;
          else rxnMap[r.feedback_id].not_helpful++;
          if (user && r.user_id === user.id) rxnMap[r.feedback_id].mine = r.reaction_type;
        });
        setReactions(rxnMap);
      }
      setLoading(false);
    })();
  }, [tab, user]);

  async function toggleReaction(feedbackId: string, type: "helpful" | "not_helpful") {
    if (!user) return;
    const current = reactions[feedbackId]?.mine;
    if (current === type) {
      // Remove reaction
      await supabase.from("reactions").delete().eq("feedback_id", feedbackId).eq("user_id", user.id);
    } else {
      // Upsert reaction
      await supabase.from("reactions").upsert(
        { feedback_id: feedbackId, user_id: user.id, reaction_type: type },
        { onConflict: "feedback_id,user_id" }
      );
    }
    // Re-fetch reactions
    const { data: rxns } = await supabase
      .from("reactions")
      .select("feedback_id, reaction_type, user_id")
      .in("feedback_id", items.map((i) => i.id));
    const rxnMap: Record<string, { helpful: number; not_helpful: number; mine?: string }> = {};
    (rxns ?? []).forEach((r: any) => {
      if (!rxnMap[r.feedback_id]) rxnMap[r.feedback_id] = { helpful: 0, not_helpful: 0 };
      if (r.reaction_type === "helpful") rxnMap[r.feedback_id].helpful++;
      else rxnMap[r.feedback_id].not_helpful++;
      if (r.user_id === user.id) rxnMap[r.feedback_id].mine = r.reaction_type;
    });
    setReactions(rxnMap);
  }

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
            <img src={BUE_LOGO_URL} alt="BUE" className="h-8 w-auto" />
            <span className="font-bold text-neutral-900 text-sm">BUE Feedback Portal</span>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            <Link to="/student"><NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" /></Link>
            <Link to="/student/feedback"><NavItem icon={<PencilLine size={18} />} label="Submit Feedback" /></Link>
            <Link to="/student/my-feedback"><NavItem icon={<ClipboardList size={18} />} label="My Feedback" active /></Link>
            <Link to="/student/instructor-rankings"><NavItem icon={<Trophy size={18} />} label="Instructor Rankings" /></Link>
            {isAdmin && (
              <Link to="/admin" className="block">
                <NavItem icon={<ShieldCheck size={18} />} label="Admin Portal" />
              </Link>
            )}
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
                const p = profiles[f.user_id];
                const author = f.is_anonymous
                  ? "Anonymous Student"
                  : p?.full_name || p?.email?.split("@")[0] || "Student";
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
                    {/* Reaction buttons */}
                    <div className="mt-3 flex items-center gap-4 pt-2 border-t border-neutral-100">
                      <button
                        onClick={() => toggleReaction(f.id, "helpful")}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full transition-colors ${
                          reactions[f.id]?.mine === "helpful"
                            ? "bg-green-100 text-green-700"
                            : "bg-neutral-100 text-neutral-600 hover:bg-green-50"
                        }`}
                      >
                        <ThumbsUp size={14} /> Helpful {reactions[f.id]?.helpful ? `(${reactions[f.id].helpful})` : ""}
                      </button>
                      <button
                        onClick={() => toggleReaction(f.id, "not_helpful")}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full transition-colors ${
                          reactions[f.id]?.mine === "not_helpful"
                            ? "bg-red-100 text-red-700"
                            : "bg-neutral-100 text-neutral-600 hover:bg-red-50"
                        }`}
                      >
                        <ThumbsDown size={14} /> Not Helpful {reactions[f.id]?.not_helpful ? `(${reactions[f.id].not_helpful})` : ""}
                      </button>
                      {/* Sentiment badge */}
                      <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                        f.rating >= 4 ? "bg-green-100 text-green-700" : f.rating === 3 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                      }`}>
                        {f.rating >= 4 ? "Positive" : f.rating === 3 ? "Neutral" : "Negative"}
                      </span>
                    </div>
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
