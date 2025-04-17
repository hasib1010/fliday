'use client';
// src\app\destinations\country\[code]\page.jsx
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Info, ChevronLeft } from 'lucide-react';
import FAQSection from '@/components/Home/FAQSection';
import BenefitsSection from '@/components/Home/BenefitsSection';
import SetupProcess from '@/components/Home/SetupProcess';
import Link from 'next/link';
import DestinationSection from './DestinationImage';

export default function DestinationCountryPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code || '';

  // State for API data
  const [countryName, setCountryName] = useState('');
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State to track selected plan and active tab
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [activeTab, setActiveTab] = useState('features');

  // Fetch country data and packages
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Format country name from code
        const formattedName = formatCode(code);
        setCountryName(formattedName);

        // Fetch packages from API
        const packagesResponse = await fetch(`/api/esim/packages?locationCode=${code.toUpperCase()}`);

        if (!packagesResponse.ok) {
          throw new Error(`Failed to fetch packages: ${packagesResponse.status}`);
        }

        const packagesData = await packagesResponse.json();

        if (!packagesData.success) {
          throw new Error(packagesData.message || 'Failed to fetch packages');
        }

        // Process packages and sort by data amount
        const formattedPackages = packagesData.data
          .map(pkg => ({
            id: pkg.packageCode,
            packageCode: pkg.packageCode,
            name: pkg.name,
            dataAmount: pkg.dataAmount,
            duration: pkg.duration,
            price: pkg.price,
            retailPrice: pkg.retailPrice,
            currency: pkg.currency,
            description: pkg.description,
            speed: pkg.speed || '4G/5G',
            networkInfo: pkg.networkInfo || []
          }))
          .sort((a, b) => {
            // Parse data amount for sorting (remove "GB" and convert to number)
            const aGB = parseFloat(a.dataAmount.replace('GB', '').trim());
            const bGB = parseFloat(b.dataAmount.replace('GB', '').trim());
            return aGB - bGB;
          });

        setPackages(formattedPackages);

        // Select the default plan (either a mid-range plan or the first one)
        if (formattedPackages.length > 0) {
          const midIndex = Math.floor(formattedPackages.length / 2);
          setSelectedPlanId(formattedPackages[midIndex]?.id || formattedPackages[0].id);
        }
      } catch (err) {
        console.error('Error fetching destination data:', err);
        setError(err.message || 'Failed to load destination data');
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      fetchData();
    }
  }, [code]);
  console.log(packages);

  // Helper function to format country code to title case
  const formatCode = (code) => {
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
    return countryNames[code.toLowerCase()] || code.toUpperCase();
  };

  // Get the selected plan details
  const selectedPlan = packages.find(pkg => pkg.id === selectedPlanId) || packages[0];

  const imageUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(countryName)},landmark`;

  // Loading state
  if (loading) {
    return (
      <div className="max-w-[1220px] mx-auto pt-32 px-4 lg:px-0">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-gray-200 rounded-full mr-3 animate-pulse"></div>
          <div className="h-8 bg-gray-200 w-72 rounded animate-pulse"></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="hidden lg:block rounded-lg overflow-hidden h-[624px] bg-gray-200 animate-pulse"></div>

          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-20 bg-gray-200 rounded w-full mb-6"></div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="  rounded-lg p-3 h-24 bg-gray-100"></div>
              ))}
            </div>

            <div className="h-12 bg-gray-200 rounded w-full mb-6"></div>
            <div className="h-12 bg-gray-200 rounded w-full mb-6"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !selectedPlan) {
    return (
      <div className="max-w-[1220px] mx-auto px-4 pt-24">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-3 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-medium">Error</h1>
        </div>

        <div className="bg-red-50 p-6 rounded-lg border border-red-100">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Something went wrong</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
          >
            Back to Destinations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1220px] mx-auto px-4 pt-24">
      {/* Back button and title for mobile */}
      <div className="lg:hidden flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="mr-3 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-medium">eSIM for {countryName}</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left column - Destination image */}
        <div className="hidden lg:block rounded-lg overflow-hidden h-[624px] bg-gray-100 border border-gray-200">
          <div className="w-full h-full flex items-center justify-center">
            <DestinationSection countryName={countryName} />

          </div>
        </div>

        {/* Right column - eSIM details and plans */}
        <div>
          {/* Title for desktop */}
          <div className="hidden lg:flex items-center mb-3">
            <div className="w-8 h-8 bg-[#F15A25] rounded-full flex items-center justify-center text-white mr-3">
              <img className='w-full h-full object-cover rounded-full' src={`/flags/${code}_flag.jpeg`} alt="" />
            </div>
            <h1 className="text-[40px] font-medium">eSIM for {countryName}</h1>
          </div>

          <p className="text-gray-600 mb-6">
            Get an eSIM card for {countryName} and enjoy reliable and affordable internet access on your trip.
          </p>

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
              {error}. Some information may not be accurate.
            </div>
          )}

          <h2 className="font-medium mb-4 text-lg">Choose your data plan</h2>

          {/* Data plans grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {packages.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`relative border rounded-lg p-3 text-left transition-all ${selectedPlanId === plan.id
                  ? 'border-[#F15A25] bg-[#FFF8F6]'
                  : 'border-gray-200 hover:border-[#F15A25]'
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    strokeWidth={`${selectedPlanId === plan.id ? '4' : '2'}`}
                    stroke={`${selectedPlanId === plan.id ? '#F15A25' : '#C9C9C9'}`}
                  />
                </svg>
                <div className="flex items-center mt-2 mb-1">
                  <h3 className="font-medium text-base truncate">
                    {plan.dataAmount.includes('GB')
                      ? `${parseFloat(plan.dataAmount)} GB`.replace('.0 GB', ' GB')
                      : plan.dataAmount}
                  </h3>
                </div>
                <div className="text-[.875rem] font-medium text-gray-500 mb-1"><span>{plan.duration}S</span></div>
                <div className="text-sm font-medium">
                  {plan.currency} {typeof plan.price === 'number' ? (plan.price / 10000).toFixed(2) : plan.price}

                </div>

              </button>
            ))}
          </div>

          {/* Plan details */}
          {selectedPlan && (
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-medium mb-2">{selectedPlan.name}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Data:</span> {selectedPlan.dataAmount}
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span> {selectedPlan.duration} days
                  </div>
                  <div>
                    <span className="text-gray-500">Speed:</span> {selectedPlan.speed}
                  </div>

                </div>
              </div>

              {/* Auto-activate section */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Info size={16} className="text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium mb-1">Can I activate my plan later?</p>
                    <p className="text-xs text-gray-600">
                      All plans have a 30-day activation period. If you don't activate within 30 days, it will activate automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3 mb-6">
                <Link
                  href={`/checkout?packageCode=${selectedPlan.packageCode}`}
                  className="block w-full bg-[#F15A25] hover:bg-[#E04E1A] text-white font-medium py-3 rounded-lg text-center transition-colors"
                >
                  Buy Now - {selectedPlan.currency} {typeof selectedPlan.price === 'number' ? (selectedPlan.price / 10000).toFixed(2) : selectedPlan.price}
                </Link>
                <button className="block w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-lg text-center hover:bg-gray-50 transition-colors">
                  Check Device Compatibility
                </button>
              </div>
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-5 h-5 mr-2 flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <span>Secure payment</span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-5 h-5 mr-2 flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <span>Money-back</span>
            </div>
          </div>

          {/* Feature tabs */}
          <div className="border-b border-gray-200 mb-4">
            <div className="flex space-x-6 overflow-x-auto">
              {['features', 'description', 'technical', 'trust'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm font-medium pb-2 whitespace-nowrap transition-colors ${activeTab === tab
                    ? 'text-gray-900 border-b-2 border-[#F15A25]'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="py-4">
            {activeTab === 'features' && (
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>Affordable data from just {packages.length > 0
                    ? `${packages[0].currency} ${Math.min(...packages.map(p => typeof p.price === 'number' ? p.price : 999)).toFixed(2)/10000}`
                    : '$3.00'}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>Stay connected with {countryName}'s top networks</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>Compatible with all eSIM-ready smartphones</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>Instant delivery and activation</span>
                </li>
              </ul>
            )}

            {activeTab === 'description' && (
              <div className="text-gray-700 space-y-3">
                <p>
                  Stay connected in {countryName} without breaking the bank! Whether you're a traveler, tourist, or business explorer, our prepaid eSIM keeps you online effortlessly.
                </p>
                <p>
                  Choose your perfect data plan ({packages.length > 0 ?
                    `${packages[0].dataAmount} to ${packages[packages.length - 1].dataAmount}` :
                    '1GB to 20GB'}), activate instantly, and enjoy {countryName} at full speed.
                </p>
              </div>
            )}

            {activeTab === 'technical' && (
              <div className="text-gray-700 space-y-3">
                <p><span className="font-medium">Activation:</span> Your eSIM activates automatically when you arrive in {countryName}.</p>
                <p><span className="font-medium">Plan Duration:</span> {packages.length > 0 ? packages.map(p => p.duration).filter((v, i, a) => a.indexOf(v) === i).join(' or ') : '7 or 30 days'} options.</p>
                <p><span className="font-medium">Speed:</span> Enjoy fast speeds including {selectedPlan?.speed || '4G/5G'}.</p>
                <p><span className="font-medium">Coverage:</span> Reliable connection in cities and towns across {countryName}.</p>
              </div>
            )}

            {activeTab === 'trust' && (
              <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-[#FFF0EC] flex items-center justify-center flex-shrink-0 mr-4">
                    <CheckCircle className="w-5 h-5 text-[#F15A25]" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Money-back guarantee</h3>
                    <p className="text-sm text-gray-600">Not satisfied? Get a full refund within 30 days if you haven't used the data.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-[#FFF0EC] flex items-center justify-center flex-shrink-0 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F15A25]">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Privacy protection</h3>
                    <p className="text-sm text-gray-600">Your personal data is never shared with third parties.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional sections */}
      <SetupProcess />
      <BenefitsSection />
      <FAQSection />
    </div>
  );
}