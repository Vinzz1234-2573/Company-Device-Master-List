'use client';

import { useState } from 'react';
import type { AssetCatalog } from '@/lib/catalog';

export function TypeBrandFilter({
  catalog,
  defaultType = '',
  defaultBrand = '',
}: {
  catalog: AssetCatalog;
  defaultType?: string;
  defaultBrand?: string;
}) {
  const [type, setType] = useState(defaultType);
  const brandOptions = type ? catalog.brandsByType[type] || [] : catalog.allBrands;

  return (
    <>
      <div>
        <label className="label">Asset Type</label>
        <select name="type" value={type} onChange={e => setType(e.target.value)} className="input">
          <option value="">All types</option>
          {catalog.types
            .filter(t => t !== 'Other')
            .map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
        </select>
      </div>
      <div>
        <label className="label">Brand</label>
        <select name="brand" defaultValue={brandOptions.includes(defaultBrand) ? defaultBrand : ''} key={type} className="input">
          <option value="">{type ? `All ${type} brands` : 'All brands'}</option>
          {brandOptions.map(b => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
