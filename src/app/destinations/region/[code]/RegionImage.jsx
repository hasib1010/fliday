'use client';
// src/app/destinations/region/[code]/RegionImage.jsx
import React from 'react';
import Image from 'next/image';

const RegionImage = ({ regionName, regionCode }) => {
  // Map of region codes to image data
  const regionImages = {
    'af-29': {
      src: '/images/regions/africa.jpg',
      alt: 'Map of Africa',
      fallbackSrc: `https://source.unsplash.com/800x600/?africa,map`,
    },
    'as-14': {
      src: '/images/regions/asia.jpg',
      alt: 'Map of Asia',
      fallbackSrc: `https://source.unsplash.com/800x600/?asia,map`,
    },
    'eu-30': {
      src: '/images/regions/europe.jpg',
      alt: 'Map of Europe',
      fallbackSrc: `https://source.unsplash.com/800x600/?europe,map`,
    },
    'am-15': {
      src: '/images/regions/americas.jpg',
      alt: 'Map of Americas',
      fallbackSrc: `https://source.unsplash.com/800x600/?americas,map`,
    },
    'me-7': {
      src: '/images/regions/middle-east.jpg',
      alt: 'Map of Middle East',
      fallbackSrc: `https://source.unsplash.com/800x600/?middle-east,map`,
    },
    'gl-196': {
      src: '/images/regions/global.jpg',
      alt: 'World Map',
      fallbackSrc: `https://source.unsplash.com/800x600/?world,map`,
    },
  };

  // Get image data for this region, or use a default
  const imageData = regionImages[regionCode.toLowerCase()] || {
    src: `/images/regions/default.jpg`,
    alt: `Map of ${regionName}`,
    fallbackSrc: `https://source.unsplash.com/800x600/?${encodeURIComponent(regionName)},map`,
  };

  return (
    <div className="w-full h-full relative">
      {/* Region image */}
      <Image
        src={imageData.src}
        alt={imageData.alt}
        fill
        className="object-cover"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = imageData.fallbackSrc;
        }}
        priority
      />
      
      {/* Overlay with region name */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-8">
        <div className="bg-white/90 p-5 rounded-lg w-fit max-w-full backdrop-blur-sm">
          <h2 className="text-2xl font-bold">{regionName} Regional eSIM</h2>
          <p className="text-gray-600 mt-2">
            Seamless connectivity across multiple countries
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegionImage;