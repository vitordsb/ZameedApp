import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Globe, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface LocationOption {
  type: "continent" | "country";
  name: string;
}

interface FindDesignerSidebarProps {
  onStyleChange: (style: string) => void;
  onPriceChange: (priceRange: number[]) => void;
  onLocationChange: (location: string) => void;
}

const FindDesignerSidebar = ({
  onStyleChange,
  onPriceChange,
  onLocationChange
}: FindDesignerSidebarProps) => {
  const [_, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isLocationPopoverOpen, setIsLocationPopoverOpen] = useState(false);

  const services = [
    "Interior Design",
    "Custom Furniture", 
    "Space Planning",
    "3D Rendering",
    "Lighting Design",
    "Color Consultation",
    "Home Staging",
    "Commercial Design"
  ];
  
  const locationOptions: LocationOption[] = [
    { type: "continent", name: "North America" },
    { type: "continent", name: "Europe" },
    { type: "continent", name: "Asia" },
    { type: "continent", name: "South America" },
    { type: "continent", name: "Africa" },
    { type: "continent", name: "Australia & Oceania" },
    { type: "country", name: "United States" },
    { type: "country", name: "Canada" },
    { type: "country", name: "United Kingdom" },
    { type: "country", name: "France" },
    { type: "country", name: "Germany" },
    { type: "country", name: "Japan" },
    { type: "country", name: "China" },
    { type: "country", name: "Australia" },
    { type: "country", name: "Brazil" },
    { type: "country", name: "India" },
    { type: "country", name: "Mexico" },
    { type: "country", name: "Spain" },
    { type: "country", name: "Italy" },
    { type: "country", name: "Remote Only" }
  ];
  
  const suggestions = [
    {
      id: 1,
      name: "Michael Torres",
      title: "Architectural Designer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
      rating: 4.9,
      specialty: "Modern Minimalist",
      projectImage: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 2,
      name: "Sarah Chen",
      title: "Senior Architect",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
      rating: 5.0,
      specialty: "Sustainable Design",
      projectImage: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 3,
      name: "Robert Kim",
      title: "Landscape Architect",
      avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
      rating: 4.8,
      specialty: "Urban Gardens",
      projectImage: "https://images.unsplash.com/photo-1615529182904-14819c35db37?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    }
  ];

  const handleLocationSelect = (locationName: string) => {
    setSelectedLocation(locationName);
    setIsLocationPopoverOpen(false);
    onLocationChange(locationName);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleServiceSelect = (service: string) => {
    const newService = selectedService === service ? null : service;
    setSelectedService(newService);
    onStyleChange(newService || "");
  };

  const handleSearch = () => {
    // Create search params
    const searchParams = new URLSearchParams();
    
    if (searchTerm) {
      searchParams.append("query", searchTerm);
    }
    
    if (selectedLocation) {
      searchParams.append("location", selectedLocation);
    }
    
    if (selectedService) {
      searchParams.append("service", selectedService);
    }
    
    // Navigate to search results page with params
    setLocation(`/search?${searchParams.toString()}`);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Find Designers</h2>
      
      <div className="space-y-4">
        {/* Location selector with dropdown */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Location</Label>
          <Popover open={isLocationPopoverOpen} onOpenChange={setIsLocationPopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between bg-white"
              >
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  {selectedLocation || "Select a location"}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <div className="max-h-[300px] overflow-y-auto divide-y">
                <div className="p-2">
                  <h4 className="text-xs font-semibold text-gray-500 mb-1">CONTINENTS</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {locationOptions
                      .filter(opt => opt.type === "continent")
                      .map(option => (
                        <Button 
                          key={option.name}
                          variant="ghost" 
                          className="w-full justify-start h-9 px-2"
                          onClick={() => handleLocationSelect(option.name)}
                        >
                          <Globe className="h-3.5 w-3.5 mr-2 text-primary" />
                          {option.name}
                        </Button>
                      ))}
                  </div>
                </div>
                <div className="p-2">
                  <h4 className="text-xs font-semibold text-gray-500 mb-1">POPULAR COUNTRIES</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {locationOptions
                      .filter(opt => opt.type === "country")
                      .map(option => (
                        <Button 
                          key={option.name}
                          variant="ghost" 
                          className="w-full justify-start h-9 px-2"
                          onClick={() => handleLocationSelect(option.name)}
                        >
                          <MapPin className="h-3.5 w-3.5 mr-2 text-primary" />
                          {option.name}
                        </Button>
                      ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Search bar */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Search</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Find designers by name, specialty, style..."
              className="flex-1"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Button 
              variant="default" 
              size="icon"
              className="shrink-0 bg-primary text-white"
              onClick={handleSearch}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Services filter */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Service</Label>
          <div className="flex flex-wrap gap-2">
            {services.map((service) => (
              <Badge
                key={service}
                variant={selectedService === service ? "default" : "outline"}
                className={`cursor-pointer py-1 ${
                  selectedService === service 
                    ? "bg-primary text-white" 
                    : "bg-transparent hover:bg-gray-100 text-gray-700"
                }`}
                onClick={() => handleServiceSelect(service)}
              >
                {service}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      
      {/* Suggestions section */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium mb-3">Suggestions</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="cursor-pointer group">
              <div className="rounded-lg overflow-hidden mb-2 aspect-[4/3] relative">
                <img 
                  src={suggestion.projectImage} 
                  alt={`${suggestion.name}'s project`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {suggestion.name}
                  </p>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 truncate mr-1">
                      {suggestion.title}
                    </span>
                    <div className="flex items-center">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs ml-0.5">{suggestion.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FindDesignerSidebar;