import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import ApplicationLayout from "@/components/layouts/ApplicationLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StarRating from "@/components/StarRating";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatPrice, formatRelativeTime, getInitials } from "@/lib/utils";
import { Product, ProductReview } from "@shared/schema";
import { Loader2, Star, MessageSquare, ArrowLeft, MessageCircle } from "lucide-react";

export default function ProductDetail() {
  const [location] = useLocation();
  const productId = location.split("/").pop();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviewContent, setReviewContent] = useState("");
  const [rating, setRating] = useState(5);

  // Fetch product details
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch product");
      }
      return response.json();
    },
    enabled: !!productId,
  });

  // Fetch product reviews
  const { data: reviews, isLoading: isLoadingReviews } = useQuery<ProductReview[]>({
    queryKey: ["/api/products", productId, "reviews"],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}/reviews`);
      if (!response.ok) {
        throw new Error("Failed to fetch product reviews");
      }
      return response.json();
    },
    enabled: !!productId,
  });

  // Submit a review
  const reviewMutation = useMutation({
    mutationFn: async (reviewData: { content: string; rating: number }) => {
      return apiRequest("POST", `/api/products/${productId}/reviews`, reviewData);
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Your review has been submitted successfully",
      });
      setReviewContent("");
      setRating(5);
      // Invalidate the reviews query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "reviews"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  // Create a new message to the seller
  const handleContactSeller = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "You need to login to contact the seller",
        variant: "destructive",
      });
      return;
    }

    if (product?.sellerId) {
      // Redirect to the messages page with the seller ID pre-selected
      window.location.href = `/messages?partnerId=${product.sellerId}`;
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a review comment",
        variant: "destructive",
      });
      return;
    }

    reviewMutation.mutate({
      content: reviewContent,
      rating,
    });
  };

  if (isLoading) {
    return (
      <ApplicationLayout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ApplicationLayout>
    );
  }

  if (!product) {
    return (
      <ApplicationLayout>
        <div className="container mx-auto py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Link href="/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </ApplicationLayout>
    );
  }

  return (
    <ApplicationLayout>
      <div className="container mx-auto py-8">
        <Link href="/products">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div>
            <div className="bg-muted rounded-lg overflow-hidden aspect-square mb-4">
              <img
                src={
                  product.images && product.images.length > 0
                    ? product.images[activeImageIndex]
                    : "/placeholder-product.jpg"
                }
                alt={product.name}
                className="object-cover w-full h-full"
              />
            </div>

            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((image, index) => (
                  <div
                    key={index}
                    className={`aspect-square rounded-md overflow-hidden cursor-pointer border-2 ${
                      index === activeImageIndex
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                    onClick={() => setActiveImageIndex(index)}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - Image ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center">
                    <StarRating rating={Number(product.rating || 0)} />
                    <span className="ml-2 text-muted-foreground">
                      ({product.reviewCount || 0} reviews)
                    </span>
                  </div>
                  <Badge className="bg-primary/10 text-primary">
                    {product.category}
                  </Badge>
                </div>
              </div>
              <div className="text-3xl font-bold">{formatPrice(Number(product.price))}</div>
            </div>

            <Separator className="my-4" />

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            {product.specifications && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Specifications</h2>
                <ul className="space-y-2 text-muted-foreground">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <li key={key} className="flex">
                      <span className="font-medium min-w-[180px]">{key}:</span>
                      <span>{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button onClick={handleContactSeller} className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Seller
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs for Reviews & Seller Info */}
        <div className="mt-12">
          <Tabs defaultValue="reviews">
            <TabsList className="mb-6">
              <TabsTrigger value="reviews">
                <MessageSquare className="h-4 w-4 mr-2" />
                Reviews ({product.reviewCount || 0})
              </TabsTrigger>
              <TabsTrigger value="seller">
                <Star className="h-4 w-4 mr-2" />
                Seller Information
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reviews" className="space-y-6">
              {/* Add a review form */}
              {user && (
                <Card>
                  <CardHeader>
                    <CardTitle>Write a Review</CardTitle>
                    <CardDescription>
                      Share your experience with this product
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitReview}>
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">Rating:</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-6 w-6 cursor-pointer ${
                                  star <= rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                }`}
                                onClick={() => setRating(star)}
                              />
                            ))}
                          </div>
                        </div>
                        <Textarea
                          placeholder="Write your review here..."
                          className="min-h-[120px]"
                          value={reviewContent}
                          onChange={(e) => setReviewContent(e.target.value)}
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={reviewMutation.isPending}
                        className="w-full"
                      >
                        {reviewMutation.isPending && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Submit Review
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Reviews list */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Customer Reviews</h3>
                {isLoadingReviews ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : !reviews || reviews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No reviews yet. Be the first to review this product!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar>
                                <AvatarImage src={review.user?.profileImage || ""} />
                                <AvatarFallback>
                                  {getInitials(review.user?.name || "User")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-base">
                                  {review.user?.name || "User"}
                                </CardTitle>
                                <div className="flex items-center">
                                  <StarRating rating={review.rating} />
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {formatRelativeTime(review.createdAt?.toString() || "")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{review.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="seller">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={product.seller?.profileImage || ""} />
                      <AvatarFallback>
                        {getInitials(product.seller?.name || "Seller")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{product.seller?.name || "Seller"}</CardTitle>
                      <CardDescription>
                        Member since{" "}
                        {new Date(
                          product.seller?.createdAt || new Date()
                        ).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {product.seller?.description ||
                      "This seller hasn't added a description yet."}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleContactSeller}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Seller
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ApplicationLayout>
  );
}