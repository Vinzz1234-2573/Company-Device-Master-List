-- ============================================================
-- Consolidate the Mouse categories down to just two (Wireless /
-- Wired), and retire Wifi Modem from the picker — per request.
--
-- Deactivating (is_active = false) rather than deleting: the asset
-- form already filters the master list to active rows, so this
-- removes them from the dropdown for NEW selections immediately,
-- without touching any existing asset row that already used one of
-- these values (that's a live-data question, not a schema one — see
-- the separate cleanup script, not a migration, for that).
-- ============================================================

update asset_types set is_active = false where name in ('Mouse', 'Bluetooth Mouse', 'Wifi Modem');

insert into asset_types (name, sort_order) values ('Wired Mouse', 101)
on conflict (name) do nothing;

-- Carry over whatever brands were already linked to the old generic
-- "Mouse" type so Wired Mouse isn't left with an empty brand list.
insert into asset_type_brands (asset_type_id, brand_id)
select wired.id, atb.brand_id
from asset_type_brands atb
join asset_types old_mouse on old_mouse.id = atb.asset_type_id and old_mouse.name = 'Mouse'
join asset_types wired on wired.name = 'Wired Mouse'
on conflict do nothing;
