import { Link } from "wouter";
import { Designer } from "@shared/schema";
import StarRating from "./StarRating";

interface DesignerCardProps {
  designer: Designer;
}

const DesignerCard = ({ designer }: DesignerCardProps) => {
  return (
    <div className="designer-card bg-white rounded-lg overflow-hidden shadow-md transition-all duration-300 hover:translate-y-[-5px] hover:shadow-lg">
      <div className="relative">
        <img 
          src={designer.portfolioImages[0]} 
          alt={`${designer.name} portfolio sample`} 
          className="w-full h-64 object-cover"
        />
        <div className="absolute top-4 right-4 bg-white text-primary px-3 py-1 rounded-full text-sm font-semibold">
          ${designer.hourlyRate}/hr
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center mb-4">
          <img 
            src={designer.profileImage} 
            alt={`${designer.name} profile`} 
            className="w-12 h-12 rounded-full mr-4"
          />
          <div>
            <h3 className="font-bold text-lg">{designer.name}</h3>
            <p className="text-gray-600 text-sm">{designer.style}</p>
          </div>
        </div>
        <p className="text-gray-600 mb-4">{designer.description}</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <StarRating rating={designer.rating} />
            <span className="ml-2 text-gray-600">{designer.rating.toFixed(1)}</span>
          </div>
          <Link href={`/designer/${designer.id}`}>
            <span className="text-primary font-semibold hover:underline cursor-pointer">View Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DesignerCard;
