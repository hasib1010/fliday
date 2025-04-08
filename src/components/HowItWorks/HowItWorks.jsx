'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, Smartphone, Globe, Clock, CreditCard } from 'lucide-react';
import FAQSection from '../Home/FAQSection';

export default function HowItWorks() {
    // Array of steps for the process
    const steps = [
        {
            id: 1,
            title: "Choose your destination",
            description: "Select from over 100+ countries worldwide. We offer affordable eSIM plans for every traveler's needs.",
            icon: <Globe className="w-12 h-12 text-[#F15A25]" />,
            image: "/howitworks/1.png"
        },
        {
            id: 2,
            title: "Select your data plan",
            description: "Pick the amount of data you need and the duration of your trip. We offer flexible plans from 1GB to 20GB with validity from 7 to 30 days.",
            icon: <CreditCard className="w-12 h-12 text-[#F15A25]" />,
            image: "/howitworks/2.png"
        },
        {
            id: 3,
            title: "Install your eSIM",
            description: "After purchase, you'll receive a QR code. Scan it with your phone to install the eSIM profile. No physical SIM card needed!",
            icon: <Smartphone className="w-12 h-12 text-[#F15A25]" />,
            image: "/howitworks/3.png"
        },
        {
            id: 4,
            title: "Activate and enjoy",
            description: "When you arrive at your destination, activate your eSIM with a single tap. Enjoy fast, reliable internet throughout your journey.",
            icon: <Clock className="w-12 h-12 text-[#F15A25]" />,
            image: "/howitworks/4.png"
        }
    ];

    // Array of benefits
    const benefits = [
        {
            title: "Instant Setup",
            description: "Get your eSIM immediately after purchase. No waiting, no shipping."
        },
        {
            title: "Travel-Ready",
            description: "Setup before you travel and activate on arrival."
        },
        {
            title: "No Roaming Fees",
            description: "Say goodbye to expensive roaming charges from your home carrier."
        },
        {
            title: "Keep Your Number",
            description: "Use dual SIM functionality to keep your regular number active."
        },
        {
            title: "Secure Connection",
            description: "Enjoy protected internet access without relying on public WiFi."
        },
        {
            title: "24/7 Support",
            description: "Our team is available to help at any time during your travels."
        }
    ];

    // Frequently asked questions about eSIMs
    const faqs = [
        {
            question: "What is an eSIM?",
            answer: "An eSIM (embedded SIM) is a digital SIM card built into your device. It allows you to activate a cellular plan without using a physical SIM card."
        },
        {
            question: "Which devices support eSIM?",
            answer: "Most modern smartphones support eSIM, including iPhone XS and newer, Google Pixel 3 and newer, Samsung Galaxy S20 and newer, and many other recent models."
        },
        {
            question: "How do I know if my phone is compatible?",
            answer: "You can check if your device is eSIM compatible in your phone settings or by using our compatibility checker tool."
        },
        {
            question: "Can I use both my regular SIM and eSIM at the same time?",
            answer: "Yes, most eSIM-compatible phones support Dual SIM Dual Standby (DSDS), allowing you to use both your physical SIM and eSIM simultaneously."
        }
    ];

    return (
        <div className="max-w-[1220px] mx-auto py-12">
            {/* Hero Section */}
            <div className="bg-[#FFF8F6] py-16 px-4 md:px-8 rounded-b-3xl">
                <div className="max-w-5xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-medium mb-6">
                        Get connected in <span className="text-[#F15A25]">1 minute</span> with our eSIM
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto">
                        Travel smart with our hassle-free eSIM technology. Stay connected anywhere without roaming fees or SIM swaps.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            href="/destinations"
                            className="bg-[#F15A25] text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-[#d84e1f] transition-colors"
                        >
                            Explore Destinations
                        </Link>

                    </div>
                </div>
            </div>

            {/* Process Steps Section */}
            <div className="py-20 px-4 md:px-8">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-medium text-center mb-16">
                        How Fliday eSIM works
                    </h2>

                    <div className="space-y-20">
                        {steps.map((step, index) => (
                            <div
                                key={step.id}
                                className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                                    } gap-8 md:gap-16 items-center`}
                            >
                                <div className="w-full md:w-1/2">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="bg-[#FFF0EC] w-12 h-12 rounded-full flex items-center justify-center text-[#F15A25] font-medium text-xl">
                                            {step.id}
                                        </div>
                                        <h3 className="text-2xl font-medium">{step.title}</h3>
                                    </div>
                                    <p className="text-gray-600 text-lg mb-6">{step.description}</p>

                                    {step.id === 3 && (
                                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Pro tip:</span> Install your eSIM before your trip so you're ready to connect as soon as you land.
                                            </p>
                                        </div>
                                    )}
                                </div>



                                <div className="relative max-w-[513px] h-[360.99px] flex-1">
                                    {/* Background behind image */}
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[513px] h-[249px] bg-[#FFF3EE] rounded-[20px] z-0"></div>

                                    {/* Image on top */}
                                    <Image
                                        src={step.image}
                                        alt={step.title}
                                        width={372.02}
                                        height={360.99}
                                        className="relative z-10 rounded-xl mx-auto"
                                    />
                                </div>



                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Benefits Section */}
            <div className="bg-[#FFF8F6] py-20 px-4 md:px-8 rounded-3xl my-16">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-medium text-center mb-16">
                        Why choose a Fliday eSIM?
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {benefits.map((benefit, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
                                <div className="flex items-start gap-3 mb-3">
                                    <CheckCircle2 className="w-6 h-6 text-[#F15A25] flex-shrink-0 mt-1" />
                                    <h3 className="text-xl font-medium">{benefit.title}</h3>
                                </div>
                                <p className="text-gray-600 ml-9">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <FAQSection />
        </div>
    );
}