-- ============================================================
-- Expand the Brand catalog: a fuller list of real-world laptop
-- and phone manufacturers, beyond the short starter set.
-- Additive and idempotent — safe to run regardless of whether
-- the smaller starter list was already seeded.
-- ============================================================

insert into brands (name) values
  ('Toshiba'), ('Dynabook'), ('Sony'), ('Razer'), ('Gigabyte'), ('Fujitsu'), ('Panasonic'),
  ('Honor'), ('Chuwi'), ('Infinix'), ('Realme'), ('Medion'), ('VAIO'), ('Alienware'),
  ('Nokia'), ('Motorola'), ('Tecno'), ('ZTE'), ('Meizu'), ('Nothing'), ('Poco'), ('iQOO'),
  ('itel'), ('HTC'), ('BlackBerry')
on conflict (name) do nothing;

insert into asset_type_brands (asset_type_id, brand_id)
select t.id, b.id
from (values
  ('Laptop', 'Samsung'), ('Laptop', 'LG'), ('Laptop', 'Toshiba'), ('Laptop', 'Dynabook'),
  ('Laptop', 'Sony'), ('Laptop', 'Razer'), ('Laptop', 'Gigabyte'), ('Laptop', 'Fujitsu'),
  ('Laptop', 'Panasonic'), ('Laptop', 'Xiaomi'), ('Laptop', 'Honor'), ('Laptop', 'Chuwi'),
  ('Laptop', 'Infinix'), ('Laptop', 'Realme'), ('Laptop', 'Medion'), ('Laptop', 'VAIO'),
  ('Laptop', 'Alienware'), ('Laptop', 'Google'),
  ('Handphone', 'Realme'), ('Handphone', 'Honor'), ('Handphone', 'Nokia'), ('Handphone', 'Motorola'),
  ('Handphone', 'Sony'), ('Handphone', 'Infinix'), ('Handphone', 'Tecno'), ('Handphone', 'ZTE'),
  ('Handphone', 'Meizu'), ('Handphone', 'Nothing'), ('Handphone', 'Poco'), ('Handphone', 'iQOO'),
  ('Handphone', 'ASUS'), ('Handphone', 'itel'), ('Handphone', 'Panasonic'), ('Handphone', 'HTC'),
  ('Handphone', 'BlackBerry'), ('Handphone', 'LG')
) as x(type_name, brand_name)
join asset_types t on t.name = x.type_name
join brands b on b.name = x.brand_name
on conflict do nothing;
