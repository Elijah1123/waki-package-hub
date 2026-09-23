import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BUSINESS } from "@/lib/waki";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Waki Packages" },
      {
        name: "description",
        content:
          "Ordering, payment, delivery and privacy terms for customers buying packaging products from Waki Packages.",
      },
      { property: "og:title", content: "Terms & Conditions — Waki Packages" },
      {
        property: "og:description",
        content: "How ordering, M-Pesa payment and delivery work at Waki Packages.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="text-4xl">Terms &amp; Conditions</h1>
        <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted-foreground">
          <p>
            By placing an order with {BUSINESS.name} you agree to the terms below. Prices are
            in Kenyan Shillings and may change without notice.
          </p>
          <div>
            <h2 className="text-lg text-foreground">Orders</h2>
            <p className="mt-2">
              An order is confirmed once payment is received. You may edit or remove items
              from your order list any time before checkout.
            </p>
          </div>
          <div>
            <h2 className="text-lg text-foreground">Payment</h2>
            <p className="mt-2">
              Payment is made by M-Pesa to {BUSINESS.phone}. Please keep your M-Pesa
              confirmation message and add the reference to your order so we can verify it.
            </p>
          </div>
          <div>
            <h2 className="text-lg text-foreground">Delivery</h2>
            <p className="mt-2">
              Delivery within {BUSINESS.freeDeliveryArea} is free. Outside Kiria-ini Town a
              delivery fee applies based on your area, and is shown before you check out.
            </p>
          </div>
          <div>
            <h2 className="text-lg text-foreground">Privacy</h2>
            <p className="mt-2">
              We only use your name, phone number and delivery address to process and
              deliver your orders. We never sell your details.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
