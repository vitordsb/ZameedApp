import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Benefits from "@/components/Benefits";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

const Home = () => {
  return (
    <div>
      <Hero />

      <HowItWorks />
      <Benefits />
      <Testimonials />
      <Footer/>
    </div>
  );
};

export default Home;
