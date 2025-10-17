// src/components/common/FileUpload.jsx
import { forwardRef, useState, useRef } from 'react';
import clsx from 'clsx';
import { Upload, X, File, Image as ImageIcon } from 'lucide-react';

/**
 * FileUpload Component
 * 
 * A reusable, isolated file upload component with drag-and-drop support,
 * file previews, and optional multiple file selection.
 * Uses Tailwind CSS and custom theme variables from index.css
 * 
 * @example
 * <FileUpload onChange={(files) => console.log(files)} />
 * <FileUpload label="Upload Images" multiple accept="image/*" />
 */

const FileUpload = forwardRef(
  (
    {
      label = 'Upload File',
      description,
      multiple = false,
      accept,
      value = [],
      onChange,
      onRemove,
      maxFiles = 5,
      maxSizeMB = 10,
      preview = true,
      disabled = false,
      fullWidth = true,
      variant = 'default',
      className = '',
      inputClassName = '',
      ...props
    },
    ref
  ) => {
    const [dragOver, setDragOver] = useState(false);
    const [internalFiles, setInternalFiles] = useState(value);
    const inputRef = useRef(null);

    const handleFiles = (files) => {
      const validFiles = Array.from(files).filter((file) => {
        if (file.size / 1024 / 1024 > maxSizeMB) {
          console.warn(`File ${file.name} exceeds ${maxSizeMB}MB limit`);
          return false;
        }
        return true;
      });

      const updatedFiles = multiple
        ? [...internalFiles, ...validFiles].slice(0, maxFiles)
        : validFiles.slice(0, 1);

      setInternalFiles(updatedFiles);
      if (onChange) onChange(updatedFiles);
    };

    const handleRemove = (fileIndex) => {
      const updatedFiles = internalFiles.filter((_, i) => i !== fileIndex);
      setInternalFiles(updatedFiles);
      if (onRemove) onRemove(fileIndex);
      if (onChange) onChange(updatedFiles);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (disabled) return;
      const { files } = e.dataTransfer;
      if (files.length) handleFiles(files);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      if (!disabled) setDragOver(true);
    };

    const handleDragLeave = () => {
      setDragOver(false);
    };

    const handleClick = () => {
      if (!disabled) inputRef.current?.click();
    };

    const variantStyles = {
      default: 'border-2 border-dashed border-gray-300 hover:border-primary-500',
      solid: 'border border-gray-300 bg-gray-50 hover:bg-gray-100',
      outline: 'border border-gray-400 hover:border-primary-500',
    };

    const baseStyles = clsx(
      'flex flex-col items-center justify-center p-6 text-center rounded-lg transition-all duration-200 cursor-pointer',
      variantStyles[variant],
      {
        'w-full': fullWidth,
        'bg-primary-50 border-primary-400': dragOver,
        'opacity-50 cursor-not-allowed': disabled,
      },
      className
    );

    const renderFilePreview = (file, index) => {
      const isImage = file.type.startsWith('image/');
      return (
        <div
          key={index}
          className="flex items-center gap-3 bg-gray-50 p-2 rounded-md border border-gray-200"
        >
          {isImage ? (
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="w-10 h-10 object-cover rounded-md"
            />
          ) : (
            <File className="w-8 h-8 text-gray-500" />
          )}

          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-gray-800">{file.name}</p>
            <p className="text-xs text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleRemove(index)}
            className="text-gray-400 hover:text-danger-600 p-1 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    };

    return (
      <div className={clsx('space-y-2', { 'w-full': fullWidth })}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-gray-700">{label}</label>
        )}

        {/* Upload Area */}
        <div
          ref={ref}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={baseStyles}
          {...props}
        >
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">
            Drag and drop your file(s) here, or <span className="text-primary-600 font-medium">browse</span>
          </p>

          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}

          <input
            ref={inputRef}
            type="file"
            multiple={multiple}
            accept={accept}
            onChange={(e) => handleFiles(e.target.files)}
            disabled={disabled}
            className={clsx('hidden', inputClassName)}
          />
        </div>

        {/* File Previews */}
        {preview && internalFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {internalFiles.map((file, index) => renderFilePreview(file, index))}
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';

export default FileUpload;

/**
 * Example Usage:
 * 
 * import FileUpload from '@/components/common/FileUpload';
 * import { useState } from 'react';
 * 
 * // Basic single file upload
 * const [file, setFile] = useState(null);
 * 
 * <FileUpload
 *   label="Upload Product Image"
 *   accept="image/*"
 *   onChange={(files) => setFile(files[0])}
/>
 * 
 * // Multiple files
 * const [images, setImages] = useState([]);
 * 
 * <FileUpload
 *   label="Upload Gallery Images"
 *   multiple
 *   accept="image/*"
 *   maxFiles={5}
 *   onChange={(files) => setImages(files)}
 * />
 * 
 * // With custom description and style
 * <FileUpload
 *   label="Attach Documents"
 *   description="Supported formats: PDF, DOCX, XLSX (max 10MB)"
 *   accept=".pdf,.docx,.xlsx"
 *   variant="outline"
/>
 * 
 * // Disabled state
 * <FileUpload
 *   label="Profile Picture"
 *   disabled
 * />
 * 
 * // POS specific: Import products CSV
 * <FileUpload
 *   label="Import Products"
 *   description="Upload a CSV file to bulk import product data"
 *   accept=".csv"
 *   onChange={(files) => handleImport(files[0])}
/>
 */
