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
  BookOpen,
  Award,
  ShieldCheck, } from "lucide-react";

const BUE_LOGO_URL = "/bue-logo.png";

export const Route = createFileRoute("/student/module/$moduleId")({
  head: () => ({
    meta: [{ title: "Module Details | BUE Feedback Portal" }],
  }),
  component: ModuleDetailsPage,
});

type ModuleRow = {
  id: string;
  module_name: string;
  category: string | null;
  description: string | null;
  credit_hours: number | null;
};

type InstructorRow = {
  id: string;
  name: string;
  title: string | null;
  module_id: string | null;
};

type CourseworkRow = {
  id: string;
  title: string;
  type: string;
  weight: number | null;
  module_id: string;
};

type FeedbackRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  feedback_type: string;
  is_anonymous: boolean;
  user_id: string;
};

type ProfileInfo = { full_name: string | null; email: string | null };

function ModuleDetailsPage() {
  const navigate = useNavigate();
  const { moduleId } = Route.useParams();
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [module_, setModule] = useState<ModuleRow | null>(null);
  const [instructor, setInstructor] = useState<InstructorRow | null>(null);
  const [coursework, setCoursework] = useState<CourseworkRow[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileInfo>>({});
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

      const { data: modData } = await supabase
        .from("modules")
        .select("*")
        .eq("id", moduleId)
        .single();
      setModule((modData as ModuleRow) ?? null);

      const { data: instrData } = await supabase
        .from("instructors")
        .select("*")
        .eq("module_id", moduleId)
        .single();
      setInstructor((instrData as InstructorRow) ?? null);

      const { data: cwData } = await supabase
        .from("coursework")
        .select("*")
        .eq("module_id", moduleId)
        .order("type");
      setCoursework((cwData as CourseworkRow[]) ?? []);

      const { data: fbData } = await supabase
        .from("feedback")
        .select(
          "id, rating, comment, created_at, feedback_type, is_anonymous, user_id",
        )
        .eq("module_id", moduleId)
        .order("created_at", { ascending: false })
        .limit(5);
      const rows = (fbData as FeedbackRow[]) ?? [];
      setFeedback(rows);

      const ids = Array.from(
        new Set(rows.filter((r) => !r.is_anonymous).map((r) => r.user_id)),
      );
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", ids);
        const map: Record<string, ProfileInfo> = {};
        (profs ?? []).forEach((p) => {
          map[p.id] = { full_name: p.full_name, email: p.email };
        });
        setProfiles(map);
      }

      setLoading(false);
    })();
  }, [navigate, moduleId]);

  const stats = useMemo(() => {
    const total = feedback.length;
    const avg = total
      ? (feedback.reduce((s, f) => s + f.rating, 0) / total).toFixed(1)
      : "0.0";
    const latest = feedback[0]
      ? new Date(feedback[0].created_at).toLocaleDateString()
      : "—";
    return { total, avg, latest };
  }, [feedback]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  const displayName = user?.email?.split("@")[0] ?? "Student";

  const cwTypeColors: Record<string, string> = {
    exam: "bg-red-100 text-red-700",
    quiz: "bg-blue-100 text-blue-700",
    assignment: "bg-green-100 text-green-700",
    project: "bg-purple-100 text-purple-700",
    lab: "bg-orange-100 text-orange-700",
    midterm: "bg-yellow-100 text-yellow-700",
    final: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-2 sm:p-4">
      <div className="mx-auto max-w-[1400px] bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[calc(100vh-2rem)]">
        {/* Sidebar */}
        <aside className="lg:w-64 border-b lg:border-b-0 lg:border-r border-neutral-200 flex flex-col">
          <div className="p-6 flex items-center gap-2">
            <div className="bg-white p-2 rounded-lg shadow-sm flex items-center justify-center">
              <img src={BUE_LOGO_URL} alt="BUE" className="h-8 w-auto object-contain" />
            </div>
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
              <NavItem icon={<Trophy size={18} />} label="Instructor Rankings" />
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
          {loading ? (
            <p className="text-sm text-neutral-500">Loading…</p>
          ) : !module_ ? (
            <p className="text-sm text-neutral-500">Module not found.</p>
          ) : (
            <>
              {/* Header */}
              <header className="mb-6">
                <div className="flex items-center gap-3 flex-wrap">
                  <BookOpen size={28} style={{ color: "#0f172a" }} />
                  <h1 className="text-2xl font-bold text-neutral-900">
                    {module_.module_name}
                  </h1>
                  {module_.category && (
                    <CategoryBadge type={module_.category} />
                  )}
                </div>
                {module_.description && (
                  <p className="text-sm text-neutral-600 mt-2">
                    {module_.description}
                  </p>
                )}
              </header>

              {/* Instructor Card */}
              {instructor && (
                <div className="border border-neutral-200 rounded-xl p-5 mb-6">
                  <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                    Instructor
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-[#0f172a] text-white flex items-center justify-center text-xl font-bold shrink-0">
                      {instructor.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-900">
                        {instructor.name}
                      </p>
                      {instructor.title && (
                        <p className="text-sm text-neutral-500">
                          {instructor.title}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-pink-100 rounded-xl p-5">
                  <p className="text-2xl font-bold text-neutral-900">
                    {stats.avg}
                  </p>
                  <p className="text-sm text-neutral-700 mt-1">Average Rating</p>
                </div>
                <div className="bg-orange-100 rounded-xl p-5">
                  <p className="text-2xl font-bold text-neutral-900">
                    {stats.total}
                  </p>
                  <p className="text-sm text-neutral-700 mt-1">Total Reviews</p>
                </div>
                <div className="bg-purple-100 rounded-xl p-5">
                  <p className="text-2xl font-bold text-neutral-900">
                    {stats.latest}
                  </p>
                  <p className="text-sm text-neutral-700 mt-1">Latest Review</p>
                </div>
              </div>

              {/* Coursework Section */}
              {coursework.length > 0 && (
                <section className="border border-neutral-200 rounded-xl p-5 mb-6">
                  <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                    <Award size={20} style={{ color: "#0f172a" }} />
                    Coursework
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200">
                          <th className="text-left py-2.5 px-3 font-semibold text-neutral-700">
                            Title
                          </th>
                          <th className="text-left py-2.5 px-3 font-semibold text-neutral-700">
                            Type
                          </th>
                          <th className="text-left py-2.5 px-3 font-semibold text-neutral-700">
                            Weight
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {coursework.map((cw) => (
                          <tr key={cw.id}>
                            <td className="py-3 px-3 text-neutral-900 font-medium">
                              {cw.title}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                                  cwTypeColors[cw.type?.toLowerCase()] ??
                                  "bg-neutral-100 text-neutral-700"
                                }`}
                              >
                                {cw.type}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${cw.weight ?? 0}%`,
                                      backgroundColor: "#0f172a",
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-neutral-600">
                                  {cw.weight ?? 0}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Recent Reviews */}
              <section className="border border-neutral-200 rounded-xl p-5 mb-6">
                <h2 className="text-lg font-bold text-neutral-900 mb-4">
                  Recent Reviews
                </h2>
                {feedback.length === 0 ? (
                  <p className="text-sm text-neutral-500">
                    No reviews yet for this module.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {feedback.map((f) => {
                      const p = profiles[f.user_id];
                      const author = f.is_anonymous
                        ? "Anonymous Student"
                        : p?.full_name || p?.email?.split("@")[0] || "Student";
                      return (
                        <article
                          key={f.id}
                          className="border border-neutral-200 rounded-xl p-5"
                        >
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                              <p className="font-semibold text-neutral-900 capitalize">
                                {author}
                              </p>
                              <p className="text-xs text-neutral-500 mt-0.5">
                                {new Date(f.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Stars value={f.rating} />
                              <CategoryBadge type={f.feedback_type} />
                            </div>
                          </div>
                          {f.comment && (
                            <p className="mt-3 text-sm text-neutral-700 whitespace-pre-wrap">
                              {f.comment}
                            </p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Submit Feedback Button */}
              <Link
                to="/student/feedback"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium text-sm"
                style={{ backgroundColor: "#0f172a" }}
              >
                <PencilLine size={16} />
                Submit Feedback
              </Link>
            </>
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
