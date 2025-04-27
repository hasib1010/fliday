'use client';

import Link from 'next/link';
import Image from 'next/image';
import { AiFillTikTok } from "react-icons/ai";
import { AiFillInstagram } from "react-icons/ai";
import { FaFacebook } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  const popularDestinations = [
    { name: 'Spain', href: '/destinations/country/es' },
    { name: 'Greece', href: '/destinations/country/gr' },
    { name: 'Italy', href: '/destinations/country/it' },
    { name: 'Turkey', href: '/destinations/country/tr' },
    { name: 'United Kingdom', href: '/destinations/country/gb' },
    { name: 'Portugal', href: '/destinations/country/pt' },
    { name: 'France', href: '/destinations/country/fr' },
    { name: 'Morocco', href: '/destinations/country/ma' },
  ];
  
  const resources = [ 
    { name: 'Supported devices', href: '/compatibility' },
    { name: 'Blog', href: '/blog' },
  ];
  
  const helpLinks = [  
    { name: 'Plans', href: '/destinations' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Support', href: '/support' },
  ];
  
  const legalLinks = [
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Terms of Service', href: '/terms-of-service' },
  ];
  
  const socialLinks = [
    { 
      name: 'TikTok', 
      icon: (
        <AiFillTikTok />
      ), 
      href: 'https://tiktok.com/' 
    },
    { 
      name: 'YouTube', 
      icon: (
        <FaYoutube/>
      ), 
      href: 'https://youtube.com/' 
    },
    { 
      name: 'Instagram', 
      icon: (
        <AiFillInstagram />
      ), 
      href: 'https://instagram.com/' 
    },
    { 
      name: 'Facebook', 
      icon: (
        <FaFacebook />
      ), 
      href: 'https://facebook.com/' 
    },
    { 
      name: 'LinkedIn', 
      icon: (
        <FaLinkedin />
      ), 
      href: 'https://linkedin.com/' 
    },
  ];

  return (
    <footer className="bg-white lg:py-16 py-10 px-4">
      <div className="max-w-[1220px] mx-auto ">
        {/* Top border */}
        <div className="border-t border-gray-200 lg:mb-12 mb-4"></div>
        
        <div className="flex justify-between flex-col lg:flex-row  ">
          {/* Company Info */}
          <div className='md:max-w-[355px]'>
            <Link href="/" className="inline-block md:w-[355px] mb-6">
              <div className="flex items-center">
                <Image src="/logo.png" alt="CamelSIM Logo" width={100} height={50} /> 
              </div>
            </Link>
            
            <p className="text-[#8E8E8E] text-[16px] font-normal mb-4  text-left">
              Our mission is to make travel simpler, smarter, and more connected.
            </p>
            
            <p className="text-[#8E8E8E] text-[16px] font-normal  text-left">
              We help globetrotters stay online with instant eSIMs for 100+ countries — no roaming fees, no SIM card swaps, just seamless data wherever you land.
            </p>
          </div>
          
          {/* Popular Destinations */}
          <div className=' '>
            <h3 className="font-medium text-lg my-4">Popular Destinations</h3>
            <ul className="space-y-2 grid grid-cols-2 lg:grid-cols-1">
              {popularDestinations.map((destination) => (
                <li key={destination.name}>
                  <Link 
                    href={destination.href} 
                    className="text-[#8E8E8E] text-[16px] font-normal hover:text-[#F15A25] transition-colors"
                  >
                    {destination.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Resources */}
          <div className='lg:ml-10'>
            <h3 className="font-medium text-lg my-4">Resources</h3>
            <ul className="space-y-2  grid grid-cols-2 lg:grid-cols-1">
              {resources.map((resource) => (
                <li key={resource.name}>
                  <Link 
                    href={resource.href} 
                    className="text-[#8E8E8E] text-[16px] font-normal hover:text-[#F15A25] transition-colors"
                  >
                    {resource.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Help */}
          <div>
            <h3 className="font-medium text-lg my-4">Help</h3>
            <ul className="space-y-2  grid grid-cols-2 lg:grid-cols-1">
              {helpLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href} 
                    className="text-[#8E8E8E] text-[16px] font-normal hover:text-[#F15A25] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="border-t border-gray-200 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0">
              <p className="text-gray-500 text-sm">
                {currentYear} Fliday. All rights reserved.
              </p>
              
              <div className="md:ml-8 flex space-x-4">
                {legalLinks.map((link) => (
                  <Link 
                    key={link.name}
                    href={link.href} 
                    className="text-gray-500 text-sm hover:text-[#F15A25] transition-colors underline"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6 md:mt-0">
              {socialLinks.map((link) => (
                <Link 
                  key={link.name}
                  href={link.href} 
                  className="text-gray-500 text-3xl hover:text-[#F15A25] transition-colors"
                  aria-label={link.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.icon} 
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}