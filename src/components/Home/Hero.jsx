'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default function Hero() {
    return (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-10">
            {/* Feature badges */}
            <div class="relative h-32 w-full flex justify-center items-center">

                <div class="absolute top-4 left-[35.5%] -translate-x-1/2 rotate-[-7.775deg] flex items-center gap-2 px-[19px] py-[14px] border border-orange-500 rounded-full bg-[#F4EBE8] shadow">
                    <div class="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">✔</div>
                    <span class="text-[18px] font-medium text-gray-800">Instant Setup</span>
                </div>


                <div class="absolute top-4 left-[49%] -translate-x-1/2 rotate-[7.871deg] flex items-center gap-2 px-[19px] py-[14px] border border-orange-500 rounded-full bg-[#F4EBE8] shadow">
                    <div class="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">✔</div>
                    <span class="text-[18px] font-medium text-gray-800">Global Coverage</span>
                </div>


                <div class="absolute top-4 left-[62%] -translate-x-1/2 rotate-[-4.268deg] flex items-center gap-2 px-[19px] py-[14px] border border-orange-500 rounded-full bg-[#F4EBE8] shadow">
                    <div class="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">✔</div>
                    <span class="text-[18px] font-medium text-gray-800">No Roaming</span>
                </div>
            </div>


            {/* Main heading */}
            <h1 className="text-center text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                eSIM for the <span className="text-[#F15A25]">Bold</span> & <span className="text-[#F15A25]">the Curious.</span>
            </h1>

            {/* Subheading */}
            <p className="text-center text-xl mb-8">
                Where do you need connectivity?
            </p>

            {/* Search box */}
            <div className="max-w-xl mx-auto mb-16 relative">
                <input
                    type="text"
                    placeholder="Enter your destination"
                    className="w-full px-6 py-4 rounded-full  border-2 border-[#F15A25] focus:outline-none focus:ring-1 focus:bg-white focus:ring-[#F15A25] text-lg"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#F15A25] p-3 rounded-full text-white">
                    <Search size={20} />
                </button>
            </div>
 
        </div>
    );
}