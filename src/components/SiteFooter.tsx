import { Link } from "@tanstack/react-router";
import { MapPin, Phone } from "lucide-react";
import { BUSINESS } from "@/lib/waki";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <h3 className="text-lg">{BUSINESS.name}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Quality, affordable and eco-friendly packaging made in Kiria-ini.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Visit or call us</p>
          <p className="mt-2 flex items-start gap-2 text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            {BUSINESS.location}
          </p>
          <a
            href={`tel:${BUSINESS.phone}`}
            className="mt-2 flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <Phone className="size-4" /> {BUSINESS.phone}
          </a>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Pages</p>
          <div className="mt-2 flex flex-col gap-1 text-muted-foreground">
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>
            <Link to="/about" className="hover:text-foreground">
              About Us
            </Link>
            <Link to="/contact" className="hover:text-foreground">
              Contact Us
            </Link>
            <Link to="/terms" className="hover:text-foreground">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
      <p className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} {BUSINESS.name}. All rights reserved.
      </p>
    </footer>
  );
}
