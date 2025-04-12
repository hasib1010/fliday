'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Check, Search } from 'lucide-react';

export default function Hero() {
    return (
        <div className="relative bg-[#f8f4f4] ">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">

                <div className="block md:hidden relative h-[400px]">
                    <Image
                        src="/hero2.png"
                        alt="Hero Background Mobile"
                        fill
                        style={{ objectFit: 'contain', objectPosition: 'bottom' }}
                        priority
                    />
                </div>


                <div className="md:block lg:hidden">
                    <Image
                        src="/hero2.png"
                        alt="Hero Background Mobile"
                        fill
                        style={{ objectFit: 'cover', objectPosition: 'bottom' }}
                        priority
                    />
                </div>

                <div className="hidden xl:block 2xl:hidden ">
                    <Image
                        src="/hero.png"
                        alt="Hero Background Desktop"
                        fill
                        style={{ objectFit: 'cover', objectPosition: 'bottom' }}
                        priority
                    />
                </div>
                <div className="hidden 2xl:block [min-width:1921px]:hidden">
                    <Image
                        src="/hero.png"
                        alt="Hero Background Desktop"
                        fill
                        style={{ objectFit: 'contain', objectPosition: 'bottom' }}
                        priority
                    />
                </div>

                <div className="hidden lg:block xl:hidden">
                    <Image
                        src="/hero2.png"
                        alt="Hero Background Desktop"
                        fill
                        style={{ objectFit: 'cover', objectPosition: 'bottom' }}
                        priority
                    />
                </div>


            </div>

            {/* Content */}
            <div className="relative z-10 w-full flex items-start justify-center min-h-[710px]">
                <div className="md:pt-[85px] pt-36">
                    {/* Feature badges */}
                    <div className="md:py-9 py-3 block relative w-full px-1">
                        <div className="flex justify-center mb-10 md:mb-0   items-center">
                            {/* Instant Setup */}
                            <div className="relative z-10 flex items-center lg:gap-2 gap-0.5 lg:px-[19px] px-2 md:py-2.5 py-3 lg:py-[12px] -rotate-[7.775deg] border border-orange-500 rounded-full bg-[#F4EBE8] shadow mr-[-16px]">
                                <div className="md:w-6 md:h-6 w-4 h-4 p-0.5 bg-orange-500 rounded-full flex items-center justify-center text-white">

                                    <Check />
                                </div>
                                <span className="
  text-[18px] 
  max-[426px]:text-[13px]  
  max-[376px]:text-[12px] 
  max-[321px]:text-[10px] 
  font-medium text-gray-800">
                                    Instant Setup
                                </span>

                            </div>

                            {/* Global Coverage */}
                            <div className="relative z-20 flex items-center lg:gap-2 gap-0.5 lg:px-[19px] px-2  md:py-2.5 py-3 lg:py-[12px] border border-orange-500 rounded-full bg-[#F4EBE8] shadow rotate-[7.871deg] ml-[10px]">
                                <div className="md:w-6 md:h-6 w-4 h-4 p-0.5 bg-orange-500 rounded-full flex items-center justify-center text-white">

                                    <Check />
                                </div>
                                <span className="
  text-[18px] 
  max-[426px]:text-[13px]  
  max-[376px]:text-[12px] 
  max-[321px]:text-[10px] 
  font-medium text-gray-800">
  Global Coverage
</span>

                            </div>

                            {/* No Roaming */}
                            <div className="relative z-10 flex items-center lg:gap-2 gap-0.5 lg:px-[19px] px-2  md:py-2.5 py-3 lg:py-[12px] border border-orange-500 rounded-full bg-[#F4EBE8] shadow ml-[-10px] -rotate-[4.268deg]">
                                <div className="md:w-6 md:h-6 w-4 h-4 p-0.5 bg-orange-500 rounded-full flex items-center justify-center text-white">

                                    <Check />
                                </div>
                              <span className="
  text-[18px] 
  max-[426px]:text-[13px]  
  max-[376px]:text-[12px] 
  max-[321px]:text-[10px] 
  font-medium text-gray-800">
  No Roaming
</span>

                            </div>
                        </div>
                    </div>

                    {/* Heading */}
                    <h1 className="text-center lg:text-[55px] text-3xl md:text-5xl lg:text-6xl font-semibold pb-8">
                        eSIM for the <span className="text-[#F15A25]">Bold</span> & <span className="text-[#F15A25]">the Curious.</span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-center text-xl pb-6">Where do you need connectivity?</p>

                    {/* Search box */}
                    <div className="max-w-xl px-1.5 mx-auto mb-36 relative">
                        <input
                            type="text"
                            placeholder="Enter your destination"
                            className="w-full px-6 py-4 rounded-full border-2 border-[#F15A25] bg-white focus:outline-none focus:ring-1 focus:ring-[#F15A25] text-lg"
                        />
                        <button className="absolute right-5 top-1/2 transform -translate-y-1/2 bg-[#F15A25] p-3 rounded-full text-white">
                            <Search size={20} />
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}
