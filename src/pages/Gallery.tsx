import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X, Search, Filter, Heart, MessageSquare, Share2, ImageOff, Send, LogIn } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Designer, Post, Comment } from "@shared/schema";
import { getInitials, formatRelativeTime } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

// Extended post interface for UI
interface GalleryPost {
  id: number;
  title: string | null;
  content: string;
  image: string | null;
  designerId: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  
  // Extended UI properties
  designer?: Designer;
  likeCount: number;
  commentCount: number;
  comments: (Comment & { user?: { id: number; name: string; profileImage: string | null } })[];
  tags: string[];
  
  // For display and backward compatibility
  imageUrl: string; // Converted from image
  description: string; // Converted from content
  likes?: number; // For UI display
}

const Gallery = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<GalleryPost | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { isLoggedIn, user } = useAuth();
  const [, navigate] = useLocation();

  // Fetch designers data
  const { data: designers, isLoading: designersLoading } = useQuery<Designer[]>({
    queryKey: ["/api/designers"],
  });

  // Fetch posts data
  const { data: postsData, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  // Process posts to include designer information
  const galleryPosts: GalleryPost[] = (postsData || []).map(post => {
    // Find the designer for this post
    const designer = designers?.find(d => d.id === post.designerId);
    
    // Extract style and services for tags
    const style = designer?.style || '';
    const services = designer?.services || [];
    const tags = [style, ...services.slice(0, 2)].filter(Boolean);
    
    return {
      ...post,
      designer,
      imageUrl: post.image || '', // Ensure imageUrl is never null (convert to empty string)
      description: post.content, // Map content to description for display
      likes: 0, // For UI compatibility
      likeCount: 0, // We'll fetch actual likes count when a post is selected
      commentCount: 0, // We'll fetch actual comments count when a post is selected
      comments: [], // We'll fetch actual comments when a post is selected
      tags
    };
  });
  
  // Flag for overall loading state
  const isLoading = designersLoading || postsLoading;
  
  // Filter posts based on search query and selected tag
  const filteredPosts = galleryPosts.filter(post => {
    const matchesSearch = searchQuery === "" || 
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.designer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTag = selectedTag === null || post.tags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });

  // Get all unique tags from posts
  const allTags = Array.from(new Set(galleryPosts.flatMap(post => post.tags))).sort();

  // State for tracking if current user has liked the post
  const [isLiked, setIsLiked] = useState(false);

  // Fetch comments for a post
  const { data: selectedPostComments } = useQuery<Comment[]>({
    queryKey: ['/api/posts', selectedPost?.id, 'comments'],
    enabled: !!selectedPost,
  });

  // Fetch likes for a post
  const { data: selectedPostLikes } = useQuery<any[]>({
    queryKey: ['/api/posts', selectedPost?.id, 'likes'],
    enabled: !!selectedPost,
  });

  // Mutations for likes and comments
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPost) return null;
      
      if (isLiked) {
        // Unlike post
        return apiRequest('DELETE', `/api/posts/${selectedPost.id}/like`);
      } else {
        // Like post
        return apiRequest('POST', `/api/posts/${selectedPost.id}/like`);
      }
    },
    onSuccess: () => {
      // Toggle like state
      setIsLiked(!isLiked);
      
      // Invalidate likes query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/posts', selectedPost?.id, 'likes'] });
    }
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedPost || !content.trim()) return null;
      
      return apiRequest('POST', `/api/posts/${selectedPost.id}/comments`, { content });
    },
    onSuccess: () => {
      // Clear comment input
      setNewComment('');
      
      // Invalidate comments query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/posts', selectedPost?.id, 'comments'] });
    }
  });

  // Update the selected post with comments and likes when they change
  useEffect(() => {
    if (selectedPost && selectedPostComments && selectedPostLikes) {
      setSelectedPost({
        ...selectedPost,
        comments: selectedPostComments,
        likeCount: selectedPostLikes.length,
        commentCount: selectedPostComments.length
      });
      
      // Check if the current user has liked the post
      // This would normally use the current user ID, but for now we'll just 
      // check if there are any likes at all as a simplified demonstration
      setIsLiked(selectedPostLikes.length > 0);
    }
  }, [selectedPostComments, selectedPostLikes]);

  // Handle post click to open modal
  const handlePostClick = (post: GalleryPost) => {
    setSelectedPost(post);
    setNewComment('');
    setIsLiked(false);
  };
  
  // Handle submitting a new comment
  const handleCommentSubmit = () => {
    if (!isLoggedIn) {
      setShowAuthDialog(true);
      return;
    }
    
    if (newComment.trim()) {
      commentMutation.mutate(newComment);
    }
  };
  
  // Handle liking/unliking a post
  const handleLikeToggle = () => {
    if (!isLoggedIn) {
      setShowAuthDialog(true);
    } else {
      likeMutation.mutate();
    }
  };

  // Handle authentication prompt
  const handleAuthPrompt = () => {
    setShowAuthDialog(false);
    navigate('/auth');
  };

  // Handle tag selection
  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
  };

  // Format date for display
  const formatDate = (date: Date | null | string) => {
    if (!date) return '';
    
    try {
      // Convert string to Date if needed
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      // Check if date is valid
      if (isNaN(dateObj.getTime())) return '';
      
      return new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }).format(dateObj);
    } catch (e) {
      console.error('Date formatting error:', e);
      return '';
    }
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-12">
      {/* Gallery Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Design Gallery</h1>
        <p className="text-gray-600 mb-6">
          Explore beautiful interior design projects from our community of talented designers.
        </p>
        
        {/* Search and Filters */}
        <div className="flex mb-6">
          <div className="relative flex-grow mr-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search designs, styles, or designers..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex-shrink-0">
            <Button variant="outline" className="h-10 px-4">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
        
        {/* Design Style Tags */}
        <div className="overflow-x-auto pb-2">
          <div className="flex space-x-2 mb-6 min-w-max">
            <Button
              variant="outline"
              size="sm"
              className={`rounded-lg px-4 py-1 text-sm ${!selectedTag ? 'bg-gray-100' : ''}`}
              onClick={() => setSelectedTag("Bathroom Design")}
            >
              Bathroom Design
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`rounded-lg px-4 py-1 text-sm ${selectedTag === "Color Consultation" ? 'bg-gray-100' : ''}`}
              onClick={() => handleTagClick("Color Consultation")}
            >
              Color Consultation
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`rounded-lg px-4 py-1 text-sm ${selectedTag === "Commercial Design" ? 'bg-gray-100' : ''}`}
              onClick={() => handleTagClick("Commercial Design")}
            >
              Commercial Design
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`rounded-lg px-4 py-1 text-sm ${selectedTag === "Contemporary Luxury" ? 'bg-gray-100' : ''}`}
              onClick={() => handleTagClick("Contemporary Luxury")}
            >
              Contemporary Luxury
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`rounded-lg px-4 py-1 text-sm ${selectedTag === "Custom Furniture" ? 'bg-gray-100' : ''}`}
              onClick={() => handleTagClick("Custom Furniture")}
            >
              Custom Furniture
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`rounded-lg px-4 py-1 text-sm ${selectedTag === "Eclectic & Bohemian" ? 'bg-gray-100' : ''}`}
              onClick={() => handleTagClick("Eclectic & Bohemian")}
            >
              Eclectic & Bohemian
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`rounded-lg px-4 py-1 text-sm ${selectedTag === "Interior Design" ? 'bg-gray-100' : ''}`}
              onClick={() => handleTagClick("Interior Design")}
            >
              Interior Design
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`rounded-lg px-4 py-1 text-sm ${selectedTag === "Kitchen Design" ? 'bg-gray-100' : ''}`}
              onClick={() => handleTagClick("Kitchen Design")}
            >
              Kitchen Design
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto pb-2">
          <div className="flex space-x-2 mb-6 min-w-max">
            <Button
              variant="outline"
              size="sm"
              className={`rounded-lg px-4 py-1 text-sm ${selectedTag === "Lighting Design" ? 'bg-gray-100' : ''}`}
              onClick={() => handleTagClick("Lighting Design")}
            >
              Lighting Design
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`rounded-lg px-4 py-1 text-sm ${selectedTag === "Mid-Century Modern" ? 'bg-gray-100' : ''}`}
              onClick={() => handleTagClick("Mid-Century Modern")}
            >
              Mid-Century Modern
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`rounded-lg px-4 py-1 text-sm ${selectedTag === "Modern Minimalist" ? 'bg-gray-100' : ''}`}
              onClick={() => handleTagClick("Modern Minimalist")}
            >
              Modern Minimalist
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`rounded-lg px-4 py-1 text-sm ${selectedTag === "Scandinavian Inspired" ? 'bg-gray-100' : ''}`}
              onClick={() => handleTagClick("Scandinavian Inspired")}
            >
              Scandinavian Inspired
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`rounded-lg px-4 py-1 text-sm ${selectedTag === "Space Planning" ? 'bg-gray-100' : ''}`}
              onClick={() => handleTagClick("Space Planning")}
            >
              Space Planning
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`rounded-lg px-4 py-1 text-sm ${selectedTag === "Urban Industrial" ? 'bg-gray-100' : ''}`}
              onClick={() => handleTagClick("Urban Industrial")}
            >
              Urban Industrial
            </Button>
          </div>
        </div>
      </div>
      
      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
          {Array(12).fill(0).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg aspect-[3/4]"></div>
          ))}
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredPosts.slice(0, 8).map(post => (
            <div 
              key={post.id} 
              className="overflow-hidden rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-shadow duration-200"
              onClick={() => handlePostClick(post)}
            >
              {post.imageUrl ? (
                <img 
                  src={post.imageUrl} 
                  alt={post.title || 'Design project'}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                  <ImageOff className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No results found</h3>
          <p className="text-gray-600">Try adjusting your search or filters to find what you're looking for.</p>
        </div>
      )}
      
      {/* Post Modal */}
      <Dialog open={selectedPost !== null} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="sm:max-w-5xl p-0 overflow-hidden max-h-[90vh]">
          <div className="flex flex-col md:flex-row h-full">
            {/* Image Side */}
            <div className="relative w-full md:w-2/3 bg-black flex items-center justify-center">
              {selectedPost && (
                selectedPost.imageUrl ? (
                  <img 
                    src={selectedPost.imageUrl} 
                    alt={selectedPost.title || 'Design project'}
                    className="max-h-[80vh] max-w-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full min-h-[300px] flex items-center justify-center">
                    <ImageOff className="h-24 w-24 text-gray-500" />
                  </div>
                )
              )}
              <Button 
                size="icon" 
                variant="ghost" 
                className="absolute top-3 right-3 text-white bg-black/30 hover:bg-black/50"
                onClick={() => setSelectedPost(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Details Side */}
            {selectedPost && (
              <div className="w-full md:w-1/3 p-6 max-h-[80vh] overflow-y-auto">
                {/* Designer Info */}
                <div className="flex items-center mb-4">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage 
                      src={selectedPost.designer?.profileImage} 
                      alt={selectedPost.designer?.name || 'Designer'} 
                    />
                    <AvatarFallback>
                      {selectedPost.designer?.name ? getInitials(selectedPost.designer.name) : 'D'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedPost.designer?.name || 'Designer'}</h3>
                    <p className="text-xs text-gray-500">{formatDate(selectedPost.createdAt)}</p>
                  </div>
                </div>
                
                {/* Post Content */}
                <h2 className="text-xl font-bold mb-2">{selectedPost.title}</h2>
                <p className="text-gray-600 mb-4">{selectedPost.description}</p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedPost.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <Separator className="my-4" />
                
                {/* Engagement Buttons */}
                <div className="flex items-center space-x-4 mb-4">
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2 hover:bg-gray-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLikeToggle();
                    }}
                    disabled={likeMutation.isPending}
                  >
                    <Heart 
                      className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} 
                    />
                    <span className="text-sm">{selectedPost.likeCount} likes</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2 hover:bg-gray-100"
                  >
                    <MessageSquare className="h-5 w-5 text-gray-500" />
                    <span className="text-sm">{selectedPost.commentCount} comments</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2 hover:bg-gray-100 ml-auto"
                  >
                    <Share2 className="h-5 w-5 text-gray-500" />
                    <span className="text-sm">Share</span>
                  </Button>
                </div>
                
                <Separator className="my-4" />
                
                {/* Comments Section */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Comments</h4>
                  {selectedPost.comments.length > 0 ? (
                    <div className="space-y-3">
                      {selectedPost.comments.map(comment => (
                        <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center mb-1">
                            <span className="font-medium text-sm">{comment.user?.name || 'User'}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No comments yet. Be the first to comment!</p>
                  )}
                </div>
                
                {/* Add Comment Form */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Add a comment..."
                      className="min-h-[60px] flex-grow"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button 
                      size="icon"
                      onClick={handleCommentSubmit}
                      disabled={!newComment.trim() || commentMutation.isPending}
                      className="self-end"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogTitle>Authentication Required</DialogTitle>
          <DialogDescription>
            You need to be logged in to perform this action. Would you like to log in now?
          </DialogDescription>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowAuthDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAuthPrompt}>
              <LogIn className="h-4 w-4 mr-2" />
              Go to Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Gallery;
