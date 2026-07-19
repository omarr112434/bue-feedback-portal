import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard | BUE" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

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
      setEmail(data.user.email ?? null);
      setChecking(false);
    })();
  }, [navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  if (checking) return null;

  return (
    <div className="min-h-screen bg-white p-6 sm:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900">
            Admin Dashboard
          </h1>
          <button
            onClick={signOut}
            className="text-sm font-medium px-4 py-2 rounded border border-neutral-300 hover:bg-neutral-50"
          >
            Sign out
          </button>
        </div>
        <p className="mt-2 text-neutral-600">Signed in as {email}.</p>
        <div
          className="mt-8 rounded-lg p-6 text-white"
          style={{ backgroundColor: "#00BCD4" }}
        >
          <h2 className="text-lg font-semibold">Administration</h2>
          <p className="mt-1 text-sm opacity-90">
            Feedback analytics and user management will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
