'use client';

import Image from 'next/image';

export default function BenefitsSection() {
  const benefits = [
    {
      icon: (
        "/icons/VerifiedAccount.png"
      ),
      title: "Affordable",
      description: "Plans tailored to your needs"
    },
    {
      icon: (
        "/icons/GetCash.png"
      ),
      title: "No hidden fees",
      description: "Internet without extra costs"
    },
    {
      icon: (
       "/icons/sim.png"
      ),
      title: "No plastic SIM",
      description: "Easy & fast online installation"
    },
    {
      icon: (
        "/icons/IdentityTheft.png"
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
    <section className=" ">
      <div className=" ">
        <h2 className="lg:text-[40px] text-xl  text-center lg:text-left font-medium my-12">Stay connected wherever you go</h2>
        
        <div className="bg-[#FFF3EE] rounded-2xl p-8  ">
          {/* Benefits Grid */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex flex-col lg:items-start items-center ">
                <div className="mb-4">
                 <Image src={benefit.icon} alt={benefit.title} width={60} height={60}   />
                </div>
                <h3 className="text-xl font-medium mb-2">{benefit.title}</h3>
                <p className="text-gray-500 max-w-[220px]">{benefit.description}</p>
              </div>
            ))}
          </div>
          
          {/* Divider */}
          <div className="border-t border-gray-200 my-2"></div>
          
          {/* Payment Methods */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-6">
            <p className="text-gray-500 font-medium mb-4 md:mb-0">Secure payment methods</p>
            <div className="flex flex-wrap gap-6 justify-center">
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