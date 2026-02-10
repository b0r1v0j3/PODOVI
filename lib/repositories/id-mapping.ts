// =========================================
// UUID ↔ legacy numeric ID mappings
// =========================================
// These mappings bridge the gap between Supabase UUID-based IDs
// and legacy numeric string IDs used throughout the codebase.

export const CATEGORY_UUID_TO_LEGACY: Record<string, string> = {
    'c04a25fa-88a7-4830-a14a-03c726e80647': '1',  // Laminat
    '1dd40c7b-1c3b-4d51-b8a0-2ae81f76ffa1': '2',  // Vinil
    'b449daa6-9eec-44cf-b231-a0e6192bc643': '3',  // Parket
    '0a7d7460-e78c-43ac-8734-34d2b3bae394': '4',  // Tekstilne ploče
    '5b74c171-3d62-4870-9e4e-eafebbd4c321': '5',  // Deking
    '0910335d-8f7d-41bd-91a6-363b947e6165': '6',  // LVT
    'e337a818-df3e-426a-a5a6-95fddd2e3907': '7',  // Linoleum
};

export const CATEGORY_LEGACY_TO_UUID: Record<string, string> = Object.fromEntries(
    Object.entries(CATEGORY_UUID_TO_LEGACY).map(([uuid, legacy]) => [legacy, uuid])
);

export const BRAND_UUID_TO_LEGACY: Record<string, string> = {
    '636c864b-47eb-4e1b-aa1a-e3bab2a0ee96': '1',  // Tarkett
    'a347a773-07a3-4cbe-a114-26cd8bace2ec': '6',  // Gerflor
};

export const BRAND_LEGACY_TO_UUID: Record<string, string> = Object.fromEntries(
    Object.entries(BRAND_UUID_TO_LEGACY).map(([uuid, legacy]) => [legacy, uuid])
);

/** Map a UUID category_id to its legacy numeric string */
export function mapCategoryId(id: string): string {
    return CATEGORY_UUID_TO_LEGACY[id] || id;
}

/** Map a legacy numeric category ID to its UUID (for Supabase queries) */
export function mapCategoryIdToUUID(id: string): string {
    return CATEGORY_LEGACY_TO_UUID[id] || id;
}

/** Map a UUID brand_id to its legacy numeric string */
export function mapBrandId(id: string): string {
    return BRAND_UUID_TO_LEGACY[id] || id;
}

/** Map a legacy numeric brand ID to its UUID (for Supabase queries) */
export function mapBrandIdToUUID(id: string): string {
    return BRAND_LEGACY_TO_UUID[id] || id;
}
