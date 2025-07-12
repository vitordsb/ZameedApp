import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ApplicationLayout from "@/components/layouts/ApplicationLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

// Define product categories
const PRODUCT_CATEGORIES = [
  { id: "floor", name: "Flooring" },
  { id: "decorations", name: "Decorations" },
  { id: "furniture", name: "Furniture" },
  { id: "windows", name: "Windows" },
  { id: "illumination", name: "Lighting" },
  { id: "curtains", name: "Curtains" },
  { id: "luxury", name: "Luxury Materials" },
];

// Define form validation schema
const productFormSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().min(1, "Price is required"),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  quantity: z.string().min(1, "Quantity is required"),
  images: z.array(z.string()).optional(),
  imageUrls: z.string().optional(), // Temporary field for adding multiple image URLs
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function CreateProduct() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "",
      subcategory: "",
      quantity: "1",
      images: [],
      imageUrls: "",
    },
  });

  const onSubmit = async (data: ProductFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create products",
        variant: "destructive",
      });
      return;
    }

    // Convert image URLs from comma-separated string to array if provided
    let imagesArray: string[] = data.images || [];
    if (data.imageUrls) {
      const newImages = data.imageUrls
        .split(",")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);
      imagesArray = [...imagesArray, ...newImages];
    }

    try {
      setIsSubmitting(true);

      const productData = {
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        subcategory: data.subcategory || null,
        quantity: parseInt(data.quantity),
        images: imagesArray,
        // Additional fields with default values
        rating: "0.0",
        reviewCount: 0,
        featured: false,
      };

      const response = await apiRequest("POST", "/api/products", productData);
      
      if (!response.ok) {
        throw new Error("Failed to create product");
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: "Product has been created successfully",
      });

      // Invalidate products query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });

      // Redirect to the product detail page
      setLocation(`/products/${result.id}`);
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only designers can create products
  if (user?.userType !== "designer" && user?.userType !== "admin") {
    return (
      <ApplicationLayout>
        <div className="container mx-auto py-12 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                Only designers can create products for the marketplace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                If you're a designer, make sure you're logged in with your designer account.
              </p>
              <Link href="/home/products">
                <Button className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </ApplicationLayout>
    );
  }

  return (
    <ApplicationLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Link href="/home/products">
            <Button variant="ghost" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Create New Product</h1>
        </div>

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>
              Fill in the details below to list your product on the marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Modern Leather Sofa"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Price */}
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 599.99"
                            min="0"
                            step="0.01"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Category */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRODUCT_CATEGORIES.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Subcategory */}
                  <FormField
                    control={form.control}
                    name="subcategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategory</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Sectional Sofas"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional subcategory for better classification
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Quantity */}
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity Available</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Image URLs */}
                  <FormField
                    control={form.control}
                    name="imageUrls"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Image URLs</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter image URLs separated by commas"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter multiple image URLs separated by commas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your product in detail..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Product
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </ApplicationLayout>
  );
}