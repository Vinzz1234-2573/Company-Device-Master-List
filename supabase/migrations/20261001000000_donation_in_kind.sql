-- ============================================================
-- Donation in Kind: a special acquisition case for assets that
-- arrive as non-cash donations (equipment, furniture, food,
-- supplies, vehicles, etc.) rather than being purchased.
-- ============================================================

create type acquisition_type as enum ('purchased', 'donation_in_kind');

alter table assets
  add column acquisition_type acquisition_type not null default 'purchased',
  add column quantity integer not null default 1,
  add column donor_name text,
  add column donation_value numeric(14, 2),
  add column donation_received_date date;

alter table assets
  add constraint assets_quantity_positive check (quantity > 0),
  add constraint assets_donation_requires_donor
    check (acquisition_type <> 'donation_in_kind' or donor_name is not null);

create index assets_acquisition_type_idx on assets (acquisition_type);

comment on column assets.acquisition_type is 'How the asset was acquired: purchased, or donation_in_kind (non-cash donation).';
comment on column assets.quantity is 'Number of identical units this record represents (mainly for bulk/consumable donations, e.g. 50 chairs).';
comment on column assets.donor_name is 'Name of the donor organisation/individual. Required when acquisition_type = donation_in_kind.';
comment on column assets.donation_value is 'Estimated fair value of the in-kind donation, for financial recognition.';
comment on column assets.donation_received_date is 'Date the donation was received (may differ from created_at).';

-- ============================================================
-- Supporting documents (donation letters, delivery orders,
-- photos, etc.) attached to an asset record.
-- ============================================================
create table asset_documents (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  file_size bigint,
  content_type text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index asset_documents_asset_idx on asset_documents (asset_id);

alter table asset_documents enable row level security;

create policy asset_documents_select on asset_documents for select using (auth.uid() is not null);
create policy asset_documents_insert on asset_documents for insert with check (is_admin());
create policy asset_documents_delete on asset_documents for delete using (is_admin());

-- Private storage bucket backing asset_documents.storage_path.
insert into storage.buckets (id, name, public)
values ('asset-documents', 'asset-documents', false)
on conflict (id) do nothing;

create policy asset_documents_storage_select on storage.objects for select
  using (bucket_id = 'asset-documents' and auth.uid() is not null);
create policy asset_documents_storage_insert on storage.objects for insert
  with check (bucket_id = 'asset-documents' and is_admin());
create policy asset_documents_storage_delete on storage.objects for delete
  using (bucket_id = 'asset-documents' and is_admin());
