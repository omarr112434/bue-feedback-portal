import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/AuthCard";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login | BUE Student Feedback Portal" },
      { name: "description", content: "Sign in to the BUE Student Feedback Portal." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError || !data.user) {
      setLoading(false);
      setError("Invalid email or password");
      return;
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    setLoading(false);
    const isAdmin = roles?.some((r) => r.role === "admin");
    navigate({ to: isAdmin ? "/admin" : "/student" });
  }

  return (
    <AuthCard subtitle="Welcome to Student Feedback Portal" title="Log in">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600 tracking-wide uppercase">Email Address</label>
          <input
            type="email"
            placeholder="you@bue.edu.eg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-classic"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600 tracking-wide uppercase">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-classic"
          />
        </div>
        {error && (
          <p className="text-sm text-red-700 text-center" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-navy w-full py-3 mt-2 text-sm"
        >
          {loading ? "SIGNING IN..." : "SIGN IN"}
        </button>
        <p className="text-center text-sm text-slate-600 mt-2">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-red-700 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
