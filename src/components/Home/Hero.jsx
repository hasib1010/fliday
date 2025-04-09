'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';

export default function Hero() {
    return (
        <div className='  bg-[#f8f4f4]  '>
            <div className="  w-full  flex items-start justify-center   bg-contain md:min-h-[710px] bg-no-repeat bg-bottom md:bg-[url('/hero.png')] bg-[url('/hero2.png')]">
                {/* Content */}
                <div className="   pt-[85px]    ">
                    {/* Feature badges */}

                    {/* For medium to large screens - chain arrangement */}
                    <div className=" py-9 block relative w-full">
                        <div className="flex justify-center items-center">
                            {/* First Badge */}
                            <div className="relative z-10 flex items-center lg:gap-2 gap-0.5 lg:px-[19px] px-2 py-2.5 lg:py-[12px] -rotate-[7.775deg] border border-orange-500 rounded-full bg-[#F4EBE8] shadow mr-[-16px] ">
                                <div className="w-5 h-5 p-0.5 bg-orange-500 rounded-full flex items-center justify-center text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check">
                                        <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                </div>
                                <span className="lg:text-[18px] text-xs font-medium text-gray-800">Instant Setup</span>
                            </div>

                            {/* Middle Badge - overlaps both */}
                            <div className="relative z-20 flex items-center lg:gap-2 gap-0.5 lg:px-[19px] px-2 py-2.5 lg:py-[12px] border border-orange-500 rounded-full bg-[#F4EBE8] shadow rotate-[7.871deg] ml-[10px]">
                                <div className="w-5 h-5 p-0.5 bg-orange-500 rounded-full flex items-center justify-center text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check">
                                        <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                </div>
                                <span className="lg:text-[18px] text-xs  font-medium text-gray-800">Global Coverage</span>
                            </div>

                            {/* Last Badge */}
                            <div className="relative z-10 flex items-center lg:gap-2 gap-0.5 lg:px-[19px] px-2 py-2.5 lg:py-[12px] border border-orange-500 rounded-full bg-[#F4EBE8] shadow ml-[-10px] -rotate-[4.268deg]">
                                <div className="w-5 h-5 p-0.5 bg-orange-500 rounded-full flex items-center justify-center text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check">
                                        <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                </div>
                                <span className="lg:text-[18px] text-xs  font-medium text-gray-800">No Roaming</span>
                            </div>
                        </div>
                    </div>
                    {/* Main heading */}
                    <h1 className="text-center lg:text-[55px] text-4xl md:text-5xl lg:text-6xl font-semibold pb-8">
                        eSIM for the <span className="text-[#F15A25]">Bold</span> & <span className="text-[#F15A25]">the Curious.</span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-center text-xl pb-6">
                        Where do you need connectivity?
                    </p>

                    {/* Search box */}
                    <div className="max-w-xl px-1.5 mx-auto mb-36 relative">
                        <input
                            type="text"
                            placeholder="Enter your destination"
                            className="w-full px-6 py-4 rounded-full border-2 border-[#F15A25]  bg-white   focus:outline-none focus:ring-1 focus:ring-[#F15A25] text-lg"
                        />
                        <button className="absolute right-5  top-1/2 transform -translate-y-1/2 bg-[#F15A25] p-3 rounded-full text-white">
                            <Search size={20} />
                        </button>
                    </div>
                </div>

                {/* Spacer to ensure content doesn't get cut off */}
                <div className="pb-12 md:pb-20"></div>
            </div>       </div>
    );
}