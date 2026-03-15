// src/lib/regionSlugMap.js
// Derives SEO-friendly URL slugs purely from the region NAME returned by the API.
// We never hardcode API slugs (e.g. "GL-120_1_7") because they change per provider.
// Instead the original API slug is stored on the destination object and passed via
// the URL as a query param so the region page can fetch packages directly.

/**
 * Convert a region name from the API into an SEO URL slug.
 * e.g. "Global 120 Countries" → "global"
 *      "Europe"               → "europe"
 *      "Middle East"          → "middle-east"
 */
export function getRegionUrlSlug(regionName) {
  if (!regionName) return 'region';
  const lower = regionName.toLowerCase().trim();

  if (lower.includes('global') || lower.includes('worldwide') || lower.includes('international')) return 'global';
  if (lower.includes('europe'))                     return 'europe';
  if (lower.includes('asia pacific'))               return 'asia-pacific';
  if (lower.includes('asia'))                       return 'asia';
  if (lower.includes('africa'))                     return 'africa';
  if (lower.includes('north america') || lower === 'usa & canada' || lower.includes('usa-canada')) return 'north-america';
  if (lower.includes('south america'))              return 'south-america';
  if (lower.includes('latin america'))              return 'latin-america';
  if (lower.includes('middle east') || lower.includes('mena')) return 'middle-east';
  if (lower.includes('gulf'))                       return 'gulf-countries';
  if (lower.includes('caribbean'))                  return 'caribbean';
  if (lower.includes('oceania') || lower.includes('pacific')) return 'oceania';
  if (lower.includes('scandinavia'))                return 'scandinavia';
  if (lower.includes('balkan'))                     return 'balkans';
  if (lower.includes('cis'))                        return 'cis';

  // Generic fallback: slugify the name
  return lower
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Build the full SEO URL for a region destination.
 * Europe and Global have dedicated top-level pages.
 * All other regions use /esim-region/[slug].
 * The original API slug is appended as ?s= so the region page can fetch packages.
 *
 * e.g. getRegionUrl('GL-120_1_7', 'Global 120 Countries') → '/esim-global?s=GL-120_1_7'
 *      getRegionUrl('EU-30_1_7',  'Europe')               → '/esim-europe?s=EU-30_1_7'
 *      getRegionUrl('AS-7',       'Asia')                  → '/esim-region/asia?s=AS-7'
 */
export function getRegionUrl(apiSlug, regionName) {
  const urlSlug = getRegionUrlSlug(regionName);
  const params  = apiSlug ? `?s=${encodeURIComponent(apiSlug)}` : '';

  // Dedicated top-level pages for Europe and Global
  if (urlSlug === 'europe' || urlSlug === 'global') {
    return `/esim-${urlSlug}${params}`;
  }

  // All other regions use the dynamic nested route
  return `/esim-region/${urlSlug}${params}`;
}

/**
 * Get a human-readable display name from a URL slug.
 * Handles known regions and unknown slugs like 'usa-canada', 'asia-pacific'.
 * e.g. getRegionDisplayName('middle-east')  → 'Middle East'
 *      getRegionDisplayName('usa-canada')   → 'USA & Canada'
 *      getRegionDisplayName('asia-pacific') → 'Asia Pacific'
 */
export function getRegionDisplayName(urlSlug) {
  const map = {
    'global':        'Global',
    'europe':        'Europe',
    'asia':          'Asia',
    'africa':        'Africa',
    'north-america': 'North America',
    'south-america': 'South America',
    'latin-america': 'Latin America',
    'middle-east':   'Middle East',
    'caribbean':     'Caribbean',
    'oceania':       'Oceania',
    'asia-pacific':  'Asia Pacific',
    'usa-canada':    'USA & Canada',
    'gulf':          'Gulf Countries',
    'gulf-countries': 'Gulf Countries',
    'balkans':       'Balkans',
    'cis':           'CIS Countries',
    'scandinavia':   'Scandinavia',
    'mena':          'Middle East & North Africa',
  };
  if (map[urlSlug]) return map[urlSlug];
  // Generic fallback: title-case each word separated by hyphens
  return urlSlug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}