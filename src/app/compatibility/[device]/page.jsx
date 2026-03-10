import Link from "next/link";
import { notFound } from "next/navigation";
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

export default function DevicePage({ params }) {
  const slug = params.device;

  const device = compatibleDevices.find(
    (d) => makeSlug(d.brand, d.model) === slug
  );

  if (!device) {
    notFound();
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 pt-24 pb-16">
      <h1 className="text-3xl font-bold mb-6">
        Does {device.brand} {device.model} Support eSIM?
      </h1>

      {device.compatible ? (
        <p className="text-lg mb-6">
          Yes. The {device.brand} {device.model} supports eSIM technology and
          works with Fliday travel eSIM plans.
        </p>
      ) : (
        <p className="text-lg mb-6">
          No. The {device.brand} {device.model} does not support eSIM.
        </p>
      )}

      <p className="mb-8">
        If your phone supports eSIM, you can browse Fliday travel plans and
        activate your eSIM instantly.
      </p>

      <Link
        href="/destinations"
        className="px-6 py-3 bg-[#F15A25] text-white rounded-lg font-bold"
      >
        Browse eSIM Plans
      </Link>
    </div>
  );
}