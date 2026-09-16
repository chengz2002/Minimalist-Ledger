import React from 'react';
import * as Icons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
  bgColor?: string;
  rounded?: boolean;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  className = '',
  size = 20,
  color,
  bgColor,
  rounded = true,
}) => {
  // Grab icon dynamically from Lucide
  const IconComponent = (Icons as unknown as Record<string, React.ElementType>)[name] || Icons.CircleDot;

  if (bgColor) {
    return (
      <div
        className={`flex items-center justify-center shrink-0 ${rounded ? 'rounded-full' : 'rounded-lg'} ${className}`}
        style={{
          backgroundColor: bgColor,
          width: size * 1.8,
          height: size * 1.8,
        }}
      >
        <IconComponent size={size} color={color || '#ffffff'} />
      </div>
    );
  }

  return <IconComponent size={size} color={color} className={className} />;
};
