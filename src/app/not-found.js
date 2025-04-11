'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-[90vh] pt-20 bg-gray-50 flex flex-col">
     
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
          <div className="flex justify-center items-center  mb-6">
            <div className="relative ">
             
                <span className="text-[#F15A25] text-6xl font-bold">
                  4
                </span>
              
              
                <span className="text-[#F15A25] text-6xl font-bold">
                  0
                </span>
             
              
                <span className="text-[#F15A25] text-6xl font-bold">
                  4
                </span>
              
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-gray-600 mb-8">
            Oops! The page you&apos;re looking for has gone off the grid. 
            There&apos;s no connectivity here.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={18} /> Go Back
            </button>
            
            <Link 
              href="/destinations"
              className="flex items-center justify-center gap-2 px-6 py-2 bg-[#F15A25] text-white rounded-full hover:bg-[#e04e1a] transition-colors"
            >
              <MapPin size={18} /> Find Destinations
            </Link>
          </div>
        </div>
      </div>

       
    </div>
  );
}