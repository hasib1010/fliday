'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
// Import required modules
import { Pagination, Autoplay } from 'swiper/modules';

export default function SetupProcess() {
  const [isMobile, setIsMobile] = useState(false);
  
  // Check screen size on client side
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    // Initial check
    checkScreenSize();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);
    
    // Clean up
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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

  // Card component to reuse in both views
  const StepCard = ({ step }) => (
    <div
      className="bg-[#FFF3EE] rounded-[20px] pt-5 flex flex-col justify-between items-center px-6 h-full"
    >
      <div className="mb-4">
        <span className="text-[#F15A25] font-bold text-2xl">{step.number}</span>
        <h3 className="font-medium text-lg mt-2">{step.title}</h3>
      </div>

      <div>
        <Image
          src={step.image}
          alt={step.alt}
          width={300}
          height={300}
        />
      </div>
    </div>
  );

  return (
    <>
      <section className="lg:pt-16 pt-5">
        <div className="mx-auto">
          <div className="mb-12">
            <h2 className="lg:text-[40px] text-[1.75rem] text-center lg:text-left font-medium mb-3">Set up your eSIM in 1 minute</h2>
            <p className="text-gray-700 text-lg text-center lg:text-left">Easy and straight forward activation.</p>
          </div>

          {/* Conditional rendering based on screen size */}
          {isMobile ? (
            /* Mobile & Tablet: Carousel */
            <div className="mb-6">
              <Swiper
                slidesPerView={'auto'}
                centeredSlides={true}
                spaceBetween={20}
                pagination={{
                  clickable: true,
                }}
                autoplay={{
                  delay: 3500,
                  disableOnInteraction: false,
                }}
                modules={[Pagination, Autoplay]}
                className="mySwiper"
              >
                {steps.map((step) => (
                  <SwiperSlide key={step.number} style={{ width: '80%', maxWidth: '340px' }}>
                    <StepCard step={step} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          ) : (
            /* Desktop: Grid Layout */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 place-items-stretch">
              {steps.map((step) => (
                <StepCard key={step.number} step={step} />
              ))}
            </div>
          )}

          <div className="lg:mt-16 mt-5 bg-[#FFF3EE] rounded-xl p-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-6 md:mb-0 md:mr-6">
                <h3 className="lg:text-[30px] text-[24px]  text-center font-medium mb-3">Does your device support eSIM technology?</h3>
                <p className="text-gray-700 text-[14px]  font-medium  lg:text-base  text-center">Make sure your phone supports eSIM before choosing your plan.</p>
              </div>
              <Link
                href="/compatibility"
                className="bg-[#F15A25] text-white px-6 py-3 w-full md:w-fit text-center rounded-full font-medium hover:bg-[#e04e1a] transition-colors whitespace-nowrap"
              >
                Check Compatibility
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[url('/fly.png')] bg-cover bg-no-repeat bg-center rounded-[24px] lg:mt-16 mt-5 lg:mb-28 mb-3">
        <div className="mx-auto">
          <div className="relative overflow-hidden w-full"> 
            {/* Gradient Overlay */}
            <div className="absolute inset-0 rounded-[24px]" style={{ background: 'linear-gradient(90deg, rgba(49, 18, 8, 0.45) 0%, rgba(64, 24, 10, 0.00) 100%)' }}></div>
            
            {/* Content */}
            <div className="relative z-10 p-12 md:p-16 flex flex-col lg:items-start items-center">
              <h3 className="text-white text-xl  font-medium mb-3">Support</h3>
              <h2 className="text-white lg:text-[44px] text-2xl text-center lg:text-left font-medium mb-4 lg:leading-[60px]">
                Do you have questions? <br />
                We<span className='italic'>'</span>re here to help!
              </h2>

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

      {/* Add Swiper CSS for pagination styling */}
      <style jsx global>{`
        .swiper-pagination-bullet {
          background: #F15A25;
          opacity: 0.5;
        }
        .swiper-pagination-bullet-active {
          background: #F15A25;
          opacity: 1;
        }
        .swiper {
          padding-bottom: 40px;
        }
      `}</style>
    </>
  );
}