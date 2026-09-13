import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UploadCloud, 
  X, 
  Check, 
  AlertCircle, 
  Loader2, 
  Image as ImageIcon, 
  RefreshCw, 
  Eye, 
  ExternalLink,
  Sparkles,
  FileCheck2
} from 'lucide-react';
import { 
  uploadImageToStorage, 
  validateImageFile, 
  fileToDataUrl, 
  getImageDimensions,
  UploadResult 
} from '../../utils/imageUpload';

export interface ImageUploaderProps {
  id?: string;
  label?: string;
  helperText?: string;
  value?: string;
  onChange?: (url: string, result?: UploadResult) => void;
  onRemove?: () => void;
  folderPath?: string;
  aspectRatio?: 'square' | 'video' | 'banner' | 'auto';
  maxSizeMB?: number;
  compress?: boolean;
  maxWidth?: number;
  quality?: number;
  disabled?: boolean;
  className?: string;
  previewHeight?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  id = 'image-uploader',
  label,
  helperText,
  value,
  onChange,
  onRemove,
  folderPath = 'uploads',
  aspectRatio = 'auto',
  maxSizeMB = 10,
  compress = true,
  maxWidth = 1600,
  quality = 0.82,
  disabled = false,
  className = '',
  previewHeight = 'h-48'
}) => {
  const [currentUrl, setCurrentUrl] = useState<string>(value || '');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    sizeFormatted: string;
    dimensions?: string;
  } | null>(null);
  const [showFullPreview, setShowFullPreview] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal preview when external `value` prop changes
  useEffect(() => {
    setCurrentUrl(value || '');
  }, [value]);

  // Format file size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const processFile = async (file: File) => {
    if (disabled) return;
    setErrorMsg(null);

    // 1. Validate
    const validation = validateImageFile(file, maxSizeMB);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Invalid image file.');
      return;
    }

    // 2. Read dimensions & set quick local preview
    try {
      const dimensions = await getImageDimensions(file).catch(() => undefined);
      setFileDetails({
        name: file.name,
        sizeFormatted: formatBytes(file.size),
        dimensions: dimensions ? `${dimensions.width}×${dimensions.height}px` : undefined
      });
    } catch {
      setFileDetails({
        name: file.name,
        sizeFormatted: formatBytes(file.size)
      });
    }

    // Generate quick local preview while uploading
    const localDataUrl = await fileToDataUrl(file).catch(() => '');
    if (localDataUrl) {
      setCurrentUrl(localDataUrl);
    }

    // 3. Perform upload
    setIsUploading(true);
    setProgress(0);

    try {
      const result = await uploadImageToStorage(file, {
        folder: folderPath,
        onProgress: (pct) => setProgress(pct),
        compress,
        maxWidth,
        quality,
        maxSizeMB,
        fallbackToBase64: true
      });

      setCurrentUrl(result.url);
      if (onChange) {
        onChange(result.url, result);
      }
    } catch (err: any) {
      console.error('[ImageUploader] Upload failed:', err);
      setErrorMsg(err.message || 'Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;
    const droppedFiles = e.dataTransfer?.files;
    if (droppedFiles && droppedFiles.length > 0) {
      processFile(droppedFiles[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    // Reset file input value so the same file can be re-selected if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isUploading) return;
    setCurrentUrl('');
    setFileDetails(null);
    setErrorMsg(null);
    if (onChange) {
      onChange('');
    }
    if (onRemove) {
      onRemove();
    }
  };

  // Determine aspect ratio class
  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'video':
        return 'aspect-video';
      case 'banner':
        return 'aspect-[3/1]';
      case 'auto':
      default:
        return previewHeight;
    }
  };

  return (
    <div id={`${id}-wrapper`} className={`w-full ${className}`}>
      {/* Label and Helper Text */}
      {(label || helperText) && (
        <div className="mb-2 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
          {label && (
            <label 
              id={`${id}-label`}
              htmlFor={`${id}-input`}
              className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300"
            >
              {label}
            </label>
          )}
          {helperText && (
            <span id={`${id}-helper`} className="text-[11px] text-gray-500 dark:text-zinc-400">
              {helperText}
            </span>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        id={`${id}-input`}
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={handleFileSelect}
      />

      {/* Upload Zone / Preview Container */}
      <div
        id={`${id}-dropzone`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label || 'Image upload drop zone'}
        onClick={() => {
          if (!disabled && !isUploading && !currentUrl) {
            fileInputRef.current?.click();
          }
        }}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isUploading && !currentUrl) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-200 outline-none select-none ${getAspectClass()} ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800'
            : isDragging
            ? 'border-primary bg-primary/5 scale-[0.99] shadow-inner'
            : currentUrl
            ? 'border-gray-200 dark:border-zinc-800 bg-black/5 dark:bg-black/20 group cursor-default'
            : 'border-dashed border-gray-300 dark:border-zinc-700 hover:border-primary dark:hover:border-primary bg-gray-50 dark:bg-zinc-900/60 hover:bg-gray-100/70 dark:hover:bg-zinc-900 cursor-pointer'
        }`}
      >
        {/* State 1: Image Preview Loaded */}
        {currentUrl ? (
          <div className="relative w-full h-full">
            <img
              id={`${id}-preview-img`}
              src={currentUrl}
              alt="Uploaded Preview"
              className="w-full h-full object-cover object-center"
              onError={() => setErrorMsg('Failed to render preview image URL')}
            />

            {/* Hover Action Overlay */}
            {!isUploading && !disabled && (
              <div 
                id={`${id}-hover-actions`}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3"
              >
                <div className="flex justify-between items-center">
                  <span className="px-2 py-1 rounded-md bg-black/60 text-[10px] font-bold text-white tracking-wider uppercase backdrop-blur-sm">
                    {fileDetails?.dimensions || 'Ready'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`${id}-btn-preview`}
                      type="button"
                      title="View full image"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFullPreview(true);
                      }}
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-black text-white transition-colors backdrop-blur-sm cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      id={`${id}-btn-remove`}
                      type="button"
                      title="Remove image"
                      onClick={handleRemove}
                      className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors backdrop-blur-sm cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    id={`${id}-btn-change`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-gray-900 font-bold text-xs tracking-wider uppercase transition-transform active:scale-95 shadow-md cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-primary" />
                    Replace
                  </button>
                </div>

                <div className="truncate text-center text-[11px] text-white/80 font-medium px-2 py-0.5 bg-black/40 rounded-md backdrop-blur-sm">
                  {fileDetails?.name || 'Uploaded Asset'}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* State 2: Empty / Drop Prompt */
          <div className="flex flex-col items-center justify-center p-6 text-center h-full">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 mb-1">
              <span className="text-primary font-bold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-xs">
              PNG, JPG, WebP, GIF or SVG (max {maxSizeMB}MB)
            </p>
            {compress && (
              <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" /> Auto WebP compression enabled
              </span>
            )}
          </div>
        )}

        {/* State 3: Upload In-Progress Overlay */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              id={`${id}-uploading-overlay`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 z-10"
            >
              <div className="relative mb-3">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white">
                  {progress}%
                </span>
              </div>

              <p className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                Uploading Asset...
              </p>

              {/* Progress Bar */}
              <div className="w-48 bg-zinc-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {fileDetails && (
                <span className="mt-2 text-[11px] text-zinc-300 truncate max-w-[200px]">
                  {fileDetails.name} ({fileDetails.sizeFormatted})
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div id={`${id}-error`} className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Optional Metadata Bar when an image is selected */}
      {currentUrl && !isUploading && (
        <div id={`${id}-meta-footer`} className="mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400 px-1">
          <div className="flex items-center gap-1 truncate">
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">{fileDetails?.name || 'Image uploaded successfully'}</span>
          </div>
          {fileDetails?.sizeFormatted && (
            <span className="shrink-0 font-mono text-[10px] bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
              {fileDetails.sizeFormatted}
            </span>
          )}
        </div>
      )}

      {/* Full-Screen Modal Preview */}
      {showFullPreview && currentUrl && (
        <div 
          id={`${id}-modal-preview`}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowFullPreview(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              id={`${id}-modal-close`}
              type="button"
              onClick={() => setShowFullPreview(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white flex items-center gap-1 text-xs uppercase tracking-wider font-bold cursor-pointer"
            >
              <X className="w-5 h-5" /> Close
            </button>
            <img
              src={currentUrl}
              alt="Full preview"
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
            {currentUrl.startsWith('http') && (
              <a
                id={`${id}-open-new-tab`}
                href={currentUrl}
                target="_blank"
                rel="noreferrer noopener"
                onClick={(e) => e.stopPropagation()}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white underline cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open original image in new tab
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
