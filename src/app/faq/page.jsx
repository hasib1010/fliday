'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FAQ() {
    // Array of FAQ items with questions and answers
    const faqItems = [
        {
            question: "What is an eSIM and how do you use it?",
            answer: "An eSIM (embedded SIM) is a digital SIM card built into your device. To use it, purchase a plan on our site, scan the QR code we provide, and follow your phone's setup instructions. Once activated, you'll have data connectivity without needing a physical SIM card."
        },
        {
            question: "Which devices are compatible with eSIM?",
            answer: "Most modern smartphones, tablets, and smartwatches support eSIM technology. This includes recent iPhone models (XR and newer), Samsung Galaxy S20+ and newer, Google Pixel 3 and newer, and many other devices. Check our compatibility page for a complete list."
        },
        {
            question: "How do I activate my eSIM plan?",
            answer: "After purchase, you'll receive a QR code via email. On your device, go to Settings > Cellular/Mobile > Add Cellular/Mobile Plan, then scan the QR code. Follow the on-screen instructions to complete activation. Your data plan will be ready to use when you arrive at your destination."
        },
        {
            question: "Can I use my eSIM in multiple countries?",
            answer: "Yes! We offer regional and global plans that work across multiple countries. Our regional plans cover specific areas like Europe, Asia, or the Americas, while our global plans provide coverage in 100+ countries worldwide."
        },
        {
            question: "Do I need to turn on data roaming with an eSIM?",
            answer: "Yes, you'll need to enable data roaming for your eSIM profile in your device settings. Don't worry though - since you're using our eSIM plan, you won't incur any additional roaming charges beyond the plan you've purchased."
        },
        {
            question: "How long are eSIM plans valid?",
            answer: "Our eSIM plans range from 7 days to 30 days, depending on the plan you choose. The validity period begins when you first connect to a network in your destination, not from the purchase date, giving you flexibility in planning your trip."
        },
        {
            question: "Can I use my eSIM and physical SIM simultaneously?",
            answer: "Yes, most eSIM-compatible devices support Dual SIM Dual Standby (DSDS), which means you can use both your physical SIM and eSIM at the same time. This allows you to keep your regular phone number active while using our eSIM for data."
        },
        {
            question: "Can I top up or extend my eSIM plan?",
            answer: "Yes, you can purchase additional data or extend your plan directly through our website or app. If your current plan is running low, simply log into your account and select the top-up option for your active plan."
        },
        {
            question: "Will my eSIM work in remote areas or on islands?",
            answer: "Our eSIMs connect to major local networks in each country, so coverage is generally good in populated areas. However, like any mobile service, coverage may be limited in very remote locations. Check our coverage maps for specific destinations."
        },
        {
            question: "What if I need help with my eSIM?",
            answer: "Our customer support team is available 24/7 to assist with any issues. You can contact us via chat on our website, email at support@youresimcompany.com, or through our app. We typically respond within minutes to resolve your connectivity issues quickly."
        },
        {
            question: "Is an eSIM better than a physical SIM card?",
            answer: "eSIMs offer several advantages: they're more convenient (no need to find a local SIM shop), environmentally friendly (no plastic), can't be lost, allow for dual SIM usage, and can be set up before you travel. They provide the same connectivity quality as physical SIMs."
        },
        {
            question: "How secure is an eSIM?",
            answer: "eSIMs are considered more secure than physical SIM cards because they cannot be physically removed or swapped. The digital provisioning process is encrypted, and eSIMs are tamper-resistant. Your data connection is as secure as it would be with a traditional SIM."
        }
    ];

    // State to track which FAQ item is expanded (only one at a time)
    const [expandedIndex, setExpandedIndex] = useState(null);

    // Function to toggle expanded state of an FAQ item
    const toggleItem = (index) => {
        setExpandedIndex(prev => prev === index ? null : index);
    };

    return (
        <section className="max-w-[1220px] mx-auto py-12 ">
            <div className=" mx-auto  ">
                <h2 className="text-3xl md:text-[40px] font-medium ">Frequently Asked Questions</h2>
                <p className='mb-12 mt-1 text-[22px]'>We have got answers to your most common questions.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {faqItems.map((item, index) => (
                        <div
                            key={index}
                            className="bg-[#F6F6F6] rounded-lg overflow-hidden"
                            style={{ height: 'fit-content' }}
                        >
                            <button
                                onClick={() => toggleItem(index)}
                                className="flex justify-between items-center w-full p-5 text-left font-medium hover:bg-gray-100 transition-colors"
                                aria-expanded={expandedIndex === index}
                            >
                                <span>{item.question}</span>
                                <ChevronDown
                                    className={`transition-transform duration-200 flex-shrink-0 ${expandedIndex === index ? 'transform rotate-180' : ''
                                        }`}
                                    size={20}
                                />
                            </button>

                            {expandedIndex === index && (
                                <div className="p-5 pt-0 text-gray-600">
                                    <p>{item.answer}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-[#F6F6F6] rounded-lg p-8 my-12 flex flex-col md:flex-row justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Still can't find an answer to your question?</h2>
                    <p className="text-gray-600">Our team is here to help you out—just reach out!</p>
                </div>
                <div className="mt-6 md:mt-0">
                    <a
                        href="/contact"
                        className="inline-block px-8 py-3 bg-[#F15A25] text-white rounded-full font-medium hover:bg-[#e04e1a] transition-colors"
                    >
                        Contact Us
                    </a>
                </div>
            </div>
        </section>
    );
}