// app/sitemap.js
import { headers } from 'next/headers'; // ← This is the magic

const countryNames = {
    "ad": "Andorra",
    "ae": "United Arab Emirates",
    "af": "Afghanistan",
    "ag": "Antigua and Barbuda",
    "ai": "Anguilla", 
    "al": "Albania", 
    "am": "Armenia", 
    "ao": "Angola", "aq": "Antarctica",
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
    "ma": "Morocco", "mc": "Monaco", "md": "Moldova",
    "me": "Montenegro",
    "mf": "Saint Martin",
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




export default async function sitemap() {
    const headersList = headers();
    const domain = headersList.get('host') || 'fliday.com';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = `${protocol}://${domain}`;

    // Static pages
    const staticPages = [
        { url: baseUrl, priority: 1.0 },
        { url: `${baseUrl}/destinations`, priority: 0.9 },
        { url: `${baseUrl}/blog`, priority: 0.9 },
        { url: `${baseUrl}/how-it-works`, priority: 0.8 },
        { url: `${baseUrl}/compatibility`, priority: 0.8 },
        { url: `${baseUrl}/faq`, priority: 0.7 },
        { url: `${baseUrl}/support`, priority: 0.7 },
        { url: `${baseUrl}/privacy-policy`, priority: 0.3 },
        { url: `${baseUrl}/terms-of-service`, priority: 0.3 },
        { url: `${baseUrl}/contact`, priority: 0.6 },
    ].map(p => ({
        url: p.url,
        lastModified: new Date(),
        changeFrequency: p.priority >= 0.9 ? "daily" : "weekly",
        priority: p.priority,
    }));

    // Country pages
    const countryPages = Object.keys(countryNames).map(code => ({
        url: `${baseUrl}/destinations/country/${code}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
    }));

    // BLOG POSTS — this now works on Vercel, localhost, everywhere                    
    let blogPosts = [];
    try {
        const res = await fetch(`${baseUrl}/api/internal/blog-list`, {
            cache: 'no-store', // always fresh
            headers: { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
            const posts = await res.json();
            blogPosts = posts.map(post => ({
                url: `${baseUrl}/blog/${post.slug}`,
                lastModified: new Date(post.date),
                changeFrequency: "monthly",
                priority: 0.7,
            }));
        }
    } catch (error) {
        console.warn("Sitemap: Could not load blog posts (this is normal on first deploy)", error.message);
    }

    return [...staticPages, ...countryPages, ...blogPosts];
}

export const revalidate = 600;