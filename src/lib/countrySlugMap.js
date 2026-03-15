// src/lib/countrySlugMap.js

/**
 * Maps SEO slugs to ISO country codes and display names.
 * Covers all ~250 countries/territories in the world.
 * Format: slug → { code, name }
 * 
 * IMPORTANT: `code` values are uppercase ISO 3166-1 alpha-2 codes
 * matching the `countryCode` field in the eSIM API response.
 */
export const slugToCountry = {
  // ── A ──────────────────────────────────────────────────────────────────────
  'afghanistan':                    { code: 'AF', name: 'Afghanistan' },
  'aland-islands':                  { code: 'AX', name: 'Aland Islands' },
  'albania':                        { code: 'AL', name: 'Albania' },
  'algeria':                        { code: 'DZ', name: 'Algeria' },
  'american-samoa':                 { code: 'AS', name: 'American Samoa' },
  'andorra':                        { code: 'AD', name: 'Andorra' },
  'angola':                         { code: 'AO', name: 'Angola' },
  'anguilla':                       { code: 'AI', name: 'Anguilla' },
  'antigua-and-barbuda':            { code: 'AG', name: 'Antigua and Barbuda' },
  'argentina':                      { code: 'AR', name: 'Argentina' },
  'armenia':                        { code: 'AM', name: 'Armenia' },
  'aruba':                          { code: 'AW', name: 'Aruba' },
  'australia':                      { code: 'AU', name: 'Australia' },
  'austria':                        { code: 'AT', name: 'Austria' },
  'azerbaijan':                     { code: 'AZ', name: 'Azerbaijan' },

  // ── B ──────────────────────────────────────────────────────────────────────
  'bahamas':                        { code: 'BS', name: 'Bahamas' },
  'bahrain':                        { code: 'BH', name: 'Bahrain' },
  'bangladesh':                     { code: 'BD', name: 'Bangladesh' },
  'barbados':                       { code: 'BB', name: 'Barbados' },
  'belarus':                        { code: 'BY', name: 'Belarus' },
  'belgium':                        { code: 'BE', name: 'Belgium' },
  'belize':                         { code: 'BZ', name: 'Belize' },
  'benin':                          { code: 'BJ', name: 'Benin' },
  'bermuda':                        { code: 'BM', name: 'Bermuda' },
  'bhutan':                         { code: 'BT', name: 'Bhutan' },
  'bolivia':                        { code: 'BO', name: 'Bolivia' },
  'bosnia':                         { code: 'BA', name: 'Bosnia and Herzegovina' },
  'botswana':                       { code: 'BW', name: 'Botswana' },
  'brazil':                         { code: 'BR', name: 'Brazil' },
  'brunei':                         { code: 'BN', name: 'Brunei Darussalam' },
  'bulgaria':                       { code: 'BG', name: 'Bulgaria' },
  'burkina-faso':                   { code: 'BF', name: 'Burkina Faso' },
  'burundi':                        { code: 'BI', name: 'Burundi' },

  // ── C ──────────────────────────────────────────────────────────────────────
  'cambodia':                       { code: 'KH', name: 'Cambodia' },
  'cameroon':                       { code: 'CM', name: 'Cameroon' },
  'canada':                         { code: 'CA', name: 'Canada' },
  'cape-verde':                     { code: 'CV', name: 'Cape Verde' },
  'cayman-islands':                 { code: 'KY', name: 'Cayman Islands' },
  'central-african-republic':       { code: 'CF', name: 'Central African Republic' },
  'chad':                           { code: 'TD', name: 'Chad' },
  'chile':                          { code: 'CL', name: 'Chile' },
  'china-mainland':                 { code: 'CN', name: 'China mainland' },
  'colombia':                       { code: 'CO', name: 'Colombia' },
  'comoros':                        { code: 'KM', name: 'Comoros' },
  'democratic-republic-of-the-congo': { code: 'CD', name: 'Democratic Republic of the Congo' },
  'republic-of-the-congo':          { code: 'CG', name: 'Republic of the Congo' },
  'cook-islands':                   { code: 'CK', name: 'Cook Islands' },
  'costa-rica':                     { code: 'CR', name: 'Costa Rica' },
  'ivory-coast':                    { code: 'CI', name: "Cote d'Ivoire" },
  'croatia':                        { code: 'HR', name: 'Croatia' },
  'cuba':                           { code: 'CU', name: 'Cuba' },
  'curacao':                        { code: 'CW', name: 'Curaçao' },
  'cyprus':                         { code: 'CY', name: 'Cyprus' },
  'czechia':                        { code: 'CZ', name: 'Czech Republic' },

  // ── D ──────────────────────────────────────────────────────────────────────
  'denmark':                        { code: 'DK', name: 'Denmark' },
  'djibouti':                       { code: 'DJ', name: 'Djibouti' },
  'dominica':                       { code: 'DM', name: 'Dominica' },
  'dominican-republic':             { code: 'DO', name: 'Dominican Republic' },

  // ── E ──────────────────────────────────────────────────────────────────────
  'ecuador':                        { code: 'EC', name: 'Ecuador' },
  'egypt':                          { code: 'EG', name: 'Egypt' },
  'el-salvador':                    { code: 'SV', name: 'El Salvador' },
  'equatorial-guinea':              { code: 'GQ', name: 'Equatorial Guinea' },
  'eritrea':                        { code: 'ER', name: 'Eritrea' },
  'estonia':                        { code: 'EE', name: 'Estonia' },
  'eswatini':                       { code: 'SZ', name: 'Eswatini' },
  'ethiopia':                       { code: 'ET', name: 'Ethiopia' },

  // ── F ──────────────────────────────────────────────────────────────────────
  'faroe-islands':                  { code: 'FO', name: 'Faroe Islands' },
  'fiji':                           { code: 'FJ', name: 'Fiji' },
  'finland':                        { code: 'FI', name: 'Finland' },
  'france':                         { code: 'FR', name: 'France' },
  'french-guiana':                  { code: 'GF', name: 'French Guiana' },
  'french-polynesia':               { code: 'PF', name: 'French Polynesia' },

  // ── G ──────────────────────────────────────────────────────────────────────
  'gabon':                          { code: 'GA', name: 'Gabon' },
  'gambia':                         { code: 'GM', name: 'Gambia' },
  'georgia':                        { code: 'GE', name: 'Georgia' },
  'germany':                        { code: 'DE', name: 'Germany' },
  'ghana':                          { code: 'GH', name: 'Ghana' },
  'gibraltar':                      { code: 'GI', name: 'Gibraltar' },
  'greece':                         { code: 'GR', name: 'Greece' },
  'greenland':                      { code: 'GL', name: 'Greenland' },
  'grenada':                        { code: 'GD', name: 'Grenada' },
  'guadeloupe':                     { code: 'GP', name: 'Guadeloupe' },
  'guam':                           { code: 'GU', name: 'Guam' },
  'guatemala':                      { code: 'GT', name: 'Guatemala' },
  'guernsey':                       { code: 'GG', name: 'Guernsey' },
  'guinea':                         { code: 'GN', name: 'Guinea' },
  'guinea-bissau':                  { code: 'GW', name: 'Guinea-Bissau' },
  'guyana':                         { code: 'GY', name: 'Guyana' },

  // ── H ──────────────────────────────────────────────────────────────────────
  'haiti':                          { code: 'HT', name: 'Haiti' },
  'honduras':                       { code: 'HN', name: 'Honduras' },
  'hong-kong':                      { code: 'HK', name: 'Hong Kong (China)' },
  'hungary':                        { code: 'HU', name: 'Hungary' },

  // ── I ──────────────────────────────────────────────────────────────────────
  'iceland':                        { code: 'IS', name: 'Iceland' },
  'india':                          { code: 'IN', name: 'India' },
  'indonesia':                      { code: 'ID', name: 'Indonesia' },
  'iran':                           { code: 'IR', name: 'Iran' },
  'iraq':                           { code: 'IQ', name: 'Iraq' },
  'ireland':                        { code: 'IE', name: 'Ireland' },
  'isle-of-man':                    { code: 'IM', name: 'Isle of Man' },
  'israel':                         { code: 'IL', name: 'Israel' },
  'italy':                          { code: 'IT', name: 'Italy' },

  // ── J ──────────────────────────────────────────────────────────────────────
  'jamaica':                        { code: 'JM', name: 'Jamaica' },
  'japan':                          { code: 'JP', name: 'Japan' },
  'jersey':                         { code: 'JE', name: 'Jersey' },
  'jordan':                         { code: 'JO', name: 'Jordan' },

  // ── K ──────────────────────────────────────────────────────────────────────
  'kazakhstan':                     { code: 'KZ', name: 'Kazakhstan' },
  'kenya':                          { code: 'KE', name: 'Kenya' },
  'kiribati':                       { code: 'KI', name: 'Kiribati' },
  'kosovo':                         { code: 'XK', name: 'Kosovo' },
  'kuwait':                         { code: 'KW', name: 'Kuwait' },
  'kyrgyzstan':                     { code: 'KG', name: 'Kyrgyzstan' },

  // ── L ──────────────────────────────────────────────────────────────────────
  'laos':                           { code: 'LA', name: 'Laos' },
  'latvia':                         { code: 'LV', name: 'Latvia' },
  'lebanon':                        { code: 'LB', name: 'Lebanon' },
  'lesotho':                        { code: 'LS', name: 'Lesotho' },
  'liberia':                        { code: 'LR', name: 'Liberia' },
  'libya':                          { code: 'LY', name: 'Libya' },
  'liechtenstein':                  { code: 'LI', name: 'Liechtenstein' },
  'lithuania':                      { code: 'LT', name: 'Lithuania' },
  'luxembourg':                     { code: 'LU', name: 'Luxembourg' },

  // ── M ──────────────────────────────────────────────────────────────────────
  'macao':                          { code: 'MO', name: 'Macao (China)' },
  'madagascar':                     { code: 'MG', name: 'Madagascar' },
  'malawi':                         { code: 'MW', name: 'Malawi' },
  'malaysia':                       { code: 'MY', name: 'Malaysia' },
  'maldives':                       { code: 'MV', name: 'Maldives' },
  'mali':                           { code: 'ML', name: 'Mali' },
  'malta':                          { code: 'MT', name: 'Malta' },
  'martinique':                     { code: 'MQ', name: 'Martinique' },
  'mauritania':                     { code: 'MR', name: 'Mauritania' },
  'mauritius':                      { code: 'MU', name: 'Mauritius' },
  'mayotte':                        { code: 'YT', name: 'Mayotte' },
  'mexico':                         { code: 'MX', name: 'Mexico' },
  'moldova':                        { code: 'MD', name: 'Moldova' },
  'monaco':                         { code: 'MC', name: 'Monaco' },
  'mongolia':                       { code: 'MN', name: 'Mongolia' },
  'montenegro':                     { code: 'ME', name: 'Montenegro' },
  'montserrat':                     { code: 'MS', name: 'Montserrat' },
  'morocco':                        { code: 'MA', name: 'Morocco' },
  'mozambique':                     { code: 'MZ', name: 'Mozambique' },
  'myanmar':                        { code: 'MM', name: 'Myanmar' },

  // ── N ──────────────────────────────────────────────────────────────────────
  'namibia':                        { code: 'NA', name: 'Namibia' },
  'nepal':                          { code: 'NP', name: 'Nepal' },
  'netherlands':                    { code: 'NL', name: 'Netherlands' },
  'new-caledonia':                  { code: 'NC', name: 'New Caledonia' },
  'new-zealand':                    { code: 'NZ', name: 'New Zealand' },
  'nicaragua':                      { code: 'NI', name: 'Nicaragua' },
  'niger':                          { code: 'NE', name: 'Niger' },
  'nigeria':                        { code: 'NG', name: 'Nigeria' },
  'north-korea':                    { code: 'KP', name: 'North Korea' },
  'north-macedonia':                { code: 'MK', name: 'North Macedonia' },
  'northern-mariana-islands':       { code: 'MP', name: 'Northern Mariana Islands' },
  'norway':                         { code: 'NO', name: 'Norway' },

  // ── O ──────────────────────────────────────────────────────────────────────
  'oman':                           { code: 'OM', name: 'Oman' },

  // ── P ──────────────────────────────────────────────────────────────────────
  'pakistan':                       { code: 'PK', name: 'Pakistan' },
  'palau':                          { code: 'PW', name: 'Palau' },
  'palestine':                      { code: 'PS', name: 'Palestine' },
  'panama':                         { code: 'PA', name: 'Panama' },
  'papua-new-guinea':               { code: 'PG', name: 'Papua New Guinea' },
  'paraguay':                       { code: 'PY', name: 'Paraguay' },
  'peru':                           { code: 'PE', name: 'Peru' },
  'philippines':                    { code: 'PH', name: 'Philippines' },
  'poland':                         { code: 'PL', name: 'Poland' },
  'portugal':                       { code: 'PT', name: 'Portugal' },
  'puerto-rico':                    { code: 'PR', name: 'Puerto Rico' },

  // ── Q ──────────────────────────────────────────────────────────────────────
  'qatar':                          { code: 'QA', name: 'Qatar' },

  // ── R ──────────────────────────────────────────────────────────────────────
  'reunion':                        { code: 'RE', name: 'Reunion' },
  'romania':                        { code: 'RO', name: 'Romania' },
  'russia':                         { code: 'RU', name: 'Russia' },
  'rwanda':                         { code: 'RW', name: 'Rwanda' },

  // ── S ──────────────────────────────────────────────────────────────────────
  'saint-helena':                   { code: 'SH', name: 'Saint Helena' },
  'saint-kitts-and-nevis':          { code: 'KN', name: 'Saint Kitts and Nevis' },
  'saint-lucia':                    { code: 'LC', name: 'Saint Lucia' },
  'saint-martin':                   { code: 'MF', name: 'Saint Martin' },
  'saint-pierre-and-miquelon':      { code: 'PM', name: 'Saint Pierre and Miquelon' },
  'saint-vincent-and-the-grenadines': { code: 'VC', name: 'Saint Vincent and the Grenadines' },
  'samoa':                          { code: 'WS', name: 'Samoa' },
  'san-marino':                     { code: 'SM', name: 'San Marino' },
  'sao-tome-and-principe':          { code: 'ST', name: 'Sao Tome and Principe' },
  'saudi-arabia':                   { code: 'SA', name: 'Saudi Arabia' },
  'senegal':                        { code: 'SN', name: 'Senegal' },
  'serbia':                         { code: 'RS', name: 'Serbia' },
  'seychelles':                     { code: 'SC', name: 'Seychelles' },
  'sierra-leone':                   { code: 'SL', name: 'Sierra Leone' },
  'singapore':                      { code: 'SG', name: 'Singapore' },
  'sint-maarten':                   { code: 'SX', name: 'Sint Maarten' },
  'slovakia':                       { code: 'SK', name: 'Slovakia' },
  'slovenia':                       { code: 'SI', name: 'Slovenia' },
  'solomon-islands':                { code: 'SB', name: 'Solomon Islands' },
  'somalia':                        { code: 'SO', name: 'Somalia' },
  'south-africa':                   { code: 'ZA', name: 'South Africa' },
  'south-korea':                    { code: 'KR', name: 'South Korea' },
  'south-sudan':                    { code: 'SS', name: 'South Sudan' },
  'spain':                          { code: 'ES', name: 'Spain' },
  'sri-lanka':                      { code: 'LK', name: 'Sri Lanka' },
  'sudan':                          { code: 'SD', name: 'Sudan' },
  'suriname':                       { code: 'SR', name: 'Suriname' },
  'svalbard':                       { code: 'SJ', name: 'Svalbard and Jan Mayen' },
  'sweden':                         { code: 'SE', name: 'Sweden' },
  'switzerland':                    { code: 'CH', name: 'Switzerland' },
  'syria':                          { code: 'SY', name: 'Syria' },

  // ── T ──────────────────────────────────────────────────────────────────────
  'taiwan':                         { code: 'TW', name: 'Taiwan' },
  'tajikistan':                     { code: 'TJ', name: 'Tajikistan' },
  'tanzania':                       { code: 'TZ', name: 'Tanzania' },
  'thailand':                       { code: 'TH', name: 'Thailand' },
  'timor-leste':                    { code: 'TL', name: 'Timor-Leste' },
  'togo':                           { code: 'TG', name: 'Togo' },
  'tonga':                          { code: 'TO', name: 'Tonga' },
  'trinidad-tobago':                { code: 'TT', name: 'Trinidad and Tobago' },
  'tunisia':                        { code: 'TN', name: 'Tunisia' },
  'turkey':                         { code: 'TR', name: 'Turkey' },
  'turkmenistan':                   { code: 'TM', name: 'Turkmenistan' },
  'turks-and-caicos-islands':       { code: 'TC', name: 'Turks and Caicos Islands' },

  // ── U ──────────────────────────────────────────────────────────────────────
  'uae':                            { code: 'AE', name: 'United Arab Emirates' },
  'uganda':                         { code: 'UG', name: 'Uganda' },
  'ukraine':                        { code: 'UA', name: 'Ukraine' },
  'united-kingdom':                 { code: 'GB', name: 'United Kingdom' },
  'usa':                            { code: 'US', name: 'United States' },
  'uruguay':                        { code: 'UY', name: 'Uruguay' },
  'us-virgin-islands':              { code: 'VI', name: 'US Virgin Islands' },
  'uzbekistan':                     { code: 'UZ', name: 'Uzbekistan' },

  // ── V ──────────────────────────────────────────────────────────────────────
  'vanuatu':                        { code: 'VU', name: 'Vanuatu' },
  'venezuela':                      { code: 'VE', name: 'Venezuela' },
  'vietnam':                        { code: 'VN', name: 'Vietnam' },
  'virgin-islands-british':         { code: 'VG', name: 'Virgin Islands- British' },

  // ── W ──────────────────────────────────────────────────────────────────────
  'wallis-and-futuna':              { code: 'WF', name: 'Wallis and Futuna' },

  // ── Y ──────────────────────────────────────────────────────────────────────
  'yemen':                          { code: 'YE', name: 'Yemen' },

  // ── Z ──────────────────────────────────────────────────────────────────────
  'zambia':                         { code: 'ZM', name: 'Zambia' },
  'zimbabwe':                       { code: 'ZW', name: 'Zimbabwe' },
};

/**
 * Reverse map: uppercase ISO code → slug
 * e.g. "US" → "usa", "AF" → "afghanistan"
 */
export const countryCodeToSlug = Object.fromEntries(
  Object.entries(slugToCountry).map(([slug, { code }]) => [code, slug])
);

/**
 * Given a country code like "us" or "US", returns the SEO URL: "/esim-usa"
 * Falls back to legacy URL if the country isn't in the map.
 */
export function getEsimUrl(countryCode) {
  const slug = countryCodeToSlug[countryCode.toUpperCase()];
  return slug ? `/esim-country/${slug}` : `/destinations/country/${countryCode.toLowerCase()}`;
}

/**
 * Given a slug like "usa", returns { code: "US", name: "United States" } or null.
 * `code` is always uppercase — pass directly to the packages API as `locationCode`.
 */
export function getCountryBySlug(slug) {
  return slugToCountry[slug] || null;
}
