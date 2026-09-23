import { createFileRoute } from "@tanstack/react-router";
import { Compass, Leaf, Target } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BUSINESS } from "@/lib/waki";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Waki Packages" },
      {
        name: "description",
        content:
          "Waki Packages produces quality, affordable packaging: paper bags, gift bags, branded book covers, charcoal briquettes, cake boxes, envelopes and popcorn bags.",
      },
      { property: "og:title", content: "About Waki Packages" },
      {
        property: "og:description",
        content: "Our story, mission and vision for sustainable packaging in Murang'a County.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-14">
        <h1 className="text-4xl">About Us</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          We produce quality, affordable packaging products, including paper bags, gift bags,
          branded book covers, charcoal briquettes, cake boxes, envelopes and popcorn bags.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="surface-card p-6">
            <Target className="size-6 text-primary" />
            <h2 className="mt-3 text-xl">Our Mission</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              To provide quality, affordable, and eco-friendly packaging solutions.
            </p>
          </div>
          <div className="surface-card p-6">
            <Compass className="size-6 text-primary" />
            <h2 className="mt-3 text-xl">Our Vision</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              To be a trusted leader in innovative and sustainable packaging.
            </p>
          </div>
        </div>

        <div className="surface-card mt-6 flex flex-col gap-2 p-6">
          <Leaf className="size-6 text-accent" />
          <h2 className="text-xl">Where to find us</h2>
          <p className="text-sm text-muted-foreground">{BUSINESS.location}</p>
          <p className="text-sm text-muted-foreground">Phone: {BUSINESS.phone}</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
