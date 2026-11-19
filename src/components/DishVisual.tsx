import React, { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';

interface DishVisualProps {
  src: string;
  alt: string;
  className?: string;
}

export const DishVisual: React.FC<DishVisualProps> = ({ src, alt, className = '' }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F7E8D4] to-[#EED7B8] text-[#641E24] p-4 ${className}`}
        role="img"
        aria-label={alt}
      >
        <UtensilsCrossed className="w-8 h-8 opacity-65 mb-2" />
        <span className="text-xs font-medium text-center line-clamp-2 opacity-80">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
