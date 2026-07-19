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
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-neutral-300 rounded px-3 py-3 text-sm outline-none focus:border-[#00BCD4] placeholder:text-neutral-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-neutral-300 rounded px-3 py-3 text-sm outline-none focus:border-[#00BCD4] placeholder:text-neutral-400"
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
          style={{ backgroundColor: "#00BCD4" }}
        >
          {loading ? "CREATING..." : "CREATE ACCOUNT"}
        </button>
        <p className="text-center text-sm text-neutral-600 mt-2">
          Already have an account?{" "}
          <Link to="/login" className="font-medium" style={{ color: "#00BCD4" }}>
            Log in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
