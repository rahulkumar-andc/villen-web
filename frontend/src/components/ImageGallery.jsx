import React, { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { Zoom, ChevronLeft, ChevronRight, X, Download } from 'lucide-react';
import './ImageGallery.css';

const ImageGallery = ({ images = [], captions = {} }) => {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  // If no images provided, return null
  if (!images || images.length === 0) return null;

  const slides = images.map((src, i) => ({
    src,
    title: captions[`img${i}`] || `Image ${i + 1}`,
  }));

  return (
    <div className="image-gallery">
      <div className="gallery-grid">
        {images.map((src, i) => (
          <div 
            key={i} 
            className="gallery-item"
            onClick={() => {
              setIndex(i);
              setOpen(true);
            }}
          >
            <img src={src} alt={captions[`img${i}`] || `Gallery image ${i + 1}`} />
            <div className="gallery-overlay">
              <Zoom size={24} />
            </div>
            {captions[`img${i}`] && (
              <div className="gallery-caption">{captions[`img${i}`]}</div>
            )}
          </div>
        ))}
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={slides}
        onIndexChange={setIndex}
        render={{
          iconPrev: () => <ChevronLeft size={48} />,
          iconNext: () => <ChevronRight size={48} />,
          iconClose: () => <X size={32} />,
        }}
        toolbar={{
          buttons: [
            {
              src: <Download size={24} />,
              onClick: () => {
                const link = document.createElement('a');
                link.href = slides[index].src;
                link.download = slides[index].title;
                link.click();
              },
            },
          ],
        }}
      />
    </div>
  );
};

export default ImageGallery;

