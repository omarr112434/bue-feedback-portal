import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  PencilLine,
  ClipboardList,
  LogOut,
  Bell,
  Star,
  Trophy,
} from "lucide-react";

const BUE_LOGO_URL = "https://upload.wikimedia.org/wikipedia/en/thumb/6/64/BUE_Logo.svg/512px-BUE_Logo.svg.png";

export const Route = createFileRoute("/student/feedback")({
  head: () => ({
    meta: [{ title: "Submit Feedback | BUE Feedback Portal" }],
  }),
  component: SubmitFeedback,
});

type ModuleRow = { id: string; module_name: string; category: string };
type InstructorInfo = { name: string; title: string } | null;

function SubmitFeedback() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(
    null,
  );
  const [modules, setModules] = useState<ModuleRow[]>([]);

  const [moduleId, setModuleId] = useState("");
  const [feedbackType, setFeedbackType] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [instructorRating, setInstructorRating] = useState(0);
  const [hoverInstructorRating, setHoverInstructorRating] = useState(0);
  const [instructor, setInstructor] = useState<InstructorInfo>(null);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

      const { data: mods } = await supabase
        .from("modules")
        .select("id, module_name, category")
        .order("module_name");
      setModules((mods as ModuleRow[]) ?? []);
    })();
  }, [navigate]);

  // Fetch instructor when module changes
  useEffect(() => {
    if (!moduleId) { setInstructor(null); return; }
    (async () => {
      const { data } = await supabase
        .from("instructors")
        .select("name, title")
        .eq("module_id", moduleId)
        .maybeSingle();
      setInstructor(data as InstructorInfo);
    })();
  }, [moduleId]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    const errs: Record<string, string> = {};
    if (!moduleId) errs.moduleId = "Please select a module";
    if (!feedbackType) errs.feedbackType = "Please select a feedback type";
    if (!rating) errs.rating = "Please provide a rating";
    if (!comment.trim()) errs.comment = "Please share your feedback";
    else if (comment.trim().length < 10)
      errs.comment = "Feedback must be at least 10 characters";
    setErrors(errs);
    if (Object.keys(errs).length > 0 || !user) return;

    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      module_id: moduleId,
      feedback_type: feedbackType,
      rating,
      instructor_rating: instructorRating || null,
      comment: comment.trim(),
      is_anonymous: anonymous,
    });
    setSubmitting(false);
    if (error) {
      setSubmitError(error.message || "Failed to submit feedback");
      return;
    }
    navigate({ to: "/student/feedback-success" });
  }

  const displayName = user?.email?.split("@")[0] ?? "Student";

  return (
    <div className="min-h-screen bg-neutral-100 p-2 sm:p-4">
      <div className="mx-auto max-w-[1400px] bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[calc(100vh-2rem)]">
        {/* Sidebar */}
        <aside className="lg:w-64 border-b lg:border-b-0 lg:border-r border-neutral-200 flex flex-col">
          <div className="p-6 flex items-center gap-2">
            <img src={BUE_LOGO_URL} alt="BUE" className="h-8 w-auto" />
            <span className="font-bold text-neutral-900 text-sm">
              BUE Feedback Portal
            </span>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            <Link to="/student" className="block">
              <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" />
            </Link>
            <NavItem
              icon={<PencilLine size={18} />}
              label="Submit Feedback"
              active
            />
            <Link to="/student" hash="my-feedback" className="block">
              <NavItem
                icon={<ClipboardList size={18} />}
                label="My Feedback"
              />
            </Link>
            <Link to="/student/instructor-rankings" className="block">
              <NavItem
                icon={<Trophy size={18} />}
                label="Instructor Rankings"
              />
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
            <h1 className="text-2xl font-bold text-neutral-900">
              Submit Feedback
            </h1>
            <button className="p-2 rounded-full hover:bg-neutral-100 relative">
              <Bell size={20} className="text-neutral-600" />
            </button>
          </header>

          <form
            onSubmit={handleSubmit}
            className="max-w-2xl border border-neutral-200 rounded-xl p-5 sm:p-8 space-y-6"
          >
            {/* Module */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Select Module <span className="text-red-500">*</span>
              </label>
              <select
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00BCD4] ${
                  errors.moduleId ? "border-red-400" : "border-neutral-300"
                }`}
              >
                <option value="">-- Choose a module --</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.module_name}
                  </option>
                ))}
              </select>
              {errors.moduleId && (
                <p className="mt-1 text-xs text-red-600">{errors.moduleId}</p>
              )}
            </div>

            {/* Feedback type */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Feedback Type <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-4">
                {["module", "instructor", "general"].map((t) => (
                  <label
                    key={t}
                    className="inline-flex items-center gap-2 cursor-pointer text-sm text-neutral-700"
                  >
                    <input
                      type="radio"
                      name="feedback_type"
                      value={t}
                      checked={feedbackType === t}
                      onChange={(e) => setFeedbackType(e.target.value)}
                      className="accent-[#00BCD4]"
                    />
                    <span className="capitalize">{t}</span>
                  </label>
                ))}
              </div>
              {errors.feedbackType && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.feedbackType}
                </p>
              )}
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Rating <span className="text-red-500">*</span>
              </label>
              <div
                className="flex items-center gap-1"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((n) => {
                  const active = (hoverRating || rating) >= n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHoverRating(n)}
                      className="p-1"
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    >
                      <Star
                        size={28}
                        className={
                          active
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-neutral-300"
                        }
                      />
                    </button>
                  );
                })}
              </div>
              {errors.rating && (
                <p className="mt-1 text-xs text-red-600">{errors.rating}</p>
              )}
            </div>

            {/* Instructor Rating */}
            {instructor && (
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Rate Instructor: {instructor.title} {instructor.name}
                </label>
                <div
                  className="flex items-center gap-1"
                  onMouseLeave={() => setHoverInstructorRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = (hoverInstructorRating || instructorRating) >= n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setInstructorRating(n)}
                        onMouseEnter={() => setHoverInstructorRating(n)}
                        className="p-1"
                        aria-label={`${n} instructor star${n > 1 ? "s" : ""}`}
                      >
                        <Star
                          size={28}
                          className={
                            active
                              ? "fill-purple-400 text-purple-400"
                              : "text-neutral-300"
                          }
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-neutral-500">Optional — rate the instructor separately</p>
              </div>
            )}

            {/* Comment */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Your Feedback <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                placeholder="Share your experience with this module..."
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4] ${
                  errors.comment ? "border-red-400" : "border-neutral-300"
                }`}
              />
              {errors.comment && (
                <p className="mt-1 text-xs text-red-600">{errors.comment}</p>
              )}
            </div>

            {/* Anonymous */}
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="accent-[#00BCD4] h-4 w-4"
              />
              Submit Anonymously
            </label>

            {submitError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {submitError}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate({ to: "/student" })}
                className="px-5 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 font-medium text-sm hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-60"
                style={{ backgroundColor: "#00BCD4" }}
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </form>
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
          ? "bg-[#00BCD4]/10 text-[#00BCD4]"
          : "text-neutral-700 hover:bg-neutral-100"
      }`}
    >
      {icon}
      {label}
    </div>
  );
}
