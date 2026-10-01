-- Master IT Asset Management System - schema
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query),
-- then run seed.sql to load the existing masterlist.

create extension if not exists pgcrypto;

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('admin', 'manager', 'staff');
create type employment_status as enum ('active', 'resigned', 'inactive', 'on_leave');
create type asset_status as enum (
  'available', 'assigned', 'under_maintenance', 'lost', 'damaged', 'retired', 'disposed', 'pending_verification'
);

-- ============================================================
-- CORE TABLES
-- ============================================================

create table departments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table employees (
  id uuid primary key default gen_random_uuid(),
  employee_no text unique,
  name text not null,
  job_title text,
  department_id uuid references departments(id) on delete set null,
  email text,
  phone text,
  employment_status employment_status not null default 'active',
  joined_date date,
  resigned_date date,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index employees_name_idx on employees using gin (to_tsvector('simple', name));
create index employees_department_idx on employees (department_id);

-- profiles: one row per Supabase Auth user, carries the app role.
-- A profile is optionally linked to an employee record so a "staff" user
-- can see "my assigned assets".
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  role user_role not null default 'staff',
  employee_id uuid references employees(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  asset_code text unique,
  asset_type text not null,
  brand text,
  model text,
  description text,
  serial_no text,
  imei text,
  sim_number text,
  phone_number text,
  status asset_status not null default 'available',
  condition text,
  location text,
  department_id uuid references departments(id) on delete set null,
  remarks text,
  needs_verification boolean not null default false,
  verification_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id)
);

-- Prevent true duplicate serial numbers while still allowing the many
-- "NA" / blank / "-" placeholder values that exist throughout the original
-- masterlist (those do not identify a real, distinguishable serial).
create unique index assets_serial_no_unique_idx
  on assets (lower(serial_no))
  where serial_no is not null
    and btrim(serial_no) <> ''
    and lower(btrim(serial_no)) !~ '^(na|n/a|n\.a\.?|-|nil|none|_)$';

create unique index assets_imei_unique_idx
  on assets (lower(imei))
  where imei is not null and btrim(imei) <> '';

create index assets_type_idx on assets (asset_type);
create index assets_status_idx on assets (status);
create index assets_department_idx on assets (department_id);
create index assets_search_idx on assets using gin (
  to_tsvector('simple',
    coalesce(asset_code,'') || ' ' || coalesce(asset_type,'') || ' ' || coalesce(brand,'') || ' ' ||
    coalesce(model,'') || ' ' || coalesce(description,'') || ' ' || coalesce(serial_no,'') || ' ' ||
    coalesce(imei,'') || ' ' || coalesce(phone_number,'') || ' ' || coalesce(remarks,'')
  )
);

create table asset_assignments (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  employee_id uuid not null references employees(id),
  department_id uuid references departments(id),
  issued_date date,
  expected_return_date date,
  returned_date date,
  issued_by text,
  returned_to text,
  issue_condition text,
  return_condition text,
  remarks text,
  needs_verification boolean not null default false,
  verification_reason text,
  created_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

create index asset_assignments_asset_idx on asset_assignments (asset_id);
create index asset_assignments_employee_idx on asset_assignments (employee_id);
-- an asset can only be actively (unreturned) assigned once at a time
create unique index asset_assignments_one_active_idx
  on asset_assignments (asset_id)
  where returned_date is null;

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  user_email text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on audit_logs (entity_type, entity_id);
create index audit_logs_created_idx on audit_logs (created_at desc);

-- ============================================================
-- updated_at triggers
-- ============================================================
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger employees_set_updated_at before update on employees
  for each row execute function set_updated_at();
create trigger assets_set_updated_at before update on assets
  for each row execute function set_updated_at();

-- ============================================================
-- New auth user -> profile bootstrap
-- ============================================================
create or replace function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email, 'staff');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- Helper: current user's role (used by RLS policies)
-- ============================================================
create or replace function current_role_name() returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer set search_path = public;

create or replace function is_admin() returns boolean as $$
  select current_role_name() = 'admin';
$$ language sql stable;

create or replace function is_admin_or_manager() returns boolean as $$
  select current_role_name() in ('admin', 'manager');
$$ language sql stable;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table departments enable row level security;
alter table employees enable row level security;
alter table profiles enable row level security;
alter table assets enable row level security;
alter table asset_assignments enable row level security;
alter table audit_logs enable row level security;

-- profiles
-- Note: there is deliberately no "update own profile" policy. Role, employee
-- link and active status must only ever change via an admin (through
-- profiles_admin_all below, or the set_user_role() function) — letting a
-- user update their own row would let them grant themselves admin.
create policy profiles_select_self_or_admin on profiles for select
  using (id = auth.uid() or is_admin());
create policy profiles_admin_all on profiles for all
  using (is_admin()) with check (is_admin());

-- departments: everyone signed in can read; only admin can write
create policy departments_select on departments for select using (auth.uid() is not null);
create policy departments_write on departments for insert with check (is_admin());
create policy departments_update on departments for update using (is_admin()) with check (is_admin());
create policy departments_delete on departments for delete using (is_admin());

-- employees: everyone signed in can read; only admin can write
create policy employees_select on employees for select using (auth.uid() is not null);
create policy employees_insert on employees for insert with check (is_admin());
create policy employees_update on employees for update using (is_admin()) with check (is_admin());
create policy employees_delete on employees for delete using (is_admin());

-- assets: everyone signed in can read; only admin can write directly
-- (assign/return/status-change go through security-definer RPC functions below)
create policy assets_select on assets for select using (auth.uid() is not null);
create policy assets_insert on assets for insert with check (is_admin());
create policy assets_update on assets for update using (is_admin()) with check (is_admin());
create policy assets_delete on assets for delete using (is_admin());

-- asset_assignments: everyone signed in can read; direct writes admin-only
-- (normal assign/return flows go through RPC functions)
create policy asset_assignments_select on asset_assignments for select using (auth.uid() is not null);
create policy asset_assignments_insert on asset_assignments for insert with check (is_admin());
create policy asset_assignments_update on asset_assignments for update using (is_admin()) with check (is_admin());
create policy asset_assignments_delete on asset_assignments for delete using (is_admin());

-- audit_logs: admin only
create policy audit_logs_select on audit_logs for select using (is_admin());
create policy audit_logs_insert on audit_logs for insert with check (auth.uid() is not null);

-- ============================================================
-- Transactional RPC functions (assign / return / status change)
-- These run as the calling (authenticated) user; RLS + the admin check
-- inside each function control who may actually perform the action, and
-- each one writes exactly one audit_log row atomically with its change.
-- ============================================================

create or replace function assign_asset(
  p_asset_id uuid,
  p_employee_id uuid,
  p_issued_date date,
  p_expected_return_date date,
  p_issued_by text,
  p_issue_condition text,
  p_remarks text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_asset assets%rowtype;
  v_employee employees%rowtype;
  v_assignment_id uuid;
begin
  if not is_admin() then
    raise exception 'Only an administrator can assign assets.';
  end if;

  select * into v_asset from assets where id = p_asset_id for update;
  if not found then
    raise exception 'Asset not found.';
  end if;
  if v_asset.status = 'assigned' then
    raise exception 'This asset is already assigned to someone. Please return it first.';
  end if;

  select * into v_employee from employees where id = p_employee_id;
  if not found then
    raise exception 'Employee not found.';
  end if;
  if v_employee.employment_status = 'resigned' then
    raise exception 'This employee is marked as resigned and cannot be assigned new assets.';
  end if;

  insert into asset_assignments (
    asset_id, employee_id, department_id, issued_date, expected_return_date,
    issued_by, issue_condition, remarks, created_by
  ) values (
    p_asset_id, p_employee_id, v_employee.department_id, p_issued_date, p_expected_return_date,
    p_issued_by, p_issue_condition, p_remarks, auth.uid()
  ) returning id into v_assignment_id;

  update assets
    set status = 'assigned', department_id = v_employee.department_id, updated_by = auth.uid()
    where id = p_asset_id;

  insert into audit_logs (user_id, user_email, action, entity_type, entity_id, new_value)
    values (auth.uid(), (select email from profiles where id = auth.uid()), 'asset_assigned', 'asset', p_asset_id,
      jsonb_build_object('assignment_id', v_assignment_id, 'employee_id', p_employee_id, 'issued_date', p_issued_date));

  return v_assignment_id;
end;
$$;

create or replace function return_asset(
  p_assignment_id uuid,
  p_returned_date date,
  p_returned_to text,
  p_return_condition text,
  p_remarks text,
  p_new_status asset_status
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment asset_assignments%rowtype;
begin
  if not is_admin() then
    raise exception 'Only an administrator can return assets.';
  end if;

  select * into v_assignment from asset_assignments where id = p_assignment_id for update;
  if not found then
    raise exception 'Assignment record not found.';
  end if;
  if v_assignment.returned_date is not null then
    raise exception 'This asset has already been returned.';
  end if;

  update asset_assignments
    set returned_date = p_returned_date,
        returned_to = p_returned_to,
        return_condition = p_return_condition,
        remarks = coalesce(v_assignment.remarks || E'\n', '') || coalesce(p_remarks, '')
    where id = p_assignment_id;

  update assets
    set status = coalesce(p_new_status, 'available'), updated_by = auth.uid()
    where id = v_assignment.asset_id;

  insert into audit_logs (user_id, user_email, action, entity_type, entity_id, old_value, new_value)
    values (auth.uid(), (select email from profiles where id = auth.uid()), 'asset_returned', 'asset', v_assignment.asset_id,
      jsonb_build_object('assignment_id', p_assignment_id),
      jsonb_build_object('returned_date', p_returned_date, 'status', coalesce(p_new_status, 'available')));
end;
$$;

create or replace function change_asset_status(
  p_asset_id uuid,
  p_new_status asset_status,
  p_remarks text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old asset_status;
begin
  if not is_admin() then
    raise exception 'Only an administrator can change asset status.';
  end if;

  select status into v_old from assets where id = p_asset_id for update;
  if not found then
    raise exception 'Asset not found.';
  end if;

  update assets set status = p_new_status, remarks = coalesce(p_remarks, remarks), updated_by = auth.uid()
    where id = p_asset_id;

  insert into audit_logs (user_id, user_email, action, entity_type, entity_id, old_value, new_value)
    values (auth.uid(), (select email from profiles where id = auth.uid()), 'asset_status_changed', 'asset', p_asset_id,
      jsonb_build_object('status', v_old), jsonb_build_object('status', p_new_status));
end;
$$;

-- Promote/demote a user's role. Only usable by an existing admin.
create or replace function set_user_role(p_user_id uuid, p_role user_role) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Only an administrator can change user roles.';
  end if;
  update profiles set role = p_role where id = p_user_id;
  insert into audit_logs (user_id, user_email, action, entity_type, entity_id, new_value)
    values (auth.uid(), (select email from profiles where id = auth.uid()), 'user_role_changed', 'profile', p_user_id,
      jsonb_build_object('role', p_role));
end;
$$;

-- ============================================================
-- Donation in Kind (see supabase/migrations/20261001000000_donation_in_kind.sql
-- for the authoritative, independently-applied version of this change)
-- ============================================================
do $$ begin
  create type acquisition_type as enum ('purchased', 'donation_in_kind');
exception when duplicate_object then null;
end $$;

alter table assets
  add column if not exists acquisition_type acquisition_type not null default 'purchased',
  add column if not exists quantity integer not null default 1,
  add column if not exists donor_name text,
  add column if not exists donation_value numeric(14, 2),
  add column if not exists donation_received_date date;

do $$ begin
  alter table assets add constraint assets_quantity_positive check (quantity > 0);
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table assets add constraint assets_donation_requires_donor
    check (acquisition_type <> 'donation_in_kind' or donor_name is not null);
exception when duplicate_object then null;
end $$;

create index if not exists assets_acquisition_type_idx on assets (acquisition_type);

create table if not exists asset_documents (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  file_size bigint,
  content_type text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists asset_documents_asset_idx on asset_documents (asset_id);

alter table asset_documents enable row level security;

do $$ begin
  create policy asset_documents_select on asset_documents for select using (auth.uid() is not null);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy asset_documents_insert on asset_documents for insert with check (is_admin());
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy asset_documents_delete on asset_documents for delete using (is_admin());
exception when duplicate_object then null;
end $$;

insert into storage.buckets (id, name, public)
values ('asset-documents', 'asset-documents', false)
on conflict (id) do nothing;

do $$ begin
  create policy asset_documents_storage_select on storage.objects for select
    using (bucket_id = 'asset-documents' and auth.uid() is not null);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy asset_documents_storage_insert on storage.objects for insert
    with check (bucket_id = 'asset-documents' and is_admin());
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy asset_documents_storage_delete on storage.objects for delete
    using (bucket_id = 'asset-documents' and is_admin());
exception when duplicate_object then null;
end $$;

-- ============================================================
-- Asset Type / Brand catalog (see supabase/migrations/20261002000000_asset_type_brand_catalog.sql
-- for the authoritative, independently-applied version of this change)
-- ============================================================
create table if not exists asset_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists asset_type_brands (
  asset_type_id uuid not null references asset_types(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  primary key (asset_type_id, brand_id)
);

alter table asset_types enable row level security;
alter table brands enable row level security;
alter table asset_type_brands enable row level security;

do $$ begin
  create policy asset_types_select on asset_types for select using (auth.uid() is not null);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy asset_types_insert on asset_types for insert with check (is_admin());
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy asset_types_update on asset_types for update using (is_admin()) with check (is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy brands_select on brands for select using (auth.uid() is not null);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy brands_insert on brands for insert with check (is_admin());
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy brands_update on brands for update using (is_admin()) with check (is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy asset_type_brands_select on asset_type_brands for select using (auth.uid() is not null);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy asset_type_brands_insert on asset_type_brands for insert with check (is_admin());
exception when duplicate_object then null;
end $$;

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

-- ============================================================
-- Expanded laptop/phone brand list (see
-- supabase/migrations/20261003000000_expand_laptop_phone_brands.sql
-- for the authoritative, independently-applied version of this change)
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

-- ============================================================
-- Camera-accessory types, "Machine", and Simcard/Camera/Mouse brands
-- (see supabase/migrations/20261004000000_camera_simcard_mouse_brands.sql
-- for the authoritative, independently-applied version of this change)
-- ============================================================
insert into asset_types (name, sort_order) values
  ('Camera Battery', 141), ('Camera Battery Charger', 142), ('Camera Adapter', 143),
  ('Camera Stabilization', 144), ('Camera Tripod', 145), ('Camera Mic', 146),
  ('Machine', 210)
on conflict (name) do nothing;

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
