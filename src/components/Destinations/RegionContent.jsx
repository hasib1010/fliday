'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, Info, X } from 'lucide-react';
import SetupProcess from '../Home/SetupProcess';
import BenefitsSection from '../Home/BenefitsSection';
import FAQSection from '../Home/FAQSection';

// Country code → display name
const countryCodeToName = {
  AF:'Afghanistan',AX:'Åland Islands',AL:'Albania',DZ:'Algeria',AS:'American Samoa',
  AD:'Andorra',AO:'Angola',AI:'Anguilla',AQ:'Antarctica',AG:'Antigua and Barbuda',
  AR:'Argentina',AM:'Armenia',AW:'Aruba',AU:'Australia',AT:'Austria',AZ:'Azerbaijan',
  BS:'Bahamas',BH:'Bahrain',BD:'Bangladesh',BB:'Barbados',BY:'Belarus',BE:'Belgium',
  BZ:'Belize',BJ:'Benin',BM:'Bermuda',BT:'Bhutan',BO:'Bolivia',BA:'Bosnia and Herzegovina',
  BW:'Botswana',BR:'Brazil',BN:'Brunei',BG:'Bulgaria',BF:'Burkina Faso',BI:'Burundi',
  CV:'Cabo Verde',KH:'Cambodia',CM:'Cameroon',CA:'Canada',KY:'Cayman Islands',
  CF:'Central African Republic',TD:'Chad',CL:'Chile',CN:'China',CO:'Colombia',
  KM:'Comoros',CG:'Congo',CD:'Congo (DRC)',CK:'Cook Islands',CR:'Costa Rica',
  CI:"Côte d'Ivoire",HR:'Croatia',CU:'Cuba',CW:'Curaçao',CY:'Cyprus',CZ:'Czech Republic',
  DK:'Denmark',DJ:'Djibouti',DM:'Dominica',DO:'Dominican Republic',EC:'Ecuador',
  EG:'Egypt',SV:'El Salvador',GQ:'Equatorial Guinea',ER:'Eritrea',EE:'Estonia',
  SZ:'Eswatini',ET:'Ethiopia',FO:'Faroe Islands',FJ:'Fiji',FI:'Finland',FR:'France',
  GF:'French Guiana',PF:'French Polynesia',GA:'Gabon',GM:'Gambia',GE:'Georgia',
  DE:'Germany',GH:'Ghana',GI:'Gibraltar',GR:'Greece',GL:'Greenland',GD:'Grenada',
  GP:'Guadeloupe',GU:'Guam',GT:'Guatemala',GN:'Guinea',GW:'Guinea-Bissau',GY:'Guyana',
  HT:'Haiti',HN:'Honduras',HK:'Hong Kong',HU:'Hungary',IS:'Iceland',IN:'India',
  ID:'Indonesia',IR:'Iran',IQ:'Iraq',IE:'Ireland',IM:'Isle of Man',IL:'Israel',
  IT:'Italy',JM:'Jamaica',JP:'Japan',JO:'Jordan',KZ:'Kazakhstan',KE:'Kenya',
  KI:'Kiribati',KP:'North Korea',KR:'South Korea',KW:'Kuwait',KG:'Kyrgyzstan',
  LA:'Laos',LV:'Latvia',LB:'Lebanon',LS:'Lesotho',LR:'Liberia',LY:'Libya',
  LI:'Liechtenstein',LT:'Lithuania',LU:'Luxembourg',MO:'Macao',MG:'Madagascar',
  MW:'Malawi',MY:'Malaysia',MV:'Maldives',ML:'Mali',MT:'Malta',MH:'Marshall Islands',
  MQ:'Martinique',MR:'Mauritania',MU:'Mauritius',MX:'Mexico',FM:'Micronesia',
  MD:'Moldova',MC:'Monaco',MN:'Mongolia',ME:'Montenegro',MA:'Morocco',MZ:'Mozambique',
  MM:'Myanmar',NA:'Namibia',NR:'Nauru',NP:'Nepal',NL:'Netherlands',NC:'New Caledonia',
  NZ:'New Zealand',NI:'Nicaragua',NE:'Niger',NG:'Nigeria',NO:'Norway',OM:'Oman',
  PK:'Pakistan',PW:'Palau',PS:'Palestine',PA:'Panama',PG:'Papua New Guinea',
  PY:'Paraguay',PE:'Peru',PH:'Philippines',PL:'Poland',PT:'Portugal',PR:'Puerto Rico',
  QA:'Qatar',RO:'Romania',RU:'Russia',RW:'Rwanda',SA:'Saudi Arabia',SN:'Senegal',
  RS:'Serbia',SC:'Seychelles',SL:'Sierra Leone',SG:'Singapore',SK:'Slovakia',
  SI:'Slovenia',SB:'Solomon Islands',SO:'Somalia',ZA:'South Africa',SS:'South Sudan',
  ES:'Spain',LK:'Sri Lanka',SD:'Sudan',SR:'Suriname',SE:'Sweden',CH:'Switzerland',
  SY:'Syria',TW:'Taiwan',TJ:'Tajikistan',TZ:'Tanzania',TH:'Thailand',TL:'Timor-Leste',
  TG:'Togo',TO:'Tonga',TT:'Trinidad and Tobago',TN:'Tunisia',TR:'Turkey',
  TM:'Turkmenistan',TC:'Turks and Caicos Islands',TV:'Tuvalu',UG:'Uganda',UA:'Ukraine',
  AE:'United Arab Emirates',GB:'United Kingdom',US:'United States',UY:'Uruguay',
  UZ:'Uzbekistan',VU:'Vanuatu',VE:'Venezuela',VN:'Vietnam',VG:'British Virgin Islands',
  VI:'U.S. Virgin Islands',WF:'Wallis and Futuna',YE:'Yemen',ZM:'Zambia',ZW:'Zimbabwe',
};

const REGION_FLAGS = {
  europe:          '/flags/europe_flag.svg',
  asia:            '/flags/asia_flag.svg',
  africa:          '/flags/africa_flag.svg',
  'north-america': '/flags/north_america_flag.svg',
  'south-america': '/flags/south_america_flag.svg',
  'latin-america': '/flags/south_america_flag.svg',
  'middle-east':   '/flags/middle_east_flag.svg',
  caribbean:       '/flags/caribbean_flag.svg',
  oceania:         '/flags/global_flag.svg',
  global:          '/flags/global_flag.svg',
};


function PageSkeleton() {
  return (
    <div className="max-w-[1220px] mx-auto px-2 pt-24 animate-pulse">
      <div className="lg:gap-[78px] gap-6 flex justify-evenly lg:flex-row flex-col">
        <div className="hidden md:block rounded-lg bg-gray-200 lg:w-[468px] h-[624px]" />
        <div className="lg:max-w-[653px] w-full space-y-4">
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gray-300" /><div className="h-9 bg-gray-300 rounded w-72" /></div>
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-16 bg-gray-100 rounded-lg" />
          <div className="h-5 bg-gray-300 rounded w-40" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="w-4 h-4 rounded-full bg-gray-200" />
                <div className="h-5 bg-gray-300 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-5 bg-gray-300 rounded w-12" />
              </div>
            ))}
          </div>
          <div className="h-12 bg-gray-300 rounded-full" />
          <div className="h-12 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function RegionContent({ urlSlug, displayName, apiSlug }) {
  const [packages, setPackages]           = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [activeTab, setActiveTab]         = useState('features');
  const [isLoading, setIsLoading]         = useState(true);
  const [settled, setSettled]             = useState(false);
  const [error, setError]                 = useState(null);
  const [countries, setCountries]         = useState([]);
  const [showCountriesModal, setShowCountriesModal] = useState(false);
  const [expandedNetworks, setExpandedNetworks]     = useState({});
  const [networkExpanded, setNetworkExpanded]       = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchPackages = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let pkgs = [];

        if (apiSlug) {
          const res  = await fetch(`/api/esim/packages?slug=${encodeURIComponent(apiSlug)}`, { signal: controller.signal });
          const data = await res.json();
          pkgs = data?.data || [];
        }

        if (!pkgs.length) {
          const res  = await fetch(`/api/esim/packages?slug=${encodeURIComponent(urlSlug)}`, { signal: controller.signal });
          const data = await res.json();
          pkgs = data?.data || [];
        }

        const sorted = pkgs.sort((a, b) => a.price - b.price);
        setPackages(sorted);
        if (sorted.length) {
          setSelectedPlanId(sorted[0].id);
          // Extract covered countries from first package
          const first = sorted[0];
          if (first.locations?.length) setCountries(first.locations);
          else if (first.location) setCountries(first.location.split(',').map(c => c.trim()));
        }
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        setIsLoading(false);
        setTimeout(() => setSettled(true), 300);
      }
    };

    fetchPackages();
    return () => controller.abort();
  }, [urlSlug, apiSlug]);

  const selectedPlan = packages.find(p => p.id === selectedPlanId) || packages[0] || null;
  const formatPrice  = (price) => price == null ? '—' : `$${(price / 10000).toFixed(2)}`;

  const regionFlag  = REGION_FLAGS[urlSlug]  || '/flags/global_flag.svg';
  // Use flag SVG as the primary left-column image since destination jpgs may not exist
  const regionImage = regionFlag;

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="max-w-[1220px] mx-auto px-2 pt-24">
      <div className="lg:gap-[78px] gap-6 flex justify-evenly lg:flex-row flex-col">

        {/* Left image — use regular img to avoid Next.js Image infinite retry loop */}
        <div className="hidden md:flex items-center justify-center rounded-lg overflow-hidden lg:w-[468px] h-[624px] bg-gradient-to-br from-gray-50 to-gray-100">
          <img
            src={regionImage}
            alt={`eSIM for ${displayName}`}
            className="w-64 h-64 object-contain opacity-80"
            onError={(e) => {
              e.currentTarget.onerror = null; // prevent loop
              e.currentTarget.src = '/flags/global_flag.svg';
            }}
          />
        </div>

        {/* Right column */}
        <div className="lg:max-w-[653px]">

          {/* Title */}
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 rounded-full overflow-hidden mr-3 flex-shrink-0 bg-gray-100">
              <Image src={regionFlag} alt={displayName} width={32} height={32} className="object-cover w-full h-full" />
            </div>
            <h1 className="lg:text-[40px] text-2xl font-medium">eSIM for {displayName}</h1>
          </div>

          <p className="text-gray-600 mb-4">
            Stay connected across {displayName} with a single prepaid eSIM. One plan, full regional coverage.
          </p>

          {/* Coverage countries strip */}
          {countries.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-blue-800 mb-2">
                Coverage: {countries.length} {countries.length === 1 ? 'country' : 'countries'} across {displayName}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {countries.slice(0, 6).map((code, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={`/flags/${code.toLowerCase()}_flag.jpeg`}
                      alt={countryCodeToName[code] || code}
                      className="w-7 h-7 rounded-full object-cover border border-white shadow-sm"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/flags/default.jpg'; }}
                    />
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                      {countryCodeToName[code] || code}
                    </span>
                  </div>
                ))}
                {countries.length > 6 && (
                  <button
                    onClick={() => setShowCountriesModal(true)}
                    className="text-xs text-blue-700 font-medium bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded-full transition-colors"
                  >
                    +{countries.length - 6} more
                  </button>
                )}
              </div>
            </div>
          )}

          <h2 className="font-medium mb-4">Choose your data plan</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
              Could not load plans: {error}
            </div>
          )}

          {/* Inline skeleton while not settled */}
          {!error && packages.length === 0 && !settled && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="w-4 h-4 rounded-full bg-gray-200" /><div className="h-5 bg-gray-300 rounded w-16" />
                  <div className="h-4 bg-gray-200 rounded w-20" /><div className="h-5 bg-gray-300 rounded w-12" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!error && packages.length === 0 && settled && (
            <div className="mb-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3 opacity-30 pointer-events-none select-none">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="w-4 h-4 rounded-full bg-gray-200" /><div className="h-5 bg-gray-200 rounded w-16" />
                    <div className="h-4 bg-gray-100 rounded w-20" /><div className="h-5 bg-gray-200 rounded w-12" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-center text-gray-400">No plans available for {displayName} at the moment.</p>
            </div>
          )}

          {/* Plan cards */}
          {packages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {packages.map((pkg) => {
                const isSelected = selectedPlanId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPlanId(pkg.id)}
                    className={`relative border rounded-lg p-3 text-left transition-all ${
                      isSelected ? 'border-[#F15A25] bg-[#FFF8F6]' : 'border-gray-200 hover:border-[#F15A25]'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" strokeWidth={isSelected ? '4' : '2'} stroke={isSelected ? '#F15A25' : '#C9C9C9'} />
                    </svg>
                    <div className="font-medium mt-1">{pkg.dataAmount || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{pkg.duration ? `${pkg.duration} days` : 'N/A'}</div>
                    <div className="mt-1 font-medium">{formatPrice(pkg.price)}</div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected plan details */}
          {selectedPlan && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Data:</span> {selectedPlan.dataAmount}</div>
              <div><span className="text-gray-500">Duration:</span> {selectedPlan.duration} days</div>
              <div><span className="text-gray-500">Speed:</span> {selectedPlan.speed || '4G/5G'}</div>
              <div><span className="text-gray-500">Coverage:</span> {displayName}</div>
            </div>
          )}

          {/* Auto-activate info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <Info size={16} className="mr-1" />
              <label className="text-sm font-medium">Can I activate my plan later?</label>
            </div>
            <p className="text-xs text-gray-500">
              All plans have a 30-day activation period. If you don't activate within 30 days, it will activate automatically.
            </p>
          </div>

          {/* Checkout */}
          <Link
            href={selectedPlan ? `/checkout?packageCode=${selectedPlan.packageCode}` : '#'}
            className={`block w-full font-medium py-3 rounded-full text-center mb-3 transition-colors ${
              selectedPlan ? 'bg-[#F15A25] text-white hover:bg-[#e04e1a]' : 'bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none'
            }`}
          >
            {selectedPlan ? `Go to checkout — ${formatPrice(selectedPlan.price)}` : 'Select a plan'}
          </Link>

          <button className="block w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-full text-center mb-6 hover:bg-gray-50 transition-colors">
            Check Compatibility
          </button>

          {/* Trust badges */}
          <div className="flex justify-center space-x-8 mb-8">
            <div className="flex items-center text-sm text-gray-500">
              <Image src="/icons/CardSecurity.png" alt="Secure payment" width={24} height={24} className="mr-1" />
              <span>Secure payment</span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Image src="/icons/Guarantee.png" alt="Money-back guarantee" width={24} height={24} className="mr-1" />
              <span>Money-back guarantee</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-4">
            <div className="flex space-x-6 overflow-x-auto">
              {['features', 'description', 'technical', 'trust'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`text-sm cursor-pointer font-medium pb-2 transition-colors whitespace-nowrap ${
                    activeTab === tab ? 'text-gray-900 border-b-2 border-[#F15A25]' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'features' ? 'Key features' : tab === 'technical' ? 'Technical details' : tab === 'trust' ? 'Trust & Safety' : 'Description'}
                </button>
              ))}
            </div>
          </div>

          <div className="py-4">
            {activeTab === 'features' && (
              <ul className="space-y-2">
                <li className="flex items-start"><span className="text-gray-400 mr-2">•</span><span>One eSIM, full {displayName} coverage — no SIM swapping.</span></li>
                <li className="flex items-start"><span className="text-gray-400 mr-2">•</span><span>Affordable data from just {packages.length ? formatPrice(packages[0].price) : '$3.99'}.</span></li>
                <li className="flex items-start"><span className="text-gray-400 mr-2">•</span><span>Instant delivery via QR code after purchase.</span></li>
                <li className="flex items-start"><span className="text-gray-400 mr-2">•</span><span>Compatible with all eSIM-ready smartphones.</span></li>
              </ul>
            )}
            {activeTab === 'description' && (
              <div className="text-gray-700">
                <p className="mb-3">Travel freely across {displayName} with a single prepaid eSIM. No swapping SIM cards between countries — one plan covers you everywhere in the region.</p>
                <p>Choose your data plan ({packages.length ? `${packages[0].dataAmount}–${packages[packages.length-1].dataAmount}` : '1GB–20GB'}), activate instantly, and stay connected at full speed.</p>
              </div>
            )}
            {activeTab === 'technical' && (
              <div className="text-gray-700 space-y-2">
                <p><span className="font-medium">Coverage:</span> {countries.length ? `${countries.length} countries` : 'All major countries'} within {displayName}.</p>
                <p><span className="font-medium">Activation:</span> Activates automatically upon first network connection.</p>
                <p><span className="font-medium">Duration options:</span> {[...new Set(packages.map(p => p.duration))].join(', ')} days.</p>
                <p><span className="font-medium">Delivery:</span> Instant after purchase.</p>
                <p><span className="font-medium">SMS & Calls:</span> Data only. VoIP (WhatsApp, Telegram) works fine.</p>
                <p><span className="font-medium">Speed:</span> {selectedPlan?.speed || '4G LTE / 5G'} depending on local network.</p>
                <p><span className="font-medium">Hotspot:</span> No restrictions.</p>
              </div>
            )}
            {activeTab === 'trust' && (
              <div className="bg-gray-50 rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { icon: <CheckCircle className="w-5 h-5 text-[#F15A25]" />, title: 'Money-back guarantee', desc: "Full refund within 30 days if you haven't used the data." },
                  { icon: <Info className="w-5 h-5 text-[#F15A25]" />, title: 'Secure payment', desc: '256-bit SSL on all transactions.' },
                  { icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F15A25]"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>, title: 'Privacy protection', desc: 'Your data is never shared with third parties.' },
                  { icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F15A25]"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>, title: '24/7 Support', desc: 'Our team is always available to help.' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-[#FFF0EC] flex items-center justify-center flex-shrink-0 mr-4">{icon}</div>
                    <div><h3 className="font-medium mb-1">{title}</h3><p className="text-sm text-gray-600">{desc}</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Network coverage accordion */}
          {selectedPlan?.locationNetworkList?.length > 0 && (
            <div className="mt-6 bg-gray-50 rounded-lg overflow-hidden">
              <button
                onClick={() => setNetworkExpanded(p => !p)}
                className="w-full p-5 flex justify-between items-center border-b border-gray-200"
              >
                <h3 className="text-base font-medium">Network Coverage</h3>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${networkExpanded ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {networkExpanded && (
                <div className="p-5 space-y-5">
                  {selectedPlan.locationNetworkList.map((loc, i) => (
                    <div key={i} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <button
                        onClick={() => setExpandedNetworks(p => ({ ...p, [loc.locationCode]: !p[loc.locationCode] }))}
                        className="flex items-center justify-between w-full mb-2"
                      >
                        <div className="flex items-center gap-2">
                          <img src={`/flags/${loc.locationCode.toLowerCase()}_flag.jpeg`} alt={loc.locationName}
                            className="w-6 h-6 rounded-full object-cover"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/flags/default.jpg'; }}
                          />
                          <span className="font-medium text-sm">{loc.locationName}</span>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${expandedNetworks[loc.locationCode] ? 'rotate-180' : ''}`}>
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      {expandedNetworks[loc.locationCode] && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 pl-8">
                          {loc.operatorList?.map((op, j) => (
                            <div key={j} className="bg-white p-2 rounded border text-sm">
                              <span className="font-medium">{op.operatorName}</span>
                              <span className="text-xs text-gray-400 ml-1">({op.networkType})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <SetupProcess />
      <BenefitsSection />
      <FAQSection />

      {/* Countries modal */}
      {showCountriesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-h-[80vh] w-full sm:w-[480px] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg font-semibold">Coverage — {countries.length} countries</h3>
              <button onClick={() => setShowCountriesModal(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <ul className="space-y-2">
                {countries.map((code, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <img
                      src={`/flags/${code.toLowerCase()}_flag.jpeg`}
                      alt={countryCodeToName[code] || code}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/flags/default.jpg'; }}
                    />
                    <span className="text-sm">{countryCodeToName[code] || code}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 border-t flex justify-end flex-shrink-0">
              <button onClick={() => setShowCountriesModal(false)} className="bg-[#F15A25] hover:bg-[#E04E1A] text-white px-5 py-2 rounded-full text-sm font-medium transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}