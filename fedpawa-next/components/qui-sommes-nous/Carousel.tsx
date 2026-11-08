"use client";
import { useState, useEffect } from 'react';

const GALLERY_IMGS = [
  'qui_1', 'qui_2', 'qui_3', 'qui_4', 'qui_5', 
  'qui_6', 'qui_7', 'qui_8', 'qui_9', 'qui_10', 'qui_11', 'qui_12'
];

export default function QSNCarousel() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const slidesPerView = isMobile ? 1 : 3;
  const maxIndex = GALLERY_IMGS.length - (isMobile ? 1 : 3);

  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, 3000);
    return () => clearInterval(id);
  }, [maxIndex]);

  const numDots = GALLERY_IMGS.length - (isMobile ? 0 : 2);

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden', padding: '20px 0' }}>
      <div style={{ 
        display: 'flex', 
        transition: 'transform 0.5s ease-in-out',
        transform: `translateX(-${(slideIndex * 100) / slidesPerView}%)`
      }}>
        {GALLERY_IMGS.map((img, idx) => (
          <div key={idx} style={{ minWidth: `${100 / slidesPerView}%`, padding: '0 5px' }}>
            <img 
              src={`/assets/images/qui-about-carousel/${img}.jpg`} 
              alt="" 
              style={{ width: '100%', height: '300px', objectFit: 'cover' }} 
            />
          </div>
        ))}
      </div>
      
      {/* Navigation Chevrons */}
      <button style={{ position: 'absolute', top: '50%', left: '0', zIndex: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', padding: '10px', cursor: 'pointer' }} onClick={() => setSlideIndex(i => i === 0 ? maxIndex : i - 1)}>←</button>
      <button style={{ position: 'absolute', top: '50%', right: '0', zIndex: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', padding: '10px', cursor: 'pointer' }} onClick={() => setSlideIndex(i => i >= maxIndex ? 0 : i + 1)}>→</button>

      {/* Dots navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
          <button 
            key={i} 
            onClick={() => setSlideIndex(i)}
            style={{ 
              width: '10px', height: '10px', borderRadius: '50%', margin: '0 5px', 
              background: slideIndex === i ? 'gold' : '#ccc', border: 'none', padding: '0', cursor: 'pointer'
            }}
          />
        ))}
      </div>
    </div>
  );
}