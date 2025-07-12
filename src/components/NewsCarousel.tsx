import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";

const newsItems = [
  {
    id: 1,
    title: "2025 Interior Design Trends: Sustainable Materials Take Center Stage",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    category: "Trends",
    date: "Mar 15, 2025"
  },
  {
    id: 2,
    title: "Global Design Summit in New York Announced for Fall 2025",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    category: "Events",
    date: "Mar 12, 2025"
  },
  {
    id: 3,
    title: "Smart Home Integration: The Future of Interior Design",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    category: "Technology",
    date: "Mar 10, 2025"
  },
  {
    id: 4,
    title: "Biophilic Design: Bringing Nature Indoors",
    image: "https://images.unsplash.com/photo-1618219740975-d40978bb7378?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    category: "Wellness",
    date: "Mar 8, 2025"
  }
];

const NewsCarousel = () => {
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const currentNews = newsItems[currentNewsIndex];

  // Auto-change news every 2 minutes (120 seconds)
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentNewsIndex((prevIndex) => (prevIndex + 1) % newsItems.length);
    }, 120000); // 120,000 ms = 2 minutes

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Latest News</h2>
        <span className="text-primary text-sm cursor-pointer hover:underline">View all</span>
      </div>
      <div className="relative">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="relative overflow-hidden">
              <img 
                src={currentNews.image} 
                alt={currentNews.title}
                className="w-full h-48 object-cover transition-all hover:scale-105 duration-700"
              />
              <Badge className="absolute top-2 left-2 bg-primary text-white">
                {currentNews.category}
              </Badge>
              
              {/* Animated progress bar */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
                <div 
                  key={currentNewsIndex} // Force element recreation when news changes
                  className="h-full bg-primary"
                  style={{ 
                    width: '0%', 
                    animation: 'progress 120s linear 1', // 120 seconds = 2 minutes
                    animationFillMode: 'forwards',
                    animationPlayState: 'running',
                  }}
                />
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center text-gray-500 text-xs mb-2">
                <CalendarDays className="h-3 w-3 mr-1" /> {currentNews.date}
              </div>
              <h3 className="font-medium text-base hover:text-primary cursor-pointer transition-colors">
                {currentNews.title}
              </h3>
            </div>
          </CardContent>
        </Card>
        
        {/* Indicators */}
        <div className="flex justify-center mt-3 gap-1.5">
          {newsItems.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentNewsIndex ? "bg-primary w-4" : "bg-gray-300"
              }`}
              onClick={() => setCurrentNewsIndex(index)}
            />
          ))}
        </div>
      </div>
      
      {/* Progress animation is handled in index.css */}
    </div>
  );
};

export default NewsCarousel;
