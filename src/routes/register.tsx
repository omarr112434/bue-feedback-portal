import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/AuthCard";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register | BUE Student Feedback Portal" },
      { name: "description", content: "Create your BUE Student Feedback Portal account." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
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
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }
    // Auto sign-in after signup (auto-confirm is on)
    const { data } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (data.user) navigate({ to: "/student" });
    else navigate({ to: "/login" });
  }

  return (
    <AuthCard subtitle="Create your account" title="Register">
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
            placeholder="At least 6 characters"
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
          {loading ? "CREATING..." : "CREATE ACCOUNT"}
        </button>
        <p className="text-center text-sm text-slate-600 mt-2">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-red-700 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
