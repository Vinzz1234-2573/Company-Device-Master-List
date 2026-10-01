-- ============================================================
-- Brands discovered by reading the actual asset descriptions in
-- supabase/seed.sql (the real 283-row import) that weren't in the
-- catalog yet. Also links Honor/Gigabyte to types they weren't
-- linked to before (Honor makes phones, not just laptops; Gigabyte
-- peripherals include mice, not just the brand itself).
-- ============================================================

insert into brands (name) values
  ('Philips'), ('PRISM+'), ('Probex'), ('Salpido'), ('TP-Link'), ('Segotep'),
  ('SIRUI'), ('COMICA'), ('Viloso')
on conflict (name) do nothing;

insert into asset_type_brands (asset_type_id, brand_id)
select t.id, b.id
from (values
  ('Monitor', 'Philips'), ('Monitor', 'PRISM+'),
  ('Keyboard', 'Probex'),
  ('Wireless Mouse', 'Salpido'), ('Wireless Mouse', 'Gigabyte'), ('Wired Mouse', 'Gigabyte'),
  ('Router', 'TP-Link'),
  ('PC', 'Segotep'),
  ('Camera Tripod', 'SIRUI'),
  ('Camera Mic', 'COMICA'),
  ('Camera Battery Charger', 'Viloso'),
  ('Handphone', 'Honor')
) as x(type_name, brand_name)
join asset_types t on t.name = x.type_name
join brands b on b.name = x.brand_name
on conflict do nothing;
