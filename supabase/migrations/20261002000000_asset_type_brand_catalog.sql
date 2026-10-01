-- ============================================================
-- Asset Type / Brand master list ("catalog"), to drive dependent
-- dropdowns on the asset form instead of free-typed text.
--
-- assets.asset_type and assets.brand remain plain text columns
-- (not foreign keys) — every existing query, filter, export and
-- report in the app already compares/groups on these as text, and
-- a hard FK rename would mean rewriting all of them at once on a
-- live system. This catalog is the controlled vocabulary the form
-- pulls its dropdown options from; the stored value is still just
-- the catalog entry's name.
-- ============================================================

create table asset_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table asset_type_brands (
  asset_type_id uuid not null references asset_types(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  primary key (asset_type_id, brand_id)
);

alter table asset_types enable row level security;
alter table brands enable row level security;
alter table asset_type_brands enable row level security;

create policy asset_types_select on asset_types for select using (auth.uid() is not null);
create policy asset_types_insert on asset_types for insert with check (is_admin());
create policy asset_types_update on asset_types for update using (is_admin()) with check (is_admin());

create policy brands_select on brands for select using (auth.uid() is not null);
create policy brands_insert on brands for insert with check (is_admin());
create policy brands_update on brands for update using (is_admin()) with check (is_admin());

create policy asset_type_brands_select on asset_type_brands for select using (auth.uid() is not null);
create policy asset_type_brands_insert on asset_type_brands for insert with check (is_admin());

-- ============================================================
-- Starting master list (per the brief). Treated as a seed, not a
-- closed list — the asset form auto-adds a new type/brand (and the
-- type↔brand link) the first time someone picks "Other" and types
-- one in, so the catalog grows on its own as real assets are added.
-- ============================================================
insert into asset_types (name, sort_order) values
  ('Laptop', 10), ('Laptop Adapter', 20), ('Desktop / PC', 30), ('Monitor', 40),
  ('Monitor Adapter', 50), ('Handphone', 60), ('Handphone Charger', 70), ('Simcard', 80),
  ('Keyboard', 90), ('Mouse', 100), ('Wireless Mouse', 110), ('Bluetooth Mouse', 120),
  ('Printer', 130), ('Camera', 140), ('Camera Accessory', 150), ('Tablet', 160),
  ('HDMI Cable', 170), ('Router', 180), ('Wifi Modem', 190), ('Pendrive', 200), ('Other', 999)
on conflict (name) do nothing;

insert into brands (name) values
  ('Acer'), ('ASUS'), ('Dell'), ('HP'), ('Lenovo'), ('Apple'), ('Microsoft'), ('MSI'), ('Huawei'),
  ('Samsung'), ('Xiaomi'), ('OPPO'), ('vivo'), ('Google'), ('OnePlus'),
  ('LG'), ('ViewSonic'), ('Canon'), ('Epson'), ('Brother'), ('Xerox'),
  ('Logitech'), ('Generic'), ('SanDisk'), ('Kingston'), ('Transcend')
on conflict (name) do nothing;

insert into asset_type_brands (asset_type_id, brand_id)
select t.id, b.id
from (values
  ('Laptop', 'Acer'), ('Laptop', 'ASUS'), ('Laptop', 'Dell'), ('Laptop', 'HP'), ('Laptop', 'Lenovo'),
  ('Laptop', 'Apple'), ('Laptop', 'Microsoft'), ('Laptop', 'MSI'), ('Laptop', 'Huawei'),
  ('Handphone', 'Apple'), ('Handphone', 'Samsung'), ('Handphone', 'Xiaomi'), ('Handphone', 'OPPO'),
  ('Handphone', 'vivo'), ('Handphone', 'Huawei'), ('Handphone', 'Google'), ('Handphone', 'OnePlus'),
  ('Monitor', 'Dell'), ('Monitor', 'HP'), ('Monitor', 'Lenovo'), ('Monitor', 'ASUS'), ('Monitor', 'Acer'),
  ('Monitor', 'Samsung'), ('Monitor', 'LG'), ('Monitor', 'ViewSonic'),
  ('Printer', 'Canon'), ('Printer', 'Epson'), ('Printer', 'HP'), ('Printer', 'Brother'), ('Printer', 'Xerox'),
  ('Desktop / PC', 'Dell'), ('Desktop / PC', 'HP'), ('Desktop / PC', 'Lenovo'), ('Desktop / PC', 'Acer'), ('Desktop / PC', 'ASUS'),
  ('Keyboard', 'Logitech'), ('Keyboard', 'Microsoft'), ('Keyboard', 'Dell'), ('Keyboard', 'HP'), ('Keyboard', 'Lenovo'),
  ('Mouse', 'Logitech'), ('Mouse', 'Microsoft'), ('Mouse', 'Dell'), ('Mouse', 'HP'), ('Mouse', 'Lenovo'),
  ('Wireless Mouse', 'Logitech'), ('Wireless Mouse', 'Microsoft'), ('Wireless Mouse', 'Dell'), ('Wireless Mouse', 'HP'),
  ('Laptop Adapter', 'Dell'), ('Laptop Adapter', 'HP'), ('Laptop Adapter', 'Lenovo'), ('Laptop Adapter', 'Acer'),
  ('Laptop Adapter', 'ASUS'), ('Laptop Adapter', 'Apple'),
  ('Handphone Charger', 'Apple'), ('Handphone Charger', 'Samsung'), ('Handphone Charger', 'Xiaomi'),
  ('Handphone Charger', 'OPPO'), ('Handphone Charger', 'vivo'),
  ('Monitor Adapter', 'Dell'), ('Monitor Adapter', 'HP'), ('Monitor Adapter', 'Lenovo'), ('Monitor Adapter', 'ASUS'),
  ('HDMI Cable', 'Generic'),
  ('Pendrive', 'SanDisk'), ('Pendrive', 'Kingston'), ('Pendrive', 'Transcend')
) as x(type_name, brand_name)
join asset_types t on t.name = x.type_name
join brands b on b.name = x.brand_name
on conflict do nothing;
