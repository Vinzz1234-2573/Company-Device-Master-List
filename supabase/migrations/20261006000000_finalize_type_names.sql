-- ============================================================
-- Finalize canonical Asset Type names per the confirmed master list:
--   "Desktop / PC" -> "PC"
--   "Simcard"      -> "SIM Card"
--   "Machine"      -> "Credit Card Machine" (the one real row using this
--                     type is a payment terminal, not a guess)
-- Renaming via UPDATE (not delete+insert) so the existing
-- asset_type_brands links carry over automatically — nothing needs
-- re-linking. Plain UPDATE ... WHERE is naturally idempotent: once
-- the row is renamed, re-running finds nothing left to match.
-- ============================================================

update asset_types set name = 'PC' where name = 'Desktop / PC';
update asset_types set name = 'SIM Card' where name = 'Simcard';
update asset_types set name = 'Credit Card Machine' where name = 'Machine';

insert into asset_types (name, sort_order) values ('Credit Card Machine Charger', 211)
on conflict (name) do nothing;
