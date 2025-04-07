import BenefitsSection from "@/components/Home/BenefitsSection";
import FAQSection from "@/components/Home/FAQSection";
import Hero from "@/components/Home/Hero";
import PopularDestinations from "@/components/Home/PopularDestinations"; 
import SetupProcess from "@/components/Home/SetupProcess";

// src/app/page.js
export default function Home() {
  return (
    <main>
      <div className="hero-container">  
        <Hero />
      </div>
      <div className="max-w-[1220px] mx-auto px-1">
      <PopularDestinations />
      <SetupProcess />
      <BenefitsSection/>
      <FAQSection />
      </div>
    </main>
  );
}