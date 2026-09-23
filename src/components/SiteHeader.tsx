import { Link } from "@tanstack/react-router";
import { Menu, Package, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { BUSINESS } from "@/lib/waki";
import { useCartCount, useIsAdmin, useProfile, useSession } from "@/hooks/useSession";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact Us" },
] as const;

export function SiteHeader() {
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const { data: cartCount } = useCartCount(user?.id);
  const { data: isAdmin } = useIsAdmin(user?.id);
  const [open, setOpen] = useState(false);

  const displayName =
    (profile?.full_name as string | null) || user?.email?.split("@")[0] || "Account";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Package className="size-5" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg font-semibold leading-tight">
            {BUSINESS.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.to === "/" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin ? (
            <Link
              to="/admin"
              className="rounded-md px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-secondary"
            >
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="relative flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 pr-3 text-sm font-medium transition-colors hover:bg-secondary"
                title="Go to my dashboard"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url as string}
                    alt={displayName}
                    className="size-7 rounded-full object-cover"
                    width={28}
                    height={28}
                  />
                ) : (
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {initials}
                  </span>
                )}
                <span className="hidden max-w-28 truncate sm:inline">{displayName}</span>
                {cartCount ? (
                  <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                    <ShoppingBag className="size-3" /> {cartCount}
                  </span>
                ) : null}
              </Link>
            </>
          ) : (
            <Link
              to="/auth"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Sign in
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-md border border-border p-2 md:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-border bg-card px-4 py-2 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          {isAdmin ? (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-accent hover:bg-secondary"
            >
              Admin dashboard
            </Link>
          ) : null}
        </nav>
      ) : null}
    </header>
  );
}
