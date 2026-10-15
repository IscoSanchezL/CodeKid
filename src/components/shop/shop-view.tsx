"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Fuzzy, type FuzzyVariant, type Outfit } from "@/components/game/fuzzy";
import { variantFor } from "@/components/game/fuzzy-avatar";
import { CATALOG, itemById, itemsOf, RARITY_LABEL, SLOT_KEY, SLOTS, type ShopItem, type Slot } from "@/shop/catalog";
import { buyItem, equipItem, loadDeal, loadPrices, priceWithDiscount, type Deal } from "@/lib/wallet";
import { useWallet } from "./use-wallet";

const RARITY_STYLE: Record<ShopItem["rarity"], string> = {
  comun: "bg-surface-2 text-fg",
  raro: "bg-[#7c3aed] text-white",
  epico: "bg-[#f59e0b] text-[rgb(8_16_48)]",
};

/** Cómo se ve el personaje con la ropa puesta y, opcionalmente, un artículo de prueba. */
function look(avatar: Record<string, string>, id: string, preview?: ShopItem | null) {
  let variant = (avatar.variant as FuzzyVariant | undefined) ?? variantFor(id);
  const outfit: Outfit = { hat: avatar.hat, glasses: avatar.glasses, neck: avatar.neck };
  if (preview) {
    if (preview.slot === "color") variant = preview.id.slice(6) as FuzzyVariant;
    else outfit[SLOT_KEY[preview.slot] as keyof Outfit] = preview.id;
  }
  return { variant, outfit };
}

export function ShopView() {
  const { wallet, ready } = useWallet();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [deal, setDeal] = useState<Deal | null>(null);
  const [slot, setSlot] = useState<Slot>("hat");
  const [onlyOwned, setOnlyOwned] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadPrices().then(setPrices).catch(() => undefined);
    void loadDeal().then(setDeal).catch(() => undefined);
  }, []);

  const owned = useMemo(() => new Set(wallet?.owned ?? []), [wallet]);
  const priceOf = useCallback(
    (item: ShopItem) => {
      const base = prices[item.id] ?? item.price;
      return deal && deal.itemId === item.id ? priceWithDiscount(base, deal.discount) : base;
    },
    [prices, deal],
  );
  const have = (item: ShopItem) => item.price === 0 || owned.has(item.id);
  const equippedId = (item: ShopItem) => {
    const k = SLOT_KEY[item.slot];
    const v = wallet?.avatar[k];
    return item.slot === "color" ? (v ? `color-${v}` : null) : v;
  };
  const isEquipped = (item: ShopItem) => equippedId(item) === item.id;

  const dealItem = deal ? itemById(deal.itemId) : null;
  const selected = picked ? itemById(picked) ?? null : null;
  const list = itemsOf(slot).filter((i) => !onlyOwned || have(i));

  if (!ready) return <p className="py-20 text-center text-muted">Cargando…</p>;
  if (!wallet || wallet.role !== "student") {
    return (
      <Card className="mx-auto max-w-md text-center">
        <p className="text-5xl" aria-hidden>
          🛍️
        </p>
        <h1 className="mt-2 text-2xl font-extrabold">La tienda es para los alumnos</h1>
        <p className="mt-2 text-muted">Entra con el código de tu clase para ganar monedas y vestir a tu personaje.</p>
        <Button className="mt-4" onClick={() => (window.location.href = "/clase")}>
          Entrar con mi clase
        </Button>
      </Card>
    );
  }

  const shown = look(wallet.avatar, wallet.id, selected);

  async function buy(item: ShopItem) {
    setBusy(true);
    setMessage(null);
    try {
      await buyItem(item.id);
      await equipItem(item.slot, item.id); // al comprar, se lo pone
      setMessage({ kind: "ok", text: `¡Es tuyo! Ya llevas «${item.name}».` });
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof Error ? e.message : "No se pudo comprar" });
    } finally {
      setBusy(false);
    }
  }

  async function toggleEquip(item: ShopItem) {
    setBusy(true);
    setMessage(null);
    try {
      await equipItem(item.slot, isEquipped(item) && item.slot !== "color" ? null : item.id);
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof Error ? e.message : "No se pudo cambiar" });
    } finally {
      setBusy(false);
    }
  }

  const missing = selected ? Math.max(0, priceOf(selected) - wallet.coins) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      {/* vestidor */}
      <aside className="flex flex-col gap-4">
        <Card className="scene-sky relative overflow-hidden text-center">
          <div className="fz-idle mx-auto mt-16 w-fit">
            <Fuzzy variant={shown.variant} outfit={shown.outfit} size={190} dir={2} mood="happy" />
          </div>
          <div aria-hidden className="scene-meadow absolute inset-x-0 bottom-0 h-8" />
          <p className="relative mt-6 pb-8 text-sm font-bold">
            {selected ? `Probando: ${selected.name}` : "Así te ven tus amigos"}
          </p>
        </Card>

        {selected ? (
          <Card className="text-center">
            <p className="text-lg font-extrabold">{selected.name}</p>
            <span className={`mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-bold ${RARITY_STYLE[selected.rarity]}`}>
              {RARITY_LABEL[selected.rarity]}
            </span>
            {have(selected) ? (
              <Button className="mt-3 w-full" variant={isEquipped(selected) ? "secondary" : "go"} disabled={busy} onClick={() => toggleEquip(selected)}>
                {isEquipped(selected) ? (selected.slot === "color" ? "Ya lo llevas" : "Quitar") : "Ponérmelo"}
              </Button>
            ) : (
              <>
                <Button className="mt-3 w-full" variant="go" disabled={busy || missing > 0} onClick={() => buy(selected)}>
                  Comprar por 🪙 {priceOf(selected)}
                </Button>
                {missing > 0 && (
                  <p className="mt-2 text-sm text-muted">
                    Te faltan <strong>{missing}</strong> monedas.{" "}
                    <Link href="/mapa" className="font-semibold text-brand">
                      Juega para ganarlas
                    </Link>
                  </p>
                )}
              </>
            )}
          </Card>
        ) : (
          <Card className="text-center text-sm text-muted">Toca un artículo para probártelo antes de comprarlo.</Card>
        )}
      </aside>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold">Tienda</h1>
          <p className="rounded-full bg-warn/20 px-4 py-1.5 text-lg font-extrabold" aria-label={`${wallet.coins} monedas`}>
            🪙 {wallet.coins}
          </p>
        </div>

        {dealItem && deal && (
          <button
            type="button"
            onClick={() => {
              setSlot(dealItem.slot);
              setPicked(dealItem.id);
            }}
            className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#ff4d6d] to-[#ff8a3d] p-3 text-left text-white shadow-card"
          >
            <span className="text-3xl" aria-hidden>
              🔥
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold uppercase tracking-wide">Oferta de hoy · cambia cada día</span>
              <span className="font-extrabold">
                {dealItem.name}: <s className="opacity-70">{prices[dealItem.id] ?? dealItem.price}</s> {priceOf(dealItem)} 🪙 (−{deal.discount} %)
              </span>
            </span>
          </button>
        )}

        {message && (
          <p
            role={message.kind === "error" ? "alert" : "status"}
            className={`rounded-xl p-3 text-sm font-semibold ${message.kind === "ok" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}
          >
            {message.text}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Categorías">
          {SLOTS.map((s) => (
            <button
              key={s.slot}
              role="tab"
              type="button"
              aria-selected={slot === s.slot}
              onClick={() => setSlot(s.slot)}
              className={`rounded-xl px-4 py-2 font-bold shadow-[0_3px_0_0_rgba(0,0,0,0.2)] ${slot === s.slot ? "bg-brand text-brand-fg" : "bg-surface-2"}`}
            >
              <span aria-hidden>{s.icon}</span> {s.label}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={onlyOwned} onChange={(e) => setOnlyOwned(e.target.checked)} className="h-4 w-4" />
            Solo lo que tengo
          </label>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {list.map((item) => {
            const mine = have(item);
            const price = priceOf(item);
            const afford = wallet.coins >= price;
            const l = look(wallet.avatar, wallet.id, item);
            const isDeal = deal?.itemId === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setPicked(item.id)}
                  aria-pressed={picked === item.id}
                  className={`card-3d relative flex w-full flex-col items-center gap-1 rounded-2xl border bg-surface p-3 text-center transition-transform hover:-translate-y-1 ${
                    picked === item.id ? "border-brand ring-2 ring-brand" : "border-border"
                  }`}
                >
                  {isDeal && (
                    <span className="absolute -right-2 -top-2 rounded-full bg-[#ff4d6d] px-2 py-0.5 text-xs font-extrabold text-white shadow">
                      −{deal?.discount}%
                    </span>
                  )}
                  <Fuzzy variant={l.variant} outfit={l.outfit} size={84} dir={2} mood="happy" />
                  <span className="text-sm font-extrabold leading-tight">{item.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${RARITY_STYLE[item.rarity]}`}>{RARITY_LABEL[item.rarity]}</span>
                  {mine ? (
                    <span className="text-sm font-bold text-success">{isEquipped(item) ? "✔ Puesto" : "✔ Tuyo"}</span>
                  ) : (
                    <span className={`text-sm font-extrabold ${afford ? "" : "text-muted"}`}>
                      🪙 {price}
                      {isDeal && <s className="ml-1 text-xs opacity-60">{prices[item.id] ?? item.price}</s>}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
          {list.length === 0 && <li className="col-span-full text-sm text-muted">Aquí todavía no tienes nada. ¡Gana monedas y compra!</li>}
        </ul>
      </section>
    </div>
  );
}

export const TOTAL_ITEMS = CATALOG.length;
