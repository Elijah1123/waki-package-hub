import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BUSINESS, KENYAN_PHONE } from "@/lib/waki";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create an account — Waki Packages" },
      {
        name: "description",
        content:
          "Sign in to Waki Packages to place packaging orders, track delivery and manage your profile.",
      },
      { property: "og:title", content: "Sign in — Waki Packages" },
      {
        property: "og:description",
        content: "Create an account to order packaging products from Waki Packages.",
      },
    ],
  }),
  component: AuthPage,
});

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z
    .string()
    .trim()
    .regex(KENYAN_PHONE, "Enter a valid Kenyan phone number, e.g. 0725094498"),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function afterAuth(userId: string) {
    await supabase.rpc("claim_admin");
    if (mode === "signup") {
      await supabase.from("profiles").upsert({
        id: userId,
        full_name: form.fullName.trim(),
        phone: form.phone.trim(),
      });
    }
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    navigate({ to: role ? "/admin" : "/dashboard", replace: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const parsed = signUpSchema.safeParse(form);
        if (!parsed.success) {
          setErrors(fieldErrors(parsed.error));
          return;
        }
        setErrors({});
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          toast.info("Check your email to confirm your account, then sign in.");
          setMode("signin");
          return;
        }
        toast.success("Welcome to Waki Packages!");
        await afterAuth(data.session.user.id);
      } else {
        const parsed = signInSchema.safeParse(form);
        if (!parsed.success) {
          setErrors(fieldErrors(parsed.error));
          return;
        }
        setErrors({});
        const { data, error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Signed in");
        await afterAuth(data.user.id);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Package className="size-5" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg font-semibold">
            {BUSINESS.name}
          </span>
        </Link>

        <div className="surface-card p-6">
          <h1 className="text-2xl">{mode === "signin" ? "Sign in" : "Create your account"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to place and track your orders."
              : "Sign up to order packaging and save your delivery address."}
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" ? (
              <>
                <Field
                  id="fullName"
                  label="Full name"
                  value={form.fullName}
                  error={errors["fullName"]}
                  onChange={(v) => setForm({ ...form, fullName: v })}
                  placeholder="Jane Wanjiru"
                />
                <Field
                  id="phone"
                  label="Phone number"
                  value={form.phone}
                  error={errors["phone"]}
                  onChange={(v) => setForm({ ...form, phone: v })}
                  placeholder="0712345678"
                />
              </>
            ) : null}
            <Field
              id="email"
              type="email"
              label="Email"
              value={form.email}
              error={errors["email"]}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="you@example.com"
            />
            <Field
              id="password"
              type="password"
              label="Password"
              value={form.password}
              error={errors["password"]}
              onChange={(v) => setForm({ ...form, password: v })}
              placeholder="At least 6 characters"
            />

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setErrors({});
              setMode(mode === "signin" ? "signup" : "signin");
            }}
            className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "signin"
              ? "New here? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </div>

        <Link
          to="/"
          className="mt-6 block text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Back to home page
        </Link>
      </div>
    </div>
  );
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0])] = issue.message;
  return out;
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
