import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Designer } from "@shared/schema";
import { Star, MapPin, ChevronLeft, Filter } from "lucide-react";
import { formatPrice } from "@/lib/utils";

// Function to get project images (houses) for designers
const getProjectImage = (designerId: number): string => {
  // Sample project images - in a real app, these would come from the database
  const projectImages = [
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600607687644-c7f34c38f2d9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
  ];
  
  // Create a deterministic but random-looking selection based on the designer ID
  const imageIndex = designerId % projectImages.length;
  return projectImages[imageIndex];
};

const SearchResults = () => {
  // Get search parameters from URL
  const [_, setLocation] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get("query") || "";
  const searchLocation = urlParams.get("location") || "";
  const searchService = urlParams.get("service") || "";
  
  // State for designers and filter options
  const [filteredDesigners, setFilteredDesigners] = useState<Designer[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedServices, setSelectedServices] = useState<string[]>(
    searchService ? [searchService] : []
  );
  
  // Fetch all designers
  const { data: designers, isLoading } = useQuery({
    queryKey: ["/api/designers"],
  });
  
  // Filter designers based on search parameters
  useEffect(() => {
    if (designers && Array.isArray(designers)) {
      let results = [...designers];
      
      // Filter by search query (name, bio, title)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        results = results.filter(
          (designer) =>
            designer.name.toLowerCase().includes(query) ||
            (designer.bio && designer.bio.toLowerCase().includes(query)) ||
            (designer.title && designer.title.toLowerCase().includes(query))
        );
      }
      
      // Filter by location
      if (searchLocation) {
        results = results.filter(
          (designer) =>
            designer.location &&
            designer.location.toLowerCase().includes(searchLocation.toLowerCase())
        );
      }
      
      // Filter by service
      if (selectedServices.length > 0) {
        results = results.filter((designer) =>
          designer.services && designer.services.some(
            (service: string) => selectedServices.includes(service)
          )
        );
      }
      
      // Filter by price range
      results = results.filter(
        (designer) =>
          designer.hourlyRate >= priceRange[0] && 
          designer.hourlyRate <= priceRange[1]
      );
      
      setFilteredDesigners(results);
    }
  }, [designers, searchQuery, searchLocation, selectedServices, priceRange]);
  
  const availableServices = [
    "Interior Design",
    "Custom Furniture",
    "Kitchen Design",
    "Bathroom Design",
    "Space Planning",
    "Color Consultation",
    "Lighting Design",
    "Home Staging",
    "Commercial Design"
  ];

  // Handle going back to previous page
  const handleBack = () => {
    setLocation("/");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header and navigation */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {searchQuery 
              ? `Results for "${searchQuery}"` 
              : searchLocation 
                ? `Designers in ${searchLocation}` 
                : "All Designers"}
          </h1>
          <p className="text-gray-500 text-sm">
            {filteredDesigners.length} designers found
          </p>
        </div>
      </div>

      {/* Main content area with results and map */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Results list - Airbnb style with 3 items per row */}
        <div className="md:w-1/2 lg:w-3/5 pr-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredDesigners.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No designers found</h3>
              <p className="text-gray-500">
                Try adjusting your search criteria
              </p>
            </div>
          ) : (
            <>
              {/* Quick filters row - simplified */}
              <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b">
                <Badge variant="outline" className="rounded-full bg-white shadow-sm px-3 py-1 text-sm">
                  Price: ${priceRange[0]}-${priceRange[1]}
                </Badge>
                {selectedServices.length > 0 && (
                  <Badge variant="outline" className="rounded-full bg-white shadow-sm px-3 py-1 text-sm">
                    Services: {selectedServices.length}
                  </Badge>
                )}
                <Badge variant="outline" className="rounded-full bg-white shadow-sm px-3 py-1 text-sm">
                  Sort: Recommended
                </Badge>
                <Button variant="outline" size="sm" className="ml-auto text-xs h-7 rounded-full">
                  Clear all
                </Button>
              </div>
            
              {/* Grid of designers - 3 per row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDesigners.map((designer) => (
                  <div 
                    key={designer.id} 
                    className="group cursor-pointer"
                    onClick={() => setLocation(`/designer/${designer.id}`)}
                  >
                    {/* Project image (house photo) */}
                    <div className="aspect-square rounded-xl overflow-hidden mb-3 relative">
                      <img 
                        src={getProjectImage(designer.id)} 
                        alt={`${designer.name}'s project`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      
                      {/* Profile avatar overlay */}
                      <div className="absolute bottom-3 left-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                          <img 
                            src={designer.profileImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"} 
                            alt={designer.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      
                      {/* Favorite button */}
                      <button 
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-white shadow-sm opacity-70 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle favorite toggle here
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" 
                            stroke="black" strokeWidth="2" fill="none" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Designer details */}
                    <div>
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{designer.name}</h3>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400 mr-0.5" />
                          <span className="text-sm">{designer.rating || 4.8}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-500 text-sm truncate">{designer.title}</p>
                      
                      <div className="flex items-center mt-1 text-gray-500 text-sm">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        <span className="truncate">{designer.location || "New York, NY"}</span>
                      </div>
                      
                      <p className="mt-1 text-black">
                        <span className="font-medium">{formatPrice(designer.hourlyRate || 85)}</span>
                        <span className="text-gray-500">/hour</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Right section - Map */}
        <div className="md:w-1/2 lg:w-2/5 h-[calc(100vh-120px)] sticky top-4 hidden md:block">
          <div className="bg-white rounded-lg shadow-sm h-full overflow-hidden">
            <div className="relative h-full">
              {/* This would be replaced with an actual map component */}
              <div className="absolute inset-0 bg-cover bg-center" style={{ 
                backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80')`
              }}></div>
              
              {/* Map controls */}
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-2 z-20">
                <div className="flex flex-col gap-2">
                  <button className="h-8 w-8 bg-white rounded-md flex items-center justify-center hover:bg-gray-100">
                    <span className="text-xl font-medium">+</span>
                  </button>
                  <button className="h-8 w-8 bg-white rounded-md flex items-center justify-center hover:bg-gray-100">
                    <span className="text-xl font-medium">−</span>
                  </button>
                </div>
              </div>
              
              {/* Map markers */}
              {filteredDesigners.slice(0, 8).map((designer, index) => {
                // Create a random but consistent position for each designer
                const randomSeed = designer.id * 17 % 100;
                const top = 15 + (randomSeed % 60);
                const left = 20 + ((randomSeed * 3) % 60);
                
                return (
                  <div 
                    key={designer.id}
                    className="absolute z-10 cursor-pointer group"
                    style={{
                      top: `${top}%`,
                      left: `${left}%`,
                    }}
                  >
                    {/* Price tag marker */}
                    <div className="bg-white text-gray-900 rounded-full px-3 py-1.5 shadow-md font-medium text-sm hover:scale-105 transition-transform">
                      ${designer.hourlyRate || 85}/hr
                    </div>
                    
                    {/* Hover card preview */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-60 hidden group-hover:block">
                      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="h-24 overflow-hidden">
                          <img 
                            src={getProjectImage(designer.id)} 
                            alt={`${designer.name}'s project`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-2 relative">
                          {/* Small circular avatar */}
                          <div className="absolute -top-6 left-2 w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-md">
                            <img 
                              src={designer.profileImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"} 
                              alt={designer.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <div className="flex justify-between items-center mt-2">
                            <h4 className="font-medium text-sm">{designer.name}</h4>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-xs ml-0.5 font-medium">{designer.rating || 4.8}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{designer.title}</p>
                          <p className="text-sm font-medium mt-1">${designer.hourlyRate || 85}/hour</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Map attribution */}
              <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 text-xs text-gray-600 py-1 px-2 rounded-md">
                Map data © 2025
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile filter button - visible only on small screens */}
      <div className="md:hidden fixed bottom-4 right-4">
        <Button size="lg" className="rounded-full shadow-lg flex items-center">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>
    </div>
  );
};

export default SearchResults;
