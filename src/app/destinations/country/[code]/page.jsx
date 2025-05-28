// app/destinations/country/[code]/page.js (Server Component) 

import DestinationCountryPage2 from "./DestinationCountryPage2";

// Country names mapping
const countryNames = {
  "ad": "Andorra", "ae": "United Arab Emirates", "af": "Afghanistan", "ag": "Antigua and Barbuda",
  "ai": "Anguilla", "al": "Albania", "am": "Armenia", "ao": "Angola", "aq": "Antarctica",
  "ar": "Argentina", "as": "American Samoa", "at": "Austria", "au": "Australia", "aw": "Aruba",
  "ax": "Åland Islands", "az": "Azerbaijan", "ba": "Bosnia and Herzegovina", "bb": "Barbados",
  "bd": "Bangladesh", "be": "Belgium", "bf": "Burkina Faso", "bg": "Bulgaria", "bh": "Bahrain",
  "bi": "Burundi", "bj": "Benin", "bl": "Saint Barthélemy", "bm": "Bermuda", "bn": "Brunei",
  "bo": "Bolivia", "bq": "Caribbean Netherlands", "br": "Brazil", "bs": "Bahamas", "bt": "Bhutan",
  "bv": "Bouvet Island", "bw": "Botswana", "by": "Belarus", "bz": "Belize", "ca": "Canada",
  "cc": "Cocos (Keeling) Islands", "cd": "Congo (DRC)", "cf": "Central African Republic",
  "cg": "Congo (Republic)", "ch": "Switzerland", "ci": "Côte d'Ivoire", "ck": "Cook Islands",
  "cl": "Chile", "cm": "Cameroon", "cn": "China", "co": "Colombia", "cr": "Costa Rica",
  "cu": "Cuba", "cv": "Cape Verde", "cw": "Curaçao", "cx": "Christmas Island", "cy": "Cyprus",
  "cz": "Czechia", "de": "Germany", "dj": "Djibouti", "dk": "Denmark", "dm": "Dominica",
  "do": "Dominican Republic", "dz": "Algeria", "ec": "Ecuador", "ee": "Estonia", "eg": "Egypt",
  "eh": "Western Sahara", "er": "Eritrea", "es": "Spain", "et": "Ethiopia", "fi": "Finland",
  "fj": "Fiji", "fm": "Micronesia", "fo": "Faroe Islands", "fr": "France", "ga": "Gabon",
  "gb": "United Kingdom", "gd": "Grenada", "ge": "Georgia", "gf": "French Guiana", "gg": "Guernsey",
  "gh": "Ghana", "gi": "Gibraltar", "gl": "Greenland", "gm": "Gambia", "gn": "Guinea",
  "gp": "Guadeloupe", "gq": "Equatorial Guinea", "gr": "Greece", "gt": "Guatemala", "gu": "Guam",
  "gw": "Guinea-Bissau", "gy": "Guyana", "hk": "Hong Kong", "hm": "Heard Island and McDonald Islands",
  "hn": "Honduras", "hr": "Croatia", "ht": "Haiti", "hu": "Hungary", "id": "Indonesia",
  "ie": "Ireland", "il": "Israel", "im": "Isle of Man", "in": "India", "io": "British Indian Ocean Territory",
  "iq": "Iraq", "ir": "Iran", "is": "Iceland", "it": "Italy", "je": "Jersey", "jm": "Jamaica",
  "jo": "Jordan", "jp": "Japan", "ke": "Kenya", "kg": "Kyrgyzstan", "kh": "Cambodia",
  "ki": "Kiribati", "km": "Comoros", "kn": "Saint Kitts and Nevis", "kp": "North Korea",
  "kr": "South Korea", "kw": "Kuwait", "ky": "Cayman Islands", "kz": "Kazakhstan", "la": "Laos",
  "lb": "Lebanon", "lc": "Saint Lucia", "li": "Liechtenstein", "lk": "Sri Lanka", "lr": "Liberia",
  "ls": "Lesotho", "lt": "Lithuania", "lu": "Luxembourg", "lv": "Latvia", "ly": "Libya",
  "ma": "Morocco", "mc": "Monaco", "md": "Moldova", "me": "Montenegro", "mf": "Saint Martin",
  "mg": "Madagascar", "mh": "Marshall Islands", "mk": "North Macedonia", "ml": "Mali",
  "mm": "Myanmar", "mn": "Mongolia", "mo": "Macao", "mp": "Northern Mariana Islands",
  "mq": "Martinique", "mr": "Mauritania", "ms": "Montserrat", "mt": "Malta", "mu": "Mauritius",
  "mv": "Maldives", "mw": "Malawi", "mx": "Mexico", "my": "Malaysia", "mz": "Mozambique",
  "na": "Namibia", "nc": "New Caledonia", "ne": "Niger", "nf": "Norfolk Island", "ng": "Nigeria",
  "ni": "Nicaragua", "nl": "Netherlands", "no": "Norway", "np": "Nepal", "nr": "Nauru",
  "nu": "Niue", "nz": "New Zealand", "om": "Oman", "pa": "Panama", "pe": "Peru", "pf": "French Polynesia",
  "pg": "Papua New Guinea", "ph": "Philippines", "pk": "Pakistan", "pl": "Poland",
  "pm": "Saint Pierre and Miquelon", "pn": "Pitcairn Islands", "pr": "Puerto Rico", "pt": "Portugal",
  "pw": "Palau", "py": "Paraguay", "qa": "Qatar", "re": "Réunion", "ro": "Romania", "rs": "Serbia",
  "ru": "Russia", "rw": "Rwanda", "sa": "Saudi Arabia", "sb": "Solomon Islands", "sc": "Seychelles",
  "sd": "Sudan", "se": "Sweden", "sg": "Singapore", "sh": "Saint Helena", "si": "Slovenia",
  "sj": "Svalbard and Jan Mayen", "sk": "Slovakia", "sl": "Sierra Leone", "sm": "San Marino",
  "sn": "Senegal", "so": "Somalia", "sr": "Suriname", "ss": "South Sudan", "st": "São Tomé and Príncipe",
  "sv": "El Salvador", "sx": "Sint Maarten", "sy": "Syria", "sz": "Eswatini", "tc": "Turks and Caicos Islands",
  "td": "Chad", "tf": "French Southern Territories", "tg": "Togo", "th": "Thailand", "tj": "Tajikistan",
  "tk": "Tokelau", "tl": "Timor-Leste", "tm": "Turkmenistan", "tn": "Tunisia", "to": "Tonga",
  "tr": "Turkey", "tt": "Trinidad and Tobago", "tv": "Tuvalu", "tz": "Tanzania", "ua": "Ukraine",
  "ug": "Uganda", "um": "U.S. Outlying Islands", "us": "United States", "uy": "Uruguay",
  "uz": "Uzbekistan", "va": "Vatican City", "vc": "Saint Vincent and the Grenadines",
  "ve": "Venezuela", "vg": "British Virgin Islands", "vi": "U.S. Virgin Islands", "vn": "Vietnam",
  "vu": "Vanuatu", "wf": "Wallis and Futuna", "ws": "Samoa", "ye": "Yemen", "yt": "Mayotte",
  "za": "South Africa", "zm": "Zambia", "zw": "Zimbabwe"
};

// Helper function to get country name
function getCountryName(code) {
  return countryNames[code.toLowerCase()] || code.toUpperCase();
}

// Fetch pricing and package data for metadata
async function getCountryMetadata(code) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fliday.com';
    
    // Fetch packages for this country
    const response = await fetch(
      `${baseUrl}/api/esim/packages?locationCode=${code.toUpperCase()}`,
      { 
        next: { revalidate: 3600 }, // Cache for 1 hour
        headers: {
          'User-Agent': 'Fliday-SEO-Bot/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch packages');
    }
    
    const data = await response.json();
    
    if (data.success && data.data.length > 0) {
      const packages = data.data;
      
      // Get pricing info
      const prices = packages.map(pkg => 
        typeof pkg.price === 'number' ? pkg.price / 10000 : parseFloat(pkg.price) || 0
      ).filter(price => price > 0);
      
      const dataAmounts = packages.map(pkg => 
        parseFloat(pkg.dataAmount?.replace('GB', '').trim()) || 0
      ).filter(amount => amount > 0);
      
      return {
        startingPrice: Math.min(...prices).toFixed(2),
        maxPrice: Math.max(...prices).toFixed(2),
        currency: packages[0].currency || 'USD',
        minData: Math.min(...dataAmounts),
        maxData: Math.max(...dataAmounts),
        packageCount: packages.length,
        durations: [...new Set(packages.map(pkg => pkg.duration))].join(', ')
      };
    }
  } catch (error) {
    console.error('Error fetching country metadata:', error);
  }
  
  // Fallback data
  return {
    startingPrice: "3.99",
    maxPrice: "49.99", 
    currency: "USD",
    minData: 1,
    maxData: 20,
    packageCount: 6,
    durations: "7, 15, 30"
  };
}

// Generate metadata with real data
export async function generateMetadata({ params }) {
  const { code } = await params; // Await params to access code
  const countryCode = code.toLowerCase();
  const countryName = getCountryName(countryCode);
  const metadata = await getCountryMetadata(countryCode);
  
  // Create SEO-optimized title and description
  const title = `Buy eSIM for ${countryName} – Instant Activation | Fliday`;
  
  const description = `Get a prepaid ${countryName} eSIM with instant delivery. ${metadata.packageCount} plans available from ${metadata.minData}GB to ${metadata.maxData}GB. Starting from ${metadata.currency} ${metadata.startingPrice}. Perfect for tourists, business travelers, and digital nomads.`;
  
  // Comprehensive keywords for this country
  const keywords = [
    `${countryName} eSIM`,
    `eSIM ${countryName}`,
    `${countryName} travel SIM`,
    `prepaid eSIM ${countryName}`,
    `${countryName} mobile data`,
    `travel SIM ${countryName}`,
    `${countryName} internet`,
    `eSIM for ${countryName}`,
    `${countryName} data plan`,
    `instant eSIM ${countryName}`,
    `${countryName} tourist SIM`,
    `${countryName} business travel`,
    `mobile data ${countryName}`,
    `${countryName} connectivity`,
    `${countryName} roaming`,
    `best eSIM ${countryName}`,
    `cheap eSIM ${countryName}`,
    `${countryName} SIM card`,
    'international eSIM',
    'travel eSIM',
    'digital nomad SIM',
    'roaming alternative',
    'virtual SIM card',
    'eSIM activation',
    'prepaid data plan'
  ];
  
  return {
    title,
    description,
    keywords: keywords.join(', '),
    
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'en_US',
      url: `https://fliday.com/destinations/country/${countryCode}`,
      siteName: 'Fliday',
      images: [
        {
          url: `https://fliday.com/flags/${countryCode}_flag.jpeg`,
          width: 1200,
          height: 630,
          alt: `${countryName} eSIM plans starting from ${metadata.currency} ${metadata.startingPrice} - Fliday`,
        }
      ],
    },
    
    twitter: {
      card: 'summary_large_image',
      title: `${countryName} eSIM from ${metadata.currency} ${metadata.startingPrice} | Fliday`,
      description: `Get instant ${countryName} eSIM with ${metadata.packageCount} data plans. ${metadata.minData}GB-${metadata.maxData}GB options available.`,
      images: [`https://fliday.com/flags/${countryCode}_flag.jpeg`],
    },
    
    alternates: {
      canonical: `https://fliday.com/destinations/country/${countryCode}`,
    },
    
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    // Additional SEO metadata
    other: {
      'price': metadata.startingPrice,
      'priceCurrency': metadata.currency,
      'availability': 'InStock',
      'geo.region': countryCode.toUpperCase(),
      'geo.placename': countryName,
    },
  };
}

// Generate static params for popular countries (optional for better performance)
export async function generateStaticParams() {
  // Return first 50 most popular countries for static generation
  const popularCountries = [
    'us', 'gb', 'fr', 'de', 'it', 'es', 'ca', 'au', 'jp', 'kr',
    'sg', 'th', 'in', 'cn', 'mx', 'br', 'ar', 'nl', 'ch', 'at',
    'be', 'se', 'no', 'dk', 'fi', 'ie', 'pt', 'gr', 'tr', 'pl',
    'cz', 'hu', 'ro', 'bg', 'hr', 'si', 'sk', 'ee', 'lv', 'lt',
    'is', 'mt', 'cy', 'lu', 'nz', 'za', 'eg', 'ma', 'tn', 'ke'
  ];
  
  return popularCountries.map((code) => ({
    code: code,
  }));
}

// Server component - just passes data to client component
export default async function DestinationCountryPage({ params }) {
  const { code } = await params; // Await params to access code
  const countryName = getCountryName(code);
  
  return (
    <DestinationCountryPage2
      code={code} 
      countryName={countryName}
    />
  );
}