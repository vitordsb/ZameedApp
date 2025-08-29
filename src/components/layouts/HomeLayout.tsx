import Hero from "@/components/layouts/home/Hero";
import HowItWorks from "@/components/layouts/home/HowItWorks";
import Benefits from "@/components/layouts/home/Benefits";
import Footer from "@/components/layouts/home/Footer";

export default function HomeLayout() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Benefits />
      <Footer />
    </>
  );
}
