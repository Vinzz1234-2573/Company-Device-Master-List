import type { SupabaseClient } from '@supabase/supabase-js';

export type AssetCatalog = {
  types: string[];
  brandsByType: Record<string, string[]>;
  allBrands: string[];
};

/**
 * The asset type / brand dropdown options: the curated master list, plus any
 * distinct value already in use on a real asset that isn't in that list yet
 * (so older/legacy data is always selectable, never silently hidden).
 */
export async function getAssetCatalog(supabase: SupabaseClient): Promise<AssetCatalog> {
  const [{ data: assetTypes }, { data: brands }, { data: links }, { data: existing }] = await Promise.all([
    supabase.from('asset_types').select('name').eq('is_active', true).order('sort_order'),
    supabase.from('brands').select('id, name').eq('is_active', true).order('name'),
    supabase.from('asset_type_brands').select('asset_type_id, brand_id, asset_types(name), brands(name)'),
    supabase.from('assets').select('asset_type, brand'),
  ]);

  const typeSet = new Set((assetTypes || []).map(t => t.name));
  const brandSet = new Set((brands || []).map(b => b.name));

  const brandsByType: Record<string, Set<string>> = {};
  for (const name of typeSet) brandsByType[name] = new Set();
  for (const link of (links || []) as unknown as { asset_types: { name: string } | null; brands: { name: string } | null }[]) {
    const typeName = link.asset_types?.name;
    const brandName = link.brands?.name;
    if (!typeName || !brandName) continue;
    if (!brandsByType[typeName]) brandsByType[typeName] = new Set();
    brandsByType[typeName].add(brandName);
  }

  // Fold in legacy/free-text values already used on real assets so nothing
  // existing becomes unselectable just because it predates the catalog.
  for (const row of existing || []) {
    if (row.asset_type && !typeSet.has(row.asset_type)) {
      typeSet.add(row.asset_type);
      brandsByType[row.asset_type] = brandsByType[row.asset_type] || new Set();
    }
    if (row.brand) {
      brandSet.add(row.brand);
      if (row.asset_type) {
        brandsByType[row.asset_type] = brandsByType[row.asset_type] || new Set();
        brandsByType[row.asset_type].add(row.brand);
      }
    }
  }

  typeSet.delete('Other');
  const types = [...typeSet].sort((a, b) => a.localeCompare(b));
  types.push('Other');

  const result: Record<string, string[]> = {};
  for (const [type, set] of Object.entries(brandsByType)) {
    result[type] = [...set].sort((a, b) => a.localeCompare(b));
  }

  return { types, brandsByType: result, allBrands: [...brandSet].sort((a, b) => a.localeCompare(b)) };
}

/**
 * Best-effort: when an asset is saved with a type/brand (or a brand paired
 * with a type) that isn't in the catalog yet — typically via the form's
 * "Other" option — add it, so it shows up as a real option next time. Never
 * blocks or fails the asset save if this doesn't succeed.
 */
export async function growCatalog(supabase: SupabaseClient, assetType: string, brand: string | null) {
  try {
    const { data: typeRow } = await supabase
      .from('asset_types')
      .upsert({ name: assetType }, { onConflict: 'name', ignoreDuplicates: true })
      .select('id')
      .single();

    let typeId = typeRow?.id as string | undefined;
    if (!typeId) {
      const { data } = await supabase.from('asset_types').select('id').eq('name', assetType).single();
      typeId = data?.id;
    }

    if (!brand) return;

    const { data: brandRow } = await supabase
      .from('brands')
      .upsert({ name: brand }, { onConflict: 'name', ignoreDuplicates: true })
      .select('id')
      .single();

    let brandId = brandRow?.id as string | undefined;
    if (!brandId) {
      const { data } = await supabase.from('brands').select('id').eq('name', brand).single();
      brandId = data?.id;
    }

    if (typeId && brandId) {
      await supabase.from('asset_type_brands').upsert({ asset_type_id: typeId, brand_id: brandId }, { onConflict: 'asset_type_id,brand_id', ignoreDuplicates: true });
    }
  } catch {
    // never block an asset save over catalog bookkeeping
  }
}
