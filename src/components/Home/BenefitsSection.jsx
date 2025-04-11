'use client';

import Image from 'next/image';
import { RiVerifiedBadgeLine } from "react-icons/ri";
import { FaHandHoldingUsd } from "react-icons/fa";
import { BsFillSimSlashFill } from "react-icons/bs";
import { FaIdCard } from "react-icons/fa";

export default function BenefitsSection() {
  const benefits = [
    {
      icon: (
        // "/icons/VerifiedAccount.png"
        <RiVerifiedBadgeLine />
      ),
      title: "Affordable",
      description: "Plans tailored to your needs"
    },
    {
      icon: (
        <FaHandHoldingUsd/>
      ),
      title: "No hidden fees",
      description: "Internet without extra costs"
    },
    {
      icon: (
        <BsFillSimSlashFill />
      ),
      title: "No plastic SIM",
      description: "Easy & fast online installation"
    },
    {
      icon: (
        <FaIdCard/>
      ),
      title: "No ID required",
      description: "Just make your purchase and start using"
    }
  ];

  const paymentMethods = [
    { name: "PayPal", image: "/icons/paypal.png" },
    { name: "Apple Pay", image: "/icons/apple-pay.png" },
    { name: "Google Pay", image: "/icons/google-pay.png" },
    { name: "Mastercard", image: "/icons/mastercard.png" },
    { name: "Visa", image: "/icons/visa.png" }
  ];

  return (
    <section className=" p-3 lg:p-0  ">
      <div className=" ">
        <h2 className="lg:text-[40px] text-[28px]   text-left font-medium lg:my-12 my-5">Stay connected wherever you go</h2>
        
        <div className="bg-[#FFF3EE] rounded-2xl p-8  ">
          {/* Benefits Grid */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex flex-col  items-start  ">
                <div className="mb-4 text-5xl text-[#F15125] ">
                 {/* <img className='lg:h-14 h-8' src={benefit.icon} alt={benefit.title}    /> */}
                 {/* <img className='lg:h-14 h-8' src={benefit.icon} alt={benefit.title}    /> */}
                 {benefit.icon}
                </div>
                <h3 className="lg:text-xl text-[14px] font-medium mb-2">{benefit.title}</h3>
                <p className="text-gray-500 text-[14px] max-w-[220px]">{benefit.description}</p>
              </div>
            ))}
          </div>
          
          {/* Divider */}
          <div className="border-t border-gray-200 my-2"></div>
          
          {/* Payment Methods */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-6">
            <p className="text-gray-500 font-medium mb-4 md:mb-0">Secure payment methods</p>
            <div className="flex   lg:gap-6 gap-1.5 justify-center">
              {paymentMethods.map((method, index) => (
                <div key={index} className="h-8">
                    <img src={method.image} 
                    alt={`${method.name} payment`}  /> 
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}