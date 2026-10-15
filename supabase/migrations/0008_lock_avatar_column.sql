-- El avatar (traje) solo se cambia con equip_item, que comprueba que el artículo es tuyo.
revoke update (avatar) on public.profiles from authenticated;
