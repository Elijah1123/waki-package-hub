import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  ArrowLeft,
  Home,
  LogOut,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  UserCog,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import {
  BUSINESS,
  KENYAN_PHONE,
  ksh,
  type CartRow,
  type OrderRow,
  type ShippingZone,
} from "@/lib/waki";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My dashboard — Waki Packages" },
      {
        name: "description",
        content:
          "Manage your Waki Packages order list, delivery address, profile details and account security.",
      },
      { property: "og:title", content: "My dashboard — Waki Packages" },
      { property: "og:description", content: "Your orders, profile and delivery details." },
    ],
  }),
  component: DashboardPage,
});

type Tab = "orders" | "profile" | "security";

function DashboardPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("orders");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        const { data: created, error: insertError } = await supabase
          .from("profiles")
          .insert({ id: user!.id })
          .select("*")
          .single();
        if (insertError) throw insertError;
        return created;
      }
      return data;
    },
  });

  const { data: zones } = useQuery({
    queryKey: ["shipping-zones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_zones")
        .select("*")
        .order("fee_ksh", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ShippingZone[];
    },
  });

  const { data: cart } = useQuery({
    queryKey: ["cart", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("id, quantity, product_id, products(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CartRow[];
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
  });

  const zone = zones?.find((z) => z.id === profile?.shipping_zone_id) ?? null;
  const subtotal = (cart ?? []).reduce(
    (sum, row) => sum + (row.products?.price_ksh ?? 0) * row.quantity,
    0,
  );
  const shipping = subtotal > 0 ? (zone?.fee_ksh ?? 0) : 0;
  const total = subtotal + shipping;

  const refreshCart = () => {
    queryClient.invalidateQueries({ queryKey: ["cart"] });
    queryClient.invalidateQueries({ queryKey: ["cart-count"] });
  };

  const setQuantity = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase.from("cart_items").delete().eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refreshCart,
    onError: () => toast.error("Could not update the item"),
  });

  const checkout = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No session");
      if (!cart || cart.length === 0) throw new Error("Your order list is empty");
      const address = (profile?.delivery_address as string | null)?.trim();
      if (!address) throw new Error("Add your delivery address in Profile settings first");
      if (!profile?.accepted_terms) throw new Error("Please accept the Terms & Conditions first");

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          subtotal_ksh: subtotal,
          shipping_ksh: shipping,
          total_ksh: total,
          delivery_address: address,
          shipping_area: zone?.area_name ?? null,
          phone: (profile?.phone as string | null) ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;

      const items = cart.map((row) => ({
        order_id: order.id,
        product_id: row.product_id,
        product_name: row.products?.name ?? "Item",
        unit_price_ksh: row.products?.price_ksh ?? 0,
        quantity: row.quantity,
      }));
      const { error: itemsError } = await supabase.from("order_items").insert(items);
      if (itemsError) throw itemsError;

      const { error: clearError } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);
      if (clearError) throw clearError;
      return order.id;
    },
    onSuccess: () => {
      refreshCart();
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success(
        `Order placed. Send ${ksh(total)} by M-Pesa to ${BUSINESS.phone}, then add the reference below.`,
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-2xl">My dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {(profile?.full_name as string | null) || user?.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Home className="size-4" /> Back to home page
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-secondary"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap gap-2">
          <TabButton active={tab === "orders"} onClick={() => setTab("orders")} icon={<ShoppingBag className="size-4" />}>
            Orders
          </TabButton>
          <TabButton active={tab === "profile"} onClick={() => setTab("profile")} icon={<UserCog className="size-4" />}>
            Profile settings
          </TabButton>
          <TabButton active={tab === "security"} onClick={() => setTab("security")} icon={<ShieldCheck className="size-4" />}>
            Privacy &amp; security
          </TabButton>
        </div>

        {tab === "orders" ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <section className="surface-card p-5">
              <h2 className="text-xl">Current order</h2>
              {!cart || cart.length === 0 ? (
                <div className="mt-4 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Your order list is empty.
                  <Link to="/" className="ml-1 font-semibold text-primary hover:underline">
                    Browse products
                  </Link>
                </div>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {cart.map((row) => {
                    return (
                      <li key={row.id} className="flex items-center gap-3 py-3">
                        <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
                          <ProductImg
                            imageKey={row.products?.image_key}
                            alt={row.products?.name ?? ""}
                            className="size-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{row.products?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {ksh(row.products?.price_ksh ?? 0)} {row.products?.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label="Reduce quantity"
                            onClick={() =>
                              setQuantity.mutate({ id: row.id, quantity: row.quantity - 1 })
                            }
                            className="rounded-md border border-border p-1.5 hover:bg-secondary"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">
                            {row.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() =>
                              setQuantity.mutate({ id: row.id, quantity: row.quantity + 1 })
                            }
                            className="rounded-md border border-border p-1.5 hover:bg-secondary"
                          >
                            <Plus className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Remove item"
                            onClick={() => setQuantity.mutate({ id: row.id, quantity: 0 })}
                            className="ml-1 rounded-md border border-border p-1.5 text-destructive hover:bg-secondary"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                        <p className="w-24 text-right text-sm font-semibold">
                          {ksh((row.products?.price_ksh ?? 0) * row.quantity)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="surface-card h-fit p-5">
              <h2 className="text-xl">Summary</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-semibold">{ksh(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping{zone ? ` (${zone.area_name})` : ""}</dt>
                  <dd className="font-semibold">{shipping === 0 ? "Free" : ksh(shipping)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base">
                  <dt>Grand total</dt>
                  <dd className="font-semibold text-primary">{ksh(total)}</dd>
                </div>
              </dl>
              <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                <Truck className="mt-0.5 size-3.5 shrink-0" />
                Delivery is free within {BUSINESS.freeDeliveryArea}. Choose your area in Profile
                settings to see your delivery fee.
              </p>
              <button
                type="button"
                onClick={() => checkout.mutate()}
                disabled={checkout.isPending || !cart || cart.length === 0}
                className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {checkout.isPending ? "Placing order..." : "Checkout with M-Pesa"}
              </button>
              <p className="mt-2 text-xs text-muted-foreground">
                Pay by M-Pesa to {BUSINESS.phone}, then add your M-Pesa code to the order below so
                we can confirm it.
              </p>
            </section>

            <section className="surface-card p-5 lg:col-span-2">
              <h2 className="text-xl">My orders</h2>
              {!orders || orders.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {orders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}

        {tab === "profile" ? (
          <ProfileSettings profile={profile} zones={zones ?? []} userId={user?.id} />
        ) : null}

        {tab === "security" ? <SecuritySettings profile={profile} userId={user?.id} /> : null}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:bg-secondary"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function OrderCard({ order }: { order: OrderRow }) {
  const queryClient = useQueryClient();
  const [reference, setReference] = useState(order.mpesa_reference ?? "");

  const { data: items } = useQuery({
    queryKey: ["order-items", order.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("id, product_name, quantity, unit_price_ksh")
        .eq("order_id", order.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const saveReference = useMutation({
    mutationFn: async () => {
      const code = reference.trim().toUpperCase();
      if (code.length < 6) throw new Error("Enter the M-Pesa confirmation code");
      const { error } = await supabase
        .from("orders")
        .update({ mpesa_reference: code })
        .eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success("Thank you — we will confirm your payment shortly.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">
            Order #{order.id.slice(0, 8).toUpperCase()} · {ksh(order.total_ksh)}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleString("en-KE")} · {order.delivery_address}
          </p>
        </div>
        <div className="flex gap-2 text-xs font-semibold">
          <span className="rounded-full bg-secondary px-3 py-1">{order.status}</span>
          <span
            className={`rounded-full px-3 py-1 ${
              order.payment_status === "Paid"
                ? "bg-success text-success-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {order.payment_status}
          </span>
        </div>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
        {(items ?? []).map((item) => (
          <li key={item.id}>
            {item.quantity} × {item.product_name} — {ksh(item.unit_price_ksh * item.quantity)}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        Subtotal {ksh(order.subtotal_ksh)} · Shipping{" "}
        {order.shipping_ksh === 0 ? "Free" : ksh(order.shipping_ksh)}
      </p>
      {order.payment_status !== "Paid" ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="M-Pesa code e.g. SLK7H2J9QP"
            className="w-56 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => saveReference.mutate()}
            disabled={saveReference.isPending}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
          >
            Submit payment code
          </button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          M-Pesa reference: {order.mpesa_reference}
        </p>
      )}
    </div>
  );
}

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z.string().trim().regex(KENYAN_PHONE, "Enter a valid Kenyan phone number"),
  delivery_address: z
    .string()
    .trim()
    .min(5, "Describe your exact delivery location")
    .max(300),
  avatar_url: z.string().trim().url("Enter a valid image link").max(500).or(z.literal("")),
});

type ProfileRecord = {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  delivery_address: string | null;
  shipping_zone_id: string | null;
  accepted_terms: boolean;
} | null | undefined;

function ProfileSettings({
  profile,
  zones,
  userId,
}: {
  profile: ProfileRecord;
  zones: ShippingZone[];
  userId: string | undefined;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    delivery_address: "",
    avatar_url: "",
    shipping_zone_id: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      delivery_address: profile.delivery_address ?? "",
      avatar_url: profile.avatar_url ?? "",
      shipping_zone_id: profile.shipping_zone_id ?? "",
    });
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = profileSchema.safeParse(form);
      if (!parsed.success) {
        const out: Record<string, string> = {};
        for (const issue of parsed.error.issues) out[String(issue.path[0])] = issue.message;
        setErrors(out);
        throw new Error("INVALID");
      }
      setErrors({});
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: parsed.data.full_name,
          phone: parsed.data.phone,
          delivery_address: parsed.data.delivery_address,
          avatar_url: parsed.data.avatar_url || null,
          shipping_zone_id: form.shipping_zone_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    },
    onError: (error: Error) => {
      if (error.message !== "INVALID") toast.error("Could not save your profile");
    },
  });

  const selectedZone = zones.find((z) => z.id === form.shipping_zone_id);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
      <section className="surface-card p-5">
        <h2 className="text-xl">Profile settings</h2>
        <div className="mt-4 flex items-center gap-4">
          <div className="size-16 overflow-hidden rounded-full bg-secondary">
            {form.avatar_url ? (
              <img
                src={form.avatar_url}
                alt="Profile picture"
                className="size-full object-cover"
                width={64}
                height={64}
              />
            ) : (
              <div className="flex size-full items-center justify-center text-lg font-semibold text-muted-foreground">
                {(form.full_name || "?").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium" htmlFor="avatar_url">
              Profile picture link
            </label>
            <input
              id="avatar_url"
              value={form.avatar_url}
              onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {errors["avatar_url"] ? (
              <p className="mt-1 text-xs text-destructive">{errors["avatar_url"]}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium" htmlFor="full_name">
              Full name
            </label>
            <input
              id="full_name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {errors["full_name"] ? (
              <p className="mt-1 text-xs text-destructive">{errors["full_name"]}</p>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="phone">
              Phone number
            </label>
            <input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="07XXXXXXXX"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {errors["phone"] ? <p className="mt-1 text-xs text-destructive">{errors["phone"]}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Save changes
          </button>
        </div>
      </section>

      <section className="surface-card p-5">
        <h2 className="text-xl">Delivery</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium" htmlFor="delivery_address">
              Exact delivery location
            </label>
            <textarea
              id="delivery_address"
              rows={3}
              value={form.delivery_address}
              onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
              placeholder="e.g. Kiria-ini Town, next to the market, shop 12"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {errors["delivery_address"] ? (
              <p className="mt-1 text-xs text-destructive">{errors["delivery_address"]}</p>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="zone">
              Delivery area
            </label>
            <select
              id="zone"
              value={form.shipping_zone_id}
              onChange={(e) => setForm({ ...form, shipping_zone_id: e.target.value })}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select your area</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.area_name} — {zone.fee_ksh === 0 ? "Free delivery" : ksh(zone.fee_ksh)}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-muted-foreground">
              {selectedZone
                ? selectedZone.fee_ksh === 0
                  ? "Free delivery in this area."
                  : `Delivery fee: ${ksh(selectedZone.fee_ksh)}`
                : `Delivery is free within ${BUSINESS.freeDeliveryArea}.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Save delivery details
          </button>
        </div>
      </section>
    </div>
  );
}

function SecuritySettings({
  profile,
  userId,
}: {
  profile: ProfileRecord;
  userId: string | undefined;
}) {
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePassword = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 6) throw new Error("New password must be at least 6 characters");
      if (newPassword !== confirmPassword) throw new Error("The new passwords do not match");
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        ...(currentPassword ? { current_password: currentPassword } : {}),
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleTerms = useMutation({
    mutationFn: async (accepted: boolean) => {
      const { error } = await supabase
        .from("profiles")
        .update({ accepted_terms: accepted })
        .eq("id", userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Could not update your preference"),
  });

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <section className="surface-card p-5">
        <h2 className="text-xl">Change password</h2>
        <div className="mt-4 space-y-3">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => changePassword.mutate()}
            disabled={changePassword.isPending}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Update password
          </button>
        </div>
      </section>

      <section className="surface-card p-5">
        <h2 className="text-xl">Terms &amp; Conditions</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Read our{" "}
          <Link to="/terms" className="font-semibold text-primary hover:underline">
            Terms &amp; Conditions
          </Link>
          . You need to accept them before checking out.
        </p>
        <label className="mt-4 flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={!!profile?.accepted_terms}
            onChange={(e) => toggleTerms.mutate(e.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span>I have read and accept the Terms &amp; Conditions.</span>
        </label>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to home page
        </Link>
      </section>
    </div>
  );
}
