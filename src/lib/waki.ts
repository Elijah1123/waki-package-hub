import brownBags from "@/assets/brown-bags.jpg";
import giftBags from "@/assets/gift-bags.jpg";
import bookCovers from "@/assets/book-covers.jpg";
import briquettes from "@/assets/briquettes.jpg";
import cakeBoxes from "@/assets/cake-boxes.jpg";
import envelopes from "@/assets/envelopes.jpg";
import popcornBags from "@/assets/popcorn-bags.jpg";

export const BUSINESS = {
  name: "Waki Packages",
  phone: "0725094498",
  location: "Behind Bingo Hardware, Kiria-ini Town, Murang'a County",
  freeDeliveryArea: "Kiria-ini Town",
};

export const productImages: Record<string, string> = {
  "brown-bags": brownBags,
  "gift-bags": giftBags,
  "book-covers": bookCovers,
  briquettes: briquettes,
  "cake-boxes": cakeBoxes,
  envelopes: envelopes,
  "popcorn-bags": popcornBags,
};

export function productImage(key: string | null | undefined): string | null {
  if (!key) return null;
  return productImages[key] ?? null;
}

export function ksh(amount: number): string {
  return `Ksh ${amount.toLocaleString("en-KE")}`;
}

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price_ksh: number;
  unit: string;
  image_key: string | null;
  is_active: boolean;
};

export type ShippingZone = {
  id: string;
  area_name: string;
  fee_ksh: number;
};

export type CartRow = {
  id: string;
  quantity: number;
  product_id: string;
  products: Product | null;
};

export type OrderRow = {
  id: string;
  user_id: string;
  subtotal_ksh: number;
  shipping_ksh: number;
  total_ksh: number;
  delivery_address: string;
  shipping_area: string | null;
  phone: string | null;
  status: string;
  payment_status: string;
  mpesa_reference: string | null;
  created_at: string;
};

export const KENYAN_PHONE = /^(?:0|\+?254)(?:7|1)\d{8}$/;
