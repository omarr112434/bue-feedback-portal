import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/student")({
  head: () => ({ meta: [{ title: "Student Dashboard | BUE" }] }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate({ to: "/login" });
      else setEmail(data.user.email ?? null);
    });
  }, [navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-white p-6 sm:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900">
            Student Dashboard
          </h1>
          <button
            onClick={signOut}
            className="text-sm font-medium px-4 py-2 rounded border border-neutral-300 hover:bg-neutral-50"
          >
            Sign out
          </button>
        </div>
        <p className="mt-2 text-neutral-600">Welcome{email ? `, ${email}` : ""}.</p>
        <div
          className="mt-8 rounded-lg p-6 text-white"
          style={{ backgroundColor: "#00BCD4" }}
        >
          <h2 className="text-lg font-semibold">Student Feedback Portal</h2>
          <p className="mt-1 text-sm opacity-90">
            Your feedback forms will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
