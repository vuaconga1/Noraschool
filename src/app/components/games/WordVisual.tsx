"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  icon?: string;
  emoji?: string;
  alt: string;
  className?: string;
  imageClassName?: string;
};

export function WordVisual({
  icon,
  emoji,
  alt,
  className = "",
  imageClassName = "h-16 w-16 object-contain md:h-20 md:w-20",
}: Props) {
  const [broken, setBroken] = useState(false);

  if (icon && !broken) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Image
          src={icon}
          alt={alt}
          width={120}
          height={120}
          className={imageClassName}
          unoptimized
          onError={() => setBroken(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center text-3xl md:text-4xl ${className}`}
      aria-label={alt}
    >
      {emoji || "📝"}
    </div>
  );
}
