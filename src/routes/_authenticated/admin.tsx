import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Home, ImagePlus, Package, Plus, Trash2, Truck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useSession } from "@/hooks/useSession";
import { ksh, type OrderRow, type Product, type ShippingZone } from "@/lib/waki";
import {
  PRODUCT_IMAGE_BUCKET,
  ProductImg,
  STORAGE_PREFIX,
} from "@/components/ProductImg";

async function uploadProductImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return `${STORAGE_PREFIX}${path}`;
}

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — Waki Packages" },
      {
        name: "description",
        content:
          "Manage Waki Packages products, prices, customer orders, delivery fees and registered users.",
      },
      { property: "og:title", content: "Admin dashboard — Waki Packages" },
      { property: "og:description", content: "Products, orders, users and shipping settings." },
    ],
  }),
  component: AdminPage,
});

type Tab = "products" | "orders" | "users" | "shipping";

function AdminPage() {
  const { user } = useSession();
  const { data: isAdmin, isLoading } = useIsAdmin(user?.id);
  const [tab, setTab] = useState<Tab>("products");

  if (isLoading) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Checking access...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="surface-card max-w-md p-8 text-center">
          <h1 className="text-2xl">Admin access only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This area is restricted to the Waki Packages administrator.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Go to my dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-2xl">Admin dashboard</h1>
            <p className="text-sm text-muted-foreground">Waki Packages management</p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Home className="size-4" /> Back to home page
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap gap-2">
          <AdminTab active={tab === "products"} onClick={() => setTab("products")} icon={<Package className="size-4" />}>
            Products
          </AdminTab>
          <AdminTab active={tab === "orders"} onClick={() => setTab("orders")} icon={<Truck className="size-4" />}>
            Orders
          </AdminTab>
          <AdminTab active={tab === "users"} onClick={() => setTab("users")} icon={<Users className="size-4" />}>
            Users
          </AdminTab>
          <AdminTab active={tab === "shipping"} onClick={() => setTab("shipping")} icon={<Truck className="size-4" />}>
            Shipping fees
          </AdminTab>
        </div>

        <div className="mt-6">
          {tab === "products" ? <ProductsPanel /> : null}
          {tab === "orders" ? <OrdersPanel /> : null}
          {tab === "users" ? <UsersPanel /> : null}
          {tab === "shipping" ? <ShippingPanel /> : null}
        </div>
      </div>
    </div>
  );
}

function AdminTab({
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

function ProductsPanel() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({ name: "", description: "", price: "", unit: "each" });

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const addProduct = useMutation({
    mutationFn: async () => {
      const price = Number(draft.price);
      if (draft.name.trim().length < 2) throw new Error("Enter a product name");
      if (!Number.isFinite(price) || price <= 0) throw new Error("Enter a valid price in Ksh");
      const { error } = await supabase.from("products").insert({
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        price_ksh: Math.round(price),
        unit: draft.unit.trim() || "each",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft({ name: "", description: "", price: "", unit: "each" });
      refresh();
      toast.success("Product added");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Product> }) => {
      const { error } = await supabase.from("products").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      toast.success("Product updated");
    },
    onError: () => toast.error("Could not update the product"),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      toast.success("Product deleted");
    },
    onError: () => toast.error("Could not delete the product"),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <section className="surface-card p-5">
        <h2 className="text-xl">Product listings</h2>
        <div className="mt-4 space-y-3">
          {(products ?? []).map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              onSave={(patch) => updateProduct.mutate({ id: product.id, patch })}
              onDelete={() => deleteProduct.mutate(product.id)}
            />
          ))}
        </div>
      </section>

      <section className="surface-card h-fit p-5">
        <h2 className="text-xl">Add a product</h2>
        <div className="mt-4 space-y-3">
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Product name"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <textarea
            rows={3}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Short description"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={draft.price}
            onChange={(e) => setDraft({ ...draft, price: e.target.value })}
            placeholder="Price in Ksh"
            inputMode="numeric"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={draft.unit}
            onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
            placeholder="Unit, e.g. each / per kg"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => addProduct.mutate()}
            disabled={addProduct.isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            <Plus className="size-4" /> Add product
          </button>
        </div>
      </section>
    </div>
  );
}

function ProductRow({
  product,
  onSave,
  onDelete,
}: {
  product: Product;
  onSave: (patch: Partial<Product>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price_ksh));
  const [unit, setUnit] = useState(product.unit);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="min-w-40 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        inputMode="numeric"
        className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
      <input
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        className="w-28 rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={product.is_active}
          onChange={(e) => onSave({ is_active: e.target.checked })}
          className="size-4 accent-primary"
        />
        Visible
      </label>
      <button
        type="button"
        onClick={() =>
          onSave({ name: name.trim(), price_ksh: Math.round(Number(price) || 0), unit: unit.trim() })
        }
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete product"
        className="rounded-lg border border-border p-2 text-destructive hover:bg-secondary"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

function OrdersPanel() {
  const queryClient = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { status?: string; payment_status?: string } }) => {
      const { error } = await supabase.from("orders").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order updated");
    },
    onError: () => toast.error("Could not update the order"),
  });

  return (
    <section className="surface-card p-5">
      <h2 className="text-xl">Incoming orders</h2>
      {!orders || orders.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {orders.map((order) => (
            <AdminOrderRow
              key={order.id}
              order={order}
              onPatch={(patch) => update.mutate({ id: order.id, patch })}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function AdminOrderRow({
  order,
  onPatch,
}: {
  order: OrderRow;
  onPatch: (patch: { status?: string; payment_status?: string }) => void;
}) {
  const { data: items } = useQuery({
    queryKey: ["admin-order-items", order.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("id, product_name, quantity, unit_price_ksh")
        .eq("order_id", order.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">
            #{order.id.slice(0, 8).toUpperCase()} · {ksh(order.total_ksh)}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleString("en-KE")}
            {order.phone ? ` · ${order.phone}` : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Deliver to: {order.delivery_address}
            {order.shipping_area ? ` (${order.shipping_area})` : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Subtotal {ksh(order.subtotal_ksh)} · Shipping{" "}
            {order.shipping_ksh === 0 ? "Free" : ksh(order.shipping_ksh)} · M-Pesa ref:{" "}
            {order.mpesa_reference ?? "—"}
          </p>
          <ul className="mt-2 text-xs text-muted-foreground">
            {(items ?? []).map((item) => (
              <li key={item.id}>
                {item.quantity} × {item.product_name}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <select
            value={order.status}
            onChange={(e) => onPatch({ status: e.target.value })}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {["Pending", "Shipped", "Delivered", "Cancelled"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={order.payment_status}
            onChange={(e) => onPatch({ payment_status: e.target.value })}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {["Awaiting payment", "Paid", "Failed"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function UsersPanel() {
  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, delivery_address, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <section className="surface-card p-5">
      <h2 className="text-xl">Registered users</h2>
      {!users || users.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No users yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2 pr-4">Delivery address</th>
                <th className="py-2">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 pr-4">{row.full_name ?? "—"}</td>
                  <td className="py-2 pr-4">{row.phone ?? "—"}</td>
                  <td className="py-2 pr-4">{row.delivery_address ?? "—"}</td>
                  <td className="py-2 text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString("en-KE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ShippingPanel() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({ area: "", fee: "" });

  const { data: zones } = useQuery({
    queryKey: ["admin-zones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_zones")
        .select("*")
        .order("fee_ksh", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ShippingZone[];
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-zones"] });
    queryClient.invalidateQueries({ queryKey: ["shipping-zones"] });
  };

  const addZone = useMutation({
    mutationFn: async () => {
      const fee = Number(draft.fee);
      if (draft.area.trim().length < 2) throw new Error("Enter an area name");
      if (!Number.isFinite(fee) || fee < 0) throw new Error("Enter a valid fee in Ksh");
      const { error } = await supabase
        .from("shipping_zones")
        .insert({ area_name: draft.area.trim(), fee_ksh: Math.round(fee) });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft({ area: "", fee: "" });
      refresh();
      toast.success("Area added");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateZone = useMutation({
    mutationFn: async ({ id, fee }: { id: string; fee: number }) => {
      const { error } = await supabase.from("shipping_zones").update({ fee_ksh: fee }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      toast.success("Delivery fee updated");
    },
    onError: () => toast.error("Could not update the fee"),
  });

  const deleteZone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shipping_zones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      toast.success("Area removed");
    },
    onError: () => toast.error("Could not remove the area"),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <section className="surface-card p-5">
        <h2 className="text-xl">Delivery fees by area</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep Kiria-ini Town at 0 for free delivery. Set base rates for other areas.
        </p>
        <div className="mt-4 space-y-3">
          {(zones ?? []).map((zone) => (
            <ZoneRow
              key={zone.id}
              zone={zone}
              onSave={(fee) => updateZone.mutate({ id: zone.id, fee })}
              onDelete={() => deleteZone.mutate(zone.id)}
            />
          ))}
        </div>
      </section>

      <section className="surface-card h-fit p-5">
        <h2 className="text-xl">Add an area</h2>
        <div className="mt-4 space-y-3">
          <input
            value={draft.area}
            onChange={(e) => setDraft({ ...draft, area: e.target.value })}
            placeholder="Area name, e.g. Kiharu"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <input
            value={draft.fee}
            onChange={(e) => setDraft({ ...draft, fee: e.target.value })}
            placeholder="Delivery fee in Ksh"
            inputMode="numeric"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => addZone.mutate()}
            disabled={addZone.isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            <Plus className="size-4" /> Add area
          </button>
        </div>
      </section>
    </div>
  );
}

function ZoneRow({
  zone,
  onSave,
  onDelete,
}: {
  zone: ShippingZone;
  onSave: (fee: number) => void;
  onDelete: () => void;
}) {
  const [fee, setFee] = useState(String(zone.fee_ksh));
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3">
      <p className="min-w-40 flex-1 text-sm font-semibold">{zone.area_name}</p>
      <input
        value={fee}
        onChange={(e) => setFee(e.target.value)}
        inputMode="numeric"
        className="w-28 rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={() => onSave(Math.round(Number(fee) || 0))}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Remove area"
        className="rounded-lg border border-border p-2 text-destructive hover:bg-secondary"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
