// src/app/destinations/country/[code]/page.jsx
// This old route now redirects to the new SEO URL /esim-country/[slug]
// generateMetadata uses NO API calls — avoids ECONNREFUSED during build

import { redirect } from 'next/navigation';
import { getEsimUrl } from '@/lib/countrySlugMap';
import DestinationCountryPage2 from './DestinationCountryPage2';

const countryNames = {
  "ad":"Andorra","ae":"United Arab Emirates","af":"Afghanistan","ag":"Antigua and Barbuda",
  "ai":"Anguilla","al":"Albania","am":"Armenia","ao":"Angola","ar":"Argentina",
  "as":"American Samoa","at":"Austria","au":"Australia","aw":"Aruba","az":"Azerbaijan",
  "ba":"Bosnia and Herzegovina","bb":"Barbados","bd":"Bangladesh","be":"Belgium",
  "bf":"Burkina Faso","bg":"Bulgaria","bh":"Bahrain","bi":"Burundi","bj":"Benin",
  "bm":"Bermuda","bn":"Brunei","bo":"Bolivia","br":"Brazil","bs":"Bahamas","bt":"Bhutan",
  "bw":"Botswana","by":"Belarus","bz":"Belize","ca":"Canada","cd":"Congo (DRC)",
  "cf":"Central African Republic","cg":"Congo (Republic)","ch":"Switzerland",
  "ci":"Côte d'Ivoire","ck":"Cook Islands","cl":"Chile","cm":"Cameroon","cn":"China",
  "co":"Colombia","cr":"Costa Rica","cu":"Cuba","cv":"Cape Verde","cw":"Curaçao",
  "cy":"Cyprus","cz":"Czechia","de":"Germany","dj":"Djibouti","dk":"Denmark",
  "dm":"Dominica","do":"Dominican Republic","dz":"Algeria","ec":"Ecuador","ee":"Estonia",
  "eg":"Egypt","er":"Eritrea","es":"Spain","et":"Ethiopia","fi":"Finland","fj":"Fiji",
  "fm":"Micronesia","fo":"Faroe Islands","fr":"France","ga":"Gabon","gb":"United Kingdom",
  "gd":"Grenada","ge":"Georgia","gf":"French Guiana","gh":"Ghana","gi":"Gibraltar",
  "gl":"Greenland","gm":"Gambia","gn":"Guinea","gp":"Guadeloupe","gq":"Equatorial Guinea",
  "gr":"Greece","gt":"Guatemala","gu":"Guam","gw":"Guinea-Bissau","gy":"Guyana",
  "hk":"Hong Kong","hn":"Honduras","hr":"Croatia","ht":"Haiti","hu":"Hungary",
  "id":"Indonesia","ie":"Ireland","il":"Israel","im":"Isle of Man","in":"India",
  "iq":"Iraq","ir":"Iran","is":"Iceland","it":"Italy","je":"Jersey","jm":"Jamaica",
  "jo":"Jordan","jp":"Japan","ke":"Kenya","kg":"Kyrgyzstan","kh":"Cambodia",
  "ki":"Kiribati","km":"Comoros","kn":"Saint Kitts and Nevis","kp":"North Korea",
  "kr":"South Korea","kw":"Kuwait","ky":"Cayman Islands","kz":"Kazakhstan","la":"Laos",
  "lb":"Lebanon","lc":"Saint Lucia","li":"Liechtenstein","lk":"Sri Lanka","lr":"Liberia",
  "ls":"Lesotho","lt":"Lithuania","lu":"Luxembourg","lv":"Latvia","ly":"Libya",
  "ma":"Morocco","mc":"Monaco","md":"Moldova","me":"Montenegro","mg":"Madagascar",
  "mk":"North Macedonia","ml":"Mali","mm":"Myanmar","mn":"Mongolia","mo":"Macao",
  "mq":"Martinique","mr":"Mauritania","mt":"Malta","mu":"Mauritius","mv":"Maldives",
  "mw":"Malawi","mx":"Mexico","my":"Malaysia","mz":"Mozambique","na":"Namibia",
  "nc":"New Caledonia","ne":"Niger","ng":"Nigeria","ni":"Nicaragua","nl":"Netherlands",
  "no":"Norway","np":"Nepal","nr":"Nauru","nz":"New Zealand","om":"Oman","pa":"Panama",
  "pe":"Peru","pf":"French Polynesia","pg":"Papua New Guinea","ph":"Philippines",
  "pk":"Pakistan","pl":"Poland","pr":"Puerto Rico","pt":"Portugal","pw":"Palau",
  "py":"Paraguay","qa":"Qatar","ro":"Romania","rs":"Serbia","ru":"Russia","rw":"Rwanda",
  "sa":"Saudi Arabia","sb":"Solomon Islands","sc":"Seychelles","sd":"Sudan","se":"Sweden",
  "sg":"Singapore","si":"Slovenia","sk":"Slovakia","sl":"Sierra Leone","sm":"San Marino",
  "sn":"Senegal","so":"Somalia","sr":"Suriname","ss":"South Sudan","sv":"El Salvador",
  "sy":"Syria","sz":"Eswatini","tc":"Turks and Caicos Islands","td":"Chad","tg":"Togo",
  "th":"Thailand","tj":"Tajikistan","tl":"Timor-Leste","tm":"Turkmenistan","tn":"Tunisia",
  "to":"Tonga","tr":"Turkey","tt":"Trinidad and Tobago","tz":"Tanzania","ua":"Ukraine",
  "ug":"Uganda","us":"United States","uy":"Uruguay","uz":"Uzbekistan",
  "vc":"Saint Vincent and the Grenadines","ve":"Venezuela","vg":"British Virgin Islands",
  "vi":"U.S. Virgin Islands","vn":"Vietnam","vu":"Vanuatu","wf":"Wallis and Futuna",
  "ws":"Samoa","ye":"Yemen","za":"South Africa","zm":"Zambia","zw":"Zimbabwe",
};

function getCountryName(code) {
  return countryNames[code?.toLowerCase()] || code?.toUpperCase() || 'Destination';
}

// ── NO API calls in generateMetadata — uses static data only ─────────────────
export async function generateMetadata({ params }) {
  const { code } = await params;
  const countryName = getCountryName(code);

  return {
    title: `eSIM for ${countryName} | Buy Online - Instant Activation | Fliday`,
    description: `Get a prepaid eSIM for ${countryName}. Instant activation, flexible data plans from 1GB to 20GB. No contracts, no roaming fees.`,
    alternates: {
      canonical: `https://fliday.com/esim-country/${code}`, // Point to new URL
    },
    robots: { index: false, follow: true }, // Don't index old URLs — new ones are canonical
    openGraph: {
      title: `eSIM for ${countryName} | Fliday`,
      description: `Prepaid eSIM for ${countryName}. Instant delivery, flexible plans.`,
      url: `https://fliday.com/destinations/country/${code}`,
    },
  };
}

export async function generateStaticParams() {
  // Only pre-render popular countries — rest are on-demand
  return [
    'us','gb','fr','de','it','es','ca','au','jp','kr',
    'sg','th','in','tr','mx','br','nl','ch','at','gr',
  ].map(code => ({ code }));
}

export default async function DestinationCountryPage({ params }) {
  const { code } = await params;
  const upper = (code || '').toUpperCase();

  // Redirect to new SEO URL
  const newUrl = getEsimUrl(upper);
  if (newUrl && !newUrl.startsWith('/destinations/country/')) {
    redirect(newUrl);
  }

  // Fallback: render old component for unknown codes
  const countryName = getCountryName(code);
  return <DestinationCountryPage2 code={code} countryName={countryName} />;
}