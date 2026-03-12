import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, AlertTriangle, Smartphone, ChevronLeft } from "lucide-react";
import { compatibleDevices } from "@/lib/devices";

function makeSlug(brand, model) {
  return `${brand}-${model}`
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[()]/g, "");
}

export function generateStaticParams() {
  return compatibleDevices.map((device) => ({
    device: makeSlug(device.brand, device.model),
  }));
}

export async function generateMetadata({ params }) {
  const slug = params.device;

  const device = compatibleDevices.find(
    (d) => makeSlug(d.brand, d.model) === slug
  );

  if (!device) {
    return {
      title: "Device Compatibility | Fliday",
      description: "Check whether your phone supports eSIM technology.",
    };
  }

  return {
    title: `Does ${device.model} Support eSIM? | Fliday Compatibility Guide`,
    description: `Check if ${device.brand} ${device.model} supports eSIM. Learn whether it works with Fliday travel eSIM plans and how to confirm compatibility on your device.`,
  };
}

export default function DevicePage({ params }) {
  const slug = params.device;

  const device = compatibleDevices.find(
    (d) => makeSlug(d.brand, d.model) === slug
  );

  if (!device) {
    notFound();
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 pt-24 pb-16">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/compatibility"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={18} className="mr-1" />
          Back to compatibility checker
        </Link>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-r from-[#F15A25]/10 to-[#F15A25]/5 rounded-2xl p-8 mb-8 border border-[#F15A25]/10">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
            <Smartphone className="text-[#F15A25]" size={28} />
          </div>

          <div className="flex-1 w-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 leading-tight">
              Does {device.brand} {device.model} Support eSIM?
            </h1>

            <div className="mb-4">
              {device.compatible ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  <Check size={16} className="mr-1" />
                  Compatible with eSIM
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                  <AlertTriangle size={16} className="mr-1" />
                  Not compatible with eSIM
                </span>
              )}
            </div>

            <p className="text-base sm:text-lg text-gray-700 max-w-3xl">
              {device.compatible
                ? `${device.brand} ${device.model} supports eSIM technology, which means you can activate a digital SIM without inserting a physical card. This makes it easy to use Fliday travel eSIM plans while keeping your main number active.`
                : `${device.brand} ${device.model} does not support eSIM technology. If you need mobile data while traveling, you may need to use a physical SIM card instead.`}
            </p>
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-3">
              {device.brand} {device.model} eSIM Compatibility
            </h2>
            <p className="text-gray-700 leading-7">
              {device.compatible
                ? `Yes, ${device.brand} ${device.model} supports eSIM. If your phone is carrier-unlocked and eSIM is available in your region, you can install a Fliday eSIM and use mobile data abroad without swapping your physical SIM card.`
                : `No, ${device.brand} ${device.model} is not listed as an eSIM-compatible phone. In most cases, this means the device cannot install a travel eSIM profile.`}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-3">How to check on your phone</h2>
            <p className="text-gray-700 leading-7 mb-4">
              To confirm eSIM support directly on your device, go to your mobile
              network or cellular settings and look for options like:
            </p>

            <ul className="space-y-2 text-gray-700">
              <li>• Add eSIM</li>
              <li>• Add Cellular Plan</li>
              <li>• Add Mobile Plan</li>
              <li>• SIM Manager / eSIM Manager</li>
            </ul>

            <p className="text-gray-700 leading-7 mt-4">
              Availability can vary depending on the exact model, country of purchase,
              and carrier restrictions.
            </p>
          </div>

          {device.compatible && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-3">
                Can you use Fliday on {device.model}?
              </h2>
              <p className="text-gray-700 leading-7 mb-4">
                Yes. If your {device.model} is unlocked and supports eSIM in your region,
                you can use it with Fliday travel eSIM plans for destinations around the world.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/destinations"
                  className="inline-flex items-center justify-center px-5 py-3 bg-[#F15A25] text-white rounded-lg font-bold hover:bg-[#E04E1A] transition-colors"
                >
                  Browse eSIM Plans
                </Link>

                <Link
                  href="/compatibility"
                  className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Check Another Device
                </Link>
              </div>
            </div>
          )}

          {!device.compatible && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-3">Need help confirming compatibility?</h2>
              <p className="text-gray-700 leading-7 mb-4">
                Some phone variants differ by market or carrier. If you’re unsure whether
                your exact model supports eSIM, our support team can help you verify it.
              </p>

              <Link
                href="/support"
                className="inline-flex items-center justify-center px-5 py-3 bg-[#F15A25] text-white rounded-lg font-bold hover:bg-[#E04E1A] transition-colors"
              >
                Contact Support
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Answer</h3>

            {device.compatible ? (
              <div className="rounded-xl bg-green-50 border border-green-100 p-4">
                <div className="flex items-center text-green-700 font-semibold mb-2">
                  <Check size={18} className="mr-2" />
                  Yes, supported
                </div>
                <p className="text-sm text-green-700">
                  {device.brand} {device.model} supports eSIM.
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-yellow-50 border border-yellow-100 p-4">
                <div className="flex items-center text-yellow-700 font-semibold mb-2">
                  <AlertTriangle size={18} className="mr-2" />
                  No, not supported
                </div>
                <p className="text-sm text-yellow-700">
                  {device.brand} {device.model} does not support eSIM.
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-3">Important Note</h3>
            <p className="text-sm text-gray-700 leading-6">
              eSIM support can vary by model number, region, and carrier lock status.
              Always double-check your phone settings before buying.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}