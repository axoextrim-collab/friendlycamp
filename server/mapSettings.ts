const DEFAULT_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export function publicMapSettings() {
    const tileUrl = process.env.MAP_TILE_URL?.trim() || DEFAULT_TILES;
    const url = new URL(tileUrl.replace('{z}', '0').replace('{x}', '0').replace('{y}', '0'));
    if (url.protocol !== 'https:' || !['{z}', '{x}', '{y}'].every(value => tileUrl.includes(value)))
        throw new Error('تنظیمات منبع نقشه معتبر نیست.');
    const custom = tileUrl !== DEFAULT_TILES;
    const attribution = custom ? process.env.MAP_ATTRIBUTION_TEXT?.trim() : '© OpenStreetMap contributors';
    const attributionUrl = custom ? process.env.MAP_ATTRIBUTION_URL?.trim() : 'https://www.openstreetmap.org/copyright';
    if (!attribution || !attributionUrl || !/^https:\/\//.test(attributionUrl))
        throw new Error('مشخصات منبع و مجوز نقشه کامل نیست.');
    return { tileUrl, attribution, attributionUrl };
}
export function mapTileOrigin() {
    try {
        return new URL(publicMapSettings().tileUrl).origin;
    }
    catch {
        return 'https://tile.openstreetmap.org';
    }
}
