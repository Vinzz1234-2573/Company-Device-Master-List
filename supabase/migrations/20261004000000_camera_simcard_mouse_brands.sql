-- ============================================================
-- Cleaned up from a real asset_type export: the distinct values in
-- use were mostly already covered by the existing master list
-- (Laptop, Laptop Adapter, Monitor, Monitor Adapter, Handphone,
-- Handphone Charger, Simcard, Mouse, Keyboard, Printer, Pendrive,
-- Router) or map onto an existing canonical entry rather than
-- needing a new one:
--   "PC" / "CPU"  -> Desktop / PC
--   "Tab"         -> Tablet
--   "Wifi"        -> Wifi Modem
--   "HDMI"        -> HDMI Cable
-- Those four are deliberately NOT added as new master-list entries
-- (to avoid the dropdown ending up with several near-duplicate
-- options for the same thing) — existing rows already spelled that
-- way still show up fine via the catalog's fallback that unions in
-- any value already in use, so nothing is lost; new entries just get
-- steered to the one canonical option going forward.
--
-- The genuinely new categories in that export — several distinct
-- camera-accessory types, and one too ambiguous to guess
-- ("Machine") — are added for real below.
-- ============================================================

insert into asset_types (name, sort_order) values
  ('Camera Battery', 141), ('Camera Battery Charger', 142), ('Camera Adapter', 143),
  ('Camera Stabilization', 144), ('Camera Tripod', 145), ('Camera Mic', 146),
  ('Machine', 210)
on conflict (name) do nothing;

-- ============================================================
-- Brand expansion:
--  - Simcard brands are telco/network operators, not device makers
--    (Malaysia-focused, since this is a Malaysian org's inventory)
--  - Camera brands, for Camera and its accessory sub-types
--  - A few more dedicated peripheral brands for Mouse
-- ============================================================
insert into brands (name) values
  ('Maxis'), ('Celcom'), ('Digi'), ('U Mobile'), ('Unifi Mobile'), ('Yes'),
  ('Tune Talk'), ('RedONE'), ('XOX'), ('Merchantrade'),
  ('Nikon'), ('Fujifilm'), ('GoPro'), ('DJI'), ('Olympus'), ('Leica'), ('Ricoh'), ('Pentax'),
  ('Manfrotto'), ('Joby'), ('Benro'), ('Rode'), ('Sennheiser'), ('Shure'), ('Zhiyun'),
  ('A4Tech'), ('Rapoo'), ('Fantech')
on conflict (name) do nothing;

insert into asset_type_brands (asset_type_id, brand_id)
select t.id, b.id
from (values
  ('Simcard', 'Maxis'), ('Simcard', 'Celcom'), ('Simcard', 'Digi'), ('Simcard', 'U Mobile'),
  ('Simcard', 'Unifi Mobile'), ('Simcard', 'Yes'), ('Simcard', 'Tune Talk'), ('Simcard', 'RedONE'),
  ('Simcard', 'XOX'), ('Simcard', 'Merchantrade'),

  ('Camera', 'Canon'), ('Camera', 'Sony'), ('Camera', 'Panasonic'), ('Camera', 'Nikon'),
  ('Camera', 'Fujifilm'), ('Camera', 'GoPro'), ('Camera', 'DJI'), ('Camera', 'Olympus'),
  ('Camera', 'Leica'), ('Camera', 'Ricoh'), ('Camera', 'Pentax'),

  ('Camera Battery', 'Canon'), ('Camera Battery', 'Sony'), ('Camera Battery', 'Nikon'),
  ('Camera Battery', 'Fujifilm'), ('Camera Battery', 'Panasonic'), ('Camera Battery', 'GoPro'), ('Camera Battery', 'DJI'),

  ('Camera Battery Charger', 'Canon'), ('Camera Battery Charger', 'Sony'), ('Camera Battery Charger', 'Nikon'),
  ('Camera Battery Charger', 'Fujifilm'), ('Camera Battery Charger', 'Panasonic'), ('Camera Battery Charger', 'GoPro'),
  ('Camera Battery Charger', 'DJI'),

  ('Camera Adapter', 'Canon'), ('Camera Adapter', 'Sony'), ('Camera Adapter', 'Nikon'),
  ('Camera Adapter', 'Fujifilm'), ('Camera Adapter', 'Panasonic'),

  ('Camera Stabilization', 'DJI'), ('Camera Stabilization', 'Zhiyun'), ('Camera Stabilization', 'Manfrotto'),

  ('Camera Tripod', 'Manfrotto'), ('Camera Tripod', 'Joby'), ('Camera Tripod', 'Benro'),

  ('Camera Mic', 'Rode'), ('Camera Mic', 'Sennheiser'), ('Camera Mic', 'Shure'), ('Camera Mic', 'DJI'),

  ('Mouse', 'A4Tech'), ('Mouse', 'Rapoo'), ('Mouse', 'Fantech'), ('Mouse', 'Razer'), ('Mouse', 'ASUS')
) as x(type_name, brand_name)
join asset_types t on t.name = x.type_name
join brands b on b.name = x.brand_name
on conflict do nothing;
