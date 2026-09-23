import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { BUSINESS } from "@/lib/waki";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Waki Packages" },
      {
        name: "description",
        content:
          "Call Waki Packages on 0725094498 or visit us behind Bingo Hardware, Kiria-ini Town, Murang'a County. Send us a message online.",
      },
      { property: "og:title", content: "Contact Waki Packages" },
      {
        property: "og:description",
        content: "Phone 0725094498 — Behind Bingo Hardware, Kiria-ini Town, Murang'a County.",
      },
    ],
  }),
  component: ContactPage,
});

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  message: z.string().trim().min(5, "Please write a short message").max(1000),
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const send = useMutation({
    mutationFn: async () => {
      const parsed = contactSchema.safeParse(form);
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          fieldErrors[String(issue.path[0])] = issue.message;
        }
        setErrors(fieldErrors);
        throw new Error("INVALID");
      }
      setErrors({});
      const { error } = await supabase.from("contact_messages").insert(parsed.data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Thank you! We have received your message.");
      setForm({ name: "", email: "", message: "" });
    },
    onError: (error: Error) => {
      if (error.message !== "INVALID") toast.error("Message could not be sent. Please try again.");
    },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-14">
        <h1 className="text-4xl">Contact Us</h1>
        <p className="mt-3 text-muted-foreground">
          We are happy to help with orders, bulk pricing and branding.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="surface-card p-6">
              <a
                href={`tel:${BUSINESS.phone}`}
                className="flex items-center gap-3 text-lg font-semibold"
              >
                <Phone className="size-5 text-primary" /> {BUSINESS.phone}
              </a>
              <p className="mt-4 flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                {BUSINESS.location}
              </p>
            </div>

            <div className="surface-card overflow-hidden">
              <div className="paper-texture flex aspect-video items-center justify-center bg-secondary text-center text-sm text-muted-foreground">
                <span className="px-6">
                  Map placeholder — Kiria-ini Town, Murang'a County
                  <br />
                  (behind Bingo Hardware)
                </span>
              </div>
            </div>
          </div>

          <form
            className="surface-card space-y-4 p-6"
            onSubmit={(e) => {
              e.preventDefault();
              send.mutate();
            }}
          >
            <h2 className="text-xl">Send us a message</h2>
            <div>
              <label className="text-sm font-medium" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Your full name"
              />
              {errors.name ? (
                <p className="mt-1 text-xs text-destructive">{errors.name}</p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="you@example.com"
              />
              {errors.email ? (
                <p className="mt-1 text-xs text-destructive">{errors.email}</p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="message">
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="How can we help?"
              />
              {errors.message ? (
                <p className="mt-1 text-xs text-destructive">{errors.message}</p>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={send.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <Send className="size-4" /> {send.isPending ? "Sending..." : "Send message"}
            </button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
