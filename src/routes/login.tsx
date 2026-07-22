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
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-neutral-300 rounded px-3 py-3 text-sm outline-none focus:border-[#0f172a] placeholder:text-neutral-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-neutral-300 rounded px-3 py-3 text-sm outline-none focus:border-[#0f172a] placeholder:text-neutral-400"
        />
        {error && (
          <p className="text-sm text-red-600 text-center" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full text-white font-semibold tracking-wider py-3 rounded transition-opacity disabled:opacity-60"
          style={{ backgroundColor: "#0f172a" }}
        >
          {loading ? "SIGNING IN..." : "SIGN IN"}
        </button>
        <p className="text-center text-sm text-neutral-600 mt-2">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium" style={{ color: "#0f172a" }}>
            Register
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
