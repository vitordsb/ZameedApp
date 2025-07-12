import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/utils";
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal } from "lucide-react";

interface PostProps {
  id: number;
  author: {
    name: string;
    title: string;
    avatar: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timeAgo: string;
}

const DesignerPost = ({
  id,
  author,
  content,
  image,
  likes,
  comments,
  timeAgo,
}: PostProps) => {
  return (
    <Card className="mb-6 shadow-sm border border-gray-200">
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={author.avatar} alt={author.name} />
              <AvatarFallback>{getInitials(author.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-sm">{author.name}</div>
              <div className="text-gray-500 text-xs">{author.title}</div>
              <div className="text-gray-400 text-xs mt-1">{timeAgo}</div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-gray-500">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-sm text-gray-700 mb-4">{content}</p>
        {image && (
          <div className="rounded-md overflow-hidden">
            <img
              src={image}
              alt="Post content"
              className="w-full object-cover max-h-80"
            />
          </div>
        )}
      </CardContent>
      <div className="px-4 pb-1 flex justify-between text-xs text-gray-500">
        <div>{likes} likes</div>
        <div>{comments} comments</div>
      </div>
      <Separator />
      <CardFooter className="flex justify-between p-2 px-4">
        <Button variant="ghost" size="sm" className="text-gray-600 flex-1">
          <ThumbsUp className="h-4 w-4 mr-2" />
          Like
        </Button>
        <Button variant="ghost" size="sm" className="text-gray-600 flex-1">
          <MessageCircle className="h-4 w-4 mr-2" />
          Comment
        </Button>
        <Button variant="ghost" size="sm" className="text-gray-600 flex-1">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DesignerPost;