-- ============================================================
-- Correction: the earlier migration assumed the real asset using
-- type "Machine" was a credit-card terminal, same as "Unit Credit
-- card machine". Reading its actual description ("Money Counting
-- Machine") shows that's wrong — it's a different, legitimate
-- category. This does not undo the earlier rename (that renamed the
-- *catalog* label only, which is independent of any asset row's
-- actual asset_type text); it just adds the type that was missing.
-- ============================================================

insert into asset_types (name, sort_order) values ('Money Counting Machine', 212)
on conflict (name) do nothing;
