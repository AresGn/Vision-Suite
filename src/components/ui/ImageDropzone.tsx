
import React, { useState, useRef, useCallback } from 'react';
import { IconUpload } from './Icons';

interface ImageDropzoneProps {
  onImageDrop: (file: File | null) => void;
  imagePreviewUrl: string | null;
  id: string;
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({ onImageDrop, imagePreviewUrl, id }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onImageDrop(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [onImageDrop]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageDrop(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const baseClasses = "relative w-full h-64 rounded-lg border-2 border-dashed transition-all duration-300 ease-in-out cursor-pointer flex items-center justify-center overflow-hidden";
  const idleClasses = "border-slate-600 bg-slate-800/50 hover:border-sky-500 hover:bg-slate-800";
  const draggingClasses = "border-sky-400 bg-sky-900/50 scale-105 shadow-lg";

  return (
    <div
      className={`${baseClasses} ${isDragging ? draggingClasses : idleClasses}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        id={id}
        name={id}
        className="hidden"
        accept="image/png, image/jpeg, image/bmp"
        onChange={handleFileSelect}
      />
      {imagePreviewUrl ? (
        <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-contain" />
      ) : (
        <div className="text-center text-slate-500">
          <IconUpload className="mx-auto h-12 w-12" />
          <p className="mt-2 font-semibold">Click to upload or drag & drop</p>
          <p className="text-xs">PNG, JPG, BMP</p>
        </div>
      )}
    </div>
  );
};

export default ImageDropzone;