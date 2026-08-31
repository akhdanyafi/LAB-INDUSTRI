'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface HeroPhoto {
    id: number;
    title: string;
    description: string | null;
    imageUrl: string;
    focalX: number;
    focalY: number;
    link: string | null;
}

export default function HeroCarousel({ photos }: { photos: HeroPhoto[] }) {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto-advance slides
    useEffect(() => {
        if (photos.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % photos.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [photos.length]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % photos.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + photos.length) % photos.length);
    };

    if (photos.length === 0) {
        return (
            <div className="w-full aspect-[16/9] sm:aspect-[21/9] relative bg-gray-900 flex flex-col items-center justify-center overflow-hidden rounded-2xl shadow-lg">
                {/* Gradient Overlay similar to actual slides */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />

                <div className="z-20 flex flex-col items-center text-center p-4 sm:p-8">
                    <div className="p-3 sm:p-4 bg-white/10 backdrop-blur-sm rounded-full mb-3 sm:mb-4 shadow-sm border border-white/20">
                        <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white/80" />
                    </div>
                    <h2 className="text-base sm:text-xl font-semibold text-white">Belum ada foto kegiatan</h2>
                    <p className="text-white/80 mt-2">Foto kegiatan akan muncul di sini</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full aspect-[16/9] sm:aspect-[21/9] relative bg-gray-900 flex items-center justify-center overflow-hidden rounded-2xl shadow-lg group">
            {photos.map((photo, index) => {
                const contentNode = (
                    <>
                        <Image
                            src={photo.imageUrl}
                            alt={photo.title}
                            fill
                            unoptimized
                            priority={index === 0}
                            className="object-cover z-0"
                            style={{ objectPosition: `${photo.focalX || 50}% ${photo.focalY || 50}%` }}
                            sizes="100vw"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-10 pointer-events-none" />

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 z-20 pointer-events-none">
                            <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 drop-shadow-md">{photo.title}</h2>
                            {photo.description && (
                                <p className="text-white/90 text-sm sm:text-base lg:text-lg max-w-2xl drop-shadow-sm line-clamp-2">{photo.description}</p>
                            )}
                        </div>
                    </>
                );

                return (
                    <div
                        key={photo.id}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                            }`}
                    >
                        {photo.link ? (
                            <a href={photo.link} target="_blank" rel="noopener noreferrer" className="relative block w-full h-full cursor-pointer">
                                {contentNode}
                            </a>
                        ) : (
                            <div className="w-full h-full relative">
                                {contentNode}
                            </div>
                        )}
                    </div>
                );
            })}

            {photos.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-full transition-all text-white z-30 opacity-0 group-hover:opacity-100"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-full transition-all text-white z-30 opacity-0 group-hover:opacity-100"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-4 right-8 z-30 flex gap-2">
                        {photos.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentSlide ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
                                    }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
