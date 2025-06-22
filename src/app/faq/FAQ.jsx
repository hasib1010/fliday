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
            answer: "Our customer support team is available 24/7 to assist with any issues. You can contact us via chat on our website, email at support@fliday.com, or through our app. We typically respond within minutes to resolve your connectivity issues quickly."
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

    // State to track expanded FAQ items (multiple can be open at once)
    const [expandedItems, setExpandedItems] = useState({});

    // Function to toggle expanded state of an FAQ item
    const toggleItem = (index) => {
        setExpandedItems(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    // Split FAQ items into two columns for medium screens and up
    const leftColumnItems = faqItems.slice(0, Math.ceil(faqItems.length / 2));
    const rightColumnItems = faqItems.slice(Math.ceil(faqItems.length / 2));

    // Render a single FAQ item
    const renderFaqItem = (item, index) => (
        <div
            key={index}
            className="bg-[#F6F6F6] rounded-lg overflow-hidden mb-4"
        >
            <button
                onClick={() => toggleItem(index)}
                className="flex justify-between items-center w-full p-5 text-left font-medium hover:bg-gray-100 transition-colors"
                aria-expanded={expandedItems[index]}
            >
                <span className="pr-4">{item.question}</span>
                <ChevronDown
                    className={`transition-transform duration-200 flex-shrink-0 ${expandedItems[index] ? 'transform rotate-180' : ''}`}
                    size={20}
                />
            </button>

            <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedItems[index] 
                        ? 'max-h-[500px] opacity-100' 
                        : 'max-h-0 opacity-0'
                }`}
            >
                <div className="p-5 pt-0 text-gray-600">
                    <p>{item.answer}</p>
                </div>
            </div>
        </div>
    );

    return (
        <section className="max-w-[1220px] mx-auto mt-24 pt-5 px-3 lg:px-0">
            <div className="mx-auto">
                <h2 className="lg:text-[40px] text-[28px] text-left md:text-[40px] font-medium">Frequently Asked Questions</h2>
                <p className='lg:mb-12 mb-3.5 mt-1 lg:text-[22px] text-base text-left'>We have got answers to your most common questions.</p>
                
                {/* Mobile view: Single column */}
                <div className="md:hidden">
                    {faqItems.map((item, index) => renderFaqItem(item, index))}
                </div>
                
                {/* Desktop view: Two columns */}
                <div className="hidden md:flex md:space-x-4">
                    <div className="w-1/2">
                        {leftColumnItems.map((item, index) => renderFaqItem(item, index))}
                    </div>
                    <div className="w-1/2">
                        {rightColumnItems.map((item, index) => renderFaqItem(item, index + leftColumnItems.length))}
                    </div>
                </div>
            </div>
            <div className="bg-[#F6F6F6] rounded-lg p-8 mt-12 flex flex-col md:flex-row justify-between items-center">
                <div>
                    <h2 className="lg:text-2xl text-xl text-center font-medium mb-2">Still can't find an answer to your question?</h2>
                    <p className="text-gray-600 lg:text-left text-center">Our team is here to help you out—just reach out!</p>
                </div>
                <div className="mt-3 md:mt-0">
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