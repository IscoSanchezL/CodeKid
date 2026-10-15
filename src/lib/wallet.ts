import type { Block } from "@/engine/types";
import { invalidateProgress } from "@/lib/progress";
import { createClient } from "@/lib/supabase/client";

export type Avatar = Record<string, string>;
export type Wallet = { id: string; name: string; coins: number; avatar: Avatar; owned: string[]; streak: number; role: string };
export type Deal = { itemId: string; discount: number };

export type Reward = {
  first: boolean;
  starsBefore: number;
  starsAfter: number;
  coins: number;
  bonus: number;
  streak: number;
  balance: number;
};
export type SubmitResponse = { status: "win" | "fail"; stars: number; blocks: number; reward: Reward | null };

/** Evento que avisa a la interfaz de que cambiaron las monedas o el traje. */
export const WALLET_EVENT = "codekid:wallet";
export const notifyWallet = () => window.dispatchEvent(new Event(WALLET_EVENT));

/** Precio con descuento, igual que en la base de datos (división entera hacia abajo). */
export const priceWithDiscount = (price: number, discount: number) => Math.floor((price * (100 - discount)) / 100);

export async function loadWallet(): Promise<Wallet | null> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getSession();
  const uid = auth.session?.user.id;
  if (!uid) return null;
  const [{ data: profile }, { data: inv }] = await Promise.all([
    supabase.from("profiles").select("display_name, coins, avatar, streak_days, role").eq("id", uid).maybeSingle(),
    supabase.from("inventory").select("item_id").eq("student_id", uid),
  ]);
  if (!profile) return null;
  return {
    id: uid,
    name: profile.display_name as string,
    coins: profile.coins as number,
    avatar: (profile.avatar as Avatar | null) ?? {},
    owned: (inv ?? []).map((r) => r.item_id as string),
    streak: (profile.streak_days as number) ?? 0,
    role: profile.role as string,
  };
}

export async function loadDeal(): Promise<Deal | null> {
  const { data } = await createClient().rpc("shop_deal");
  const row = Array.isArray(data) ? data[0] : data;
  return row ? { itemId: row.item_id as string, discount: row.discount as number } : null;
}

export async function loadPrices(): Promise<Record<string, number>> {
  const { data } = await createClient().from("shop_items").select("id, price");
  return Object.fromEntries((data ?? []).map((r) => [r.id as string, r.price as number]));
}

export async function buyItem(item: string): Promise<{ balance: number; price: number }> {
  const { data, error } = await createClient().rpc("buy_item", { p_item: item });
  if (error) throw new Error(error.message);
  notifyWallet();
  return data as { balance: number; price: number };
}

export async function equipItem(slot: string, item: string | null): Promise<Avatar> {
  const { data, error } = await createClient().rpc("equip_item", { p_slot: slot, p_item: item });
  if (error) throw new Error(error.message);
  notifyWallet();
  return (data as Avatar | null) ?? {};
}

/** Fallo al guardar un resultado. `retryable` = tiene sentido reintentar más tarde (sin red, servidor caído, sesión caducada). */
export class SubmitError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
  get retryable() {
    return this.status === 0 || this.status === 401 || this.status === 429 || this.status >= 500;
  }
}

/** Envía el programa al servidor, que lo comprueba con el mismo motor y reparte las monedas. */
export async function submitResult(level: number, challenge: number, program: Block[]): Promise<SubmitResponse> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new SubmitError("Sin sesión", 401);
  let res: Response;
  try {
    res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-result`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ level, challenge, program }),
    });
  } catch {
    throw new SubmitError("No hay conexión con el servidor", 0);
  }
  const payload = (await res.json().catch(() => ({}))) as SubmitResponse & { error?: string };
  if (!res.ok) throw new SubmitError(payload.error ?? "No se pudo guardar el progreso", res.status);
  invalidateProgress();
  notifyWallet();
  return payload;
}
