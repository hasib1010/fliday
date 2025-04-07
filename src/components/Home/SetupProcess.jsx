'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function SetupProcess() {
  const steps = [
    {
      number: 1,
      title: 'Choose a destination and select a data plan',
      image: '/setup/1.png',
      alt: 'Selecting a destination on mobile app'
    },
    {
      number: 2,
      title: 'Follow the instructions to install your eSim',
      image: '/setup/2.png',
      alt: 'QR code scanning screen for eSIM installation'
    },
    {
      number: 3,
      title: 'Activate Data Roaming upon arrival',
      image: '/setup/3.png',
      alt: 'Phone settings showing data roaming toggle'
    },
    {
      number: 4,
      title: 'Enjoy fast and reliable internet',
      image: '/setup/4.png',
      alt: 'Success screen showing connection is active'
    }
  ];

  return (
   <>
    <section className="py-16   ">
      <div className="  mx-auto  ">
        <div className="  mb-12">
          <h2 className="text-[40px] font-medium mb-3">Set up your eSIM in 1 minute</h2>
          <p className="text-gray-700 text-lg">Easy and straight forward activation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6  place-items-stretch">
          {steps.map((step) => (
            <div 
              key={step.number} 
              className="bg-[#FFF3EE] rounded-[20px] pt-5 flex flex-col justify-between items-center   px-6"
            >
              <div className="mb-4">
                <span className="text-[#F15A25] font-bold text-2xl">{step.number}</span>
                <h3 className="font-medium text-lg mt-2">{step.title}</h3>
              </div>
              
              <div className=" ">
                <Image
                  src={step.image}
                  alt={step.alt}
                    width={300} 
                    height={300}
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 bg-[#FFF8F6] rounded-xl p-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0 md:mr-6">
              <h3 className="text-[30px] font-medium mb-3">Does your device support eSIM technology?</h3>
              <p className="text-gray-700">Make sure your phone supports eSIM before choosing your plan.</p>
            </div>
            <Link
              href="/compatibility"
              className="bg-[#F15A25] text-white px-6 py-3 rounded-full font-medium hover:bg-[#e04e1a] transition-colors whitespace-nowrap"
            >
              Check Compatibility
            </Link>
          </div>
        </div>
      </div> 
    </section>
     <section className=" lg:mb-28 mb-3">
     <div className="  mx-auto  ">
       <div className="relative overflow-hidden w-full">
         {/* Background Image */}
         <div className="absolute inset-0 w-full h-full">
           <Image
             src="/fly.png"
             alt="Paragliding over mountains"
             fill
             className="rounded-[24px] *:object-cover object-center"
             priority
           />
           {/* Gradient Overlay */}
           <div className="absolute inset-0 rounded-[24px]" style={{ background: 'linear-gradient(90deg, rgba(49, 18, 8, 0.45) 0%, rgba(64, 24, 10, 0.00) 100%)' }}></div>
         </div>
         
         {/* Content */}
         <div className="relative z-10 p-12 md:p-16 flex flex-col items-start">
           <h3 className="text-white text-xl font-medium mb-3">Support</h3>
           <h2 className="text-white lg:text-[44px]  font-medium mb-3  ">
             Do you have questions?
           </h2>
           <p className="text-white lg:text-[44px]  font-medium mb-8  ">
             We're here to help!
           </p>
           
           <Link
             href="/contact"
             className="bg-[#F15A25] hover:bg-[#e04e1a] transition-colors text-white font-medium px-8 py-3 rounded-full"
           >
             Contact Us
           </Link>
         </div>
       </div>
     </div>
   </section>
   </>
  );
}