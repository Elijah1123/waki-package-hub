import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Leaf, Phone, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { BUSINESS, ksh, type Product } from "@/lib/waki";
import { ProductImg } from "@/components/ProductImg";
import heroImage from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Waki Packages — Packaging products in Kiria-ini, Murang'a" },
      {
        name: "description",
        content:
          "Order brown paper bags, gift bags, cake boxes, envelopes, popcorn bags, branded book covers and charcoal briquettes from Waki Packages. Free delivery within Kiria-ini Town.",
      },
      { property: "og:title", content: "Waki Packages — Packaging products in Kiria-ini" },
      {
        property: "og:description",
        content: "Quality, affordable and eco-friendly packaging. Prices in Ksh.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const addToCart = useMutation({
    mutationFn: async (product: Product) => {
      if (!user) throw new Error("NOT_SIGNED_IN");
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({ user_id: user.id, product_id: product.id, quantity: 1 });
        if (error) throw error;
      }
      return product.name;
    },
    onSuccess: (name) => {
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success(`${name} added to your order`);
    },
    onError: (error: Error) => {
      if (error.message === "NOT_SIGNED_IN") {
        toast.info("Please sign in to start an order");
        navigate({ to: "/auth" });
        return;
      }
      toast.error("Could not add the item. Please try again.");
    },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border">
        <img
          src={heroImage}
          alt="Assorted kraft paper packaging on a wooden table"
          className="absolute inset-0 size-full object-cover opacity-30"
          width={1600}
          height={912}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            <Leaf className="size-3" /> Eco-friendly packaging
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl leading-tight sm:text-5xl">
            Quality, affordable packaging from Kiria-ini Town
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            Paper bags, gift bags, cake boxes, envelopes, popcorn bags, branded book covers
            and charcoal briquettes — all priced in Kenyan Shillings.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="#products"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <ShoppingBag className="size-4" /> Shop products
            </a>
            <a
              href={`tel:${BUSINESS.phone}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
            >
              <Phone className="size-4" /> {BUSINESS.phone}
            </a>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="size-4" /> Free delivery within {BUSINESS.freeDeliveryArea}
          </p>
        </div>
      </section>

      <section id="products" className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl sm:text-3xl">Our products</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap Order to add an item to your order list.
            </p>
          </div>
          {user ? (
            <Link
              to="/dashboard"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:bg-secondary"
            >
              View my order
            </Link>
          ) : null}
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="surface-card h-80 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(products ?? []).map((product) => {
              return (
                <article key={product.id} className="surface-card flex flex-col overflow-hidden">
                  <div className="paper-texture aspect-[4/3] w-full bg-secondary">
                    <ProductImg
                      imageKey={product.image_key}
                      alt={product.name}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg">{product.name}</h3>
                    <p className="mt-1 flex-1 text-sm text-muted-foreground">
                      {product.description}
                    </p>
                    <p className="mt-4 text-xl font-semibold text-primary">
                      {ksh(product.price_ksh)}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        {product.unit}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => addToCart.mutate(product)}
                      disabled={addToCart.isPending}
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      <ShoppingBag className="size-4" /> Order
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
