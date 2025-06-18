import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ImagePreview = ({ images, currentIndex, onClose, onPrevious, onNext }) => {
  if (!images || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300"
      >
        <XMarkIcon className="h-8 w-8" />
      </button>

      <button
        onClick={onPrevious}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
      >
        <ChevronRightIcon className="h-12 w-12" />
      </button>

      <div className="relative max-w-4xl max-h-[80vh] mx-4">
        <img
          src={typeof images[currentIndex] === 'string' 
            ? images[currentIndex] 
            : `http://localhost:8000/storage/${images[currentIndex].image_path}`}
          alt={`تصویر ${currentIndex + 1}`}
          className="max-w-full max-h-[80vh] object-contain"
        />
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
          {currentIndex + 1} از {images.length}
        </div>
      </div>

      <button
        onClick={onNext}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
      >
        <ChevronLeftIcon className="h-12 w-12" />
      </button>
    </div>
  );
};

export default ImagePreview; 