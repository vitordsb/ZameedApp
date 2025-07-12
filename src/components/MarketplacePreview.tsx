import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const MarketplacePreview = () => {
  return (
    <section className="py-20 bg-teal-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Space?</h2>
        <p className="text-xl mb-10 max-w-3xl mx-auto">Join thousands of clients who have found their perfect design match through our marketplace.</p>
        <Link href="/marketplace">
          <Button 
            className="bg-primary text-white px-8 py-6 rounded-full text-lg font-semibold hover:bg-opacity-90 transition-all flex "
          >
            Conheça a plataforma!
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default MarketplacePreview;
