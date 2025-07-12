import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import ApplicationLayout from "@/components/layouts/ApplicationLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import StarRating from "@/components/StarRating";
import { Product } from "@shared/schema";
import { formatPrice } from "@/lib/utils";
import { Loader2, Search } from "lucide-react";

// Define product categories
const PRODUCT_CATEGORIES = [
  { id: "all", name: "All Products" },
  { id: "floor", name: "Flooring" },
  { id: "decorations", name: "Decorations" },
  { id: "furniture", name: "Furniture" },
  { id: "windows", name: "Windows" },
  { id: "illumination", name: "Lighting" },
  { id: "curtains", name: "Curtains" },
  { id: "luxury", name: "Luxury Materials" },
];

export default function Marketplace() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [isFiltering, setIsFiltering] = useState(false);

  // Fetch products based on the active category
  const {
    data: products,
    isLoading,
    refetch,
  } = useQuery<Product[]>({
    queryKey: ["/api/products", activeCategory, searchQuery, priceRange],
    queryFn: async () => {
      let url = "/api/products";
      const params = new URLSearchParams();

      if (activeCategory !== "all") {
        params.append("category", activeCategory);
      }

      if (searchQuery) {
        params.append("query", searchQuery);
      }

      if (isFiltering) {
        params.append("minPrice", priceRange[0].toString());
        params.append("maxPrice", priceRange[1].toString());
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    },
    enabled: true,
  });

  // Fetch featured products for the "Featured" tab
  const { data: featuredProducts, isLoading: isFeaturedLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
    queryFn: async () => {
      const response = await fetch("/api/products/featured?limit=6");
      if (!response.ok) {
        throw new Error("Failed to fetch featured products");
      }
      return response.json();
    },
  });

  // Handle filtering by price range
  const handlePriceFilterApply = () => {
    setIsFiltering(true);
    refetch();
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setPriceRange([0, 10000]);
    setIsFiltering(false);
    setActiveCategory("all");
  };

  // Apply search query
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  return (
    <ApplicationLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Design Products Marketplace</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Left sidebar with filters */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <form onSubmit={handleSearch} className="flex space-x-2">
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </form>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Price Range</h3>
                  <Slider
                    defaultValue={[0, 10000]}
                    max={10000}
                    step={100}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="my-6"
                  />
                  <div className="flex justify-between text-sm">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                  <Button onClick={handlePriceFilterApply} className="w-full mt-2">
                    Apply
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="w-full mt-4"
                >
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main content area */}
          <div className="md:col-span-3">
            <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="mb-6 flex flex-wrap">
                {PRODUCT_CATEGORIES.map((category) => (
                  <TabsTrigger key={category.id} value={category.id}>
                    {category.name}
                  </TabsTrigger>
                ))}
                <TabsTrigger value="featured">Featured</TabsTrigger>
              </TabsList>

              {/* Regular category tabs */}
              {PRODUCT_CATEGORIES.map((category) => (
                <TabsContent key={category.id} value={category.id} className="space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !products || products.length === 0 ? (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium">No products found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your filters or search terms
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products
                        .filter(
                          (product) =>
                            category.id === "all" || product.category === category.id
                        )
                        .map((product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                  )}
                </TabsContent>
              ))}

              {/* Featured tab */}
              <TabsContent value="featured" className="space-y-4">
                {isFeaturedLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !featuredProducts || featuredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium">No featured products available</h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </ApplicationLayout>
  );
}

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="aspect-square relative bg-muted overflow-hidden">
        <img
          src={product.images && product.images.length > 0 ? product.images[0] : "/placeholder-product.jpg"}
          alt={product.name}
          className="object-cover w-full h-full transition-transform hover:scale-105"
        />
      </div>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            {product.category}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{product.description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 mt-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <StarRating rating={Number(product.rating || 0)} />
            <span className="text-sm text-muted-foreground ml-2">
              ({product.reviewCount || 0})
            </span>
          </div>
          <span className="font-medium text-lg">{formatPrice(Number(product.price))}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link href={`/products/${product.id}`}>
          <Button className="w-full">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}