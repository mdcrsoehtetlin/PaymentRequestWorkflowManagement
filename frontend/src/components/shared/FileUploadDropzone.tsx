import React, { useCallback, useState } from 'react';
import { Upload, X } from 'lucide-react';
import type { ReceiptFile } from '../../types';
import { formatFileSize } from '../../utils/format';
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from '../../utils/constants';
import { useToast } from '../../hooks/useToast';

interface FileUploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  existingFiles?: ReceiptFile[];
  onFileRemove?: (fileId: number | string) => void;
  disabled?: boolean;
}

export function FileUploadDropzone({
  onFilesSelected,
  existingFiles = [],
  onFileRemove,
  disabled = false,
}: FileUploadDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const { error } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const validateAndProcessFiles = (files: FileList | File[]) => {
    const validFiles: File[] = [];
    Array.from(files).forEach((file) => {
      if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
        error(`${file.name}: File type not allowed`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        error(`${file.name}: File size exceeds the limit (10MB)`);
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      if (disabled) return;
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        validateAndProcessFiles(e.dataTransfer.files);
      }
    },
    [disabled, error, onFilesSelected]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFiles(e.target.files);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'}
          ${disabled ? 'opacity-50 cursor-not-allowed hover:bg-transparent hover:border-slate-300' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('file-upload')?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <p className="text-sm text-slate-600 font-medium">Click or drag & drop to upload files</p>
        <p className="text-xs text-slate-500 mt-2">PDF, PNG, JPEG (max 10MB)</p>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          multiple
          accept={ALLOWED_MIME_TYPES.join(',')}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>

      {existingFiles.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100 border border-slate-100 rounded-lg">
          {existingFiles.map((file) => (
            <li key={file.receiptFileId} className="flex items-center justify-between p-3">
              <div className="flex items-center truncate">
                <span className="text-sm font-medium text-slate-700 truncate mr-3">{file.originalFileName}</span>
                <span className="text-xs text-slate-500">{formatFileSize(file.fileSize)}</span>
              </div>
              {!disabled && onFileRemove && (
                <button
                  type="button"
                  onClick={() => onFileRemove(file.receiptFileId)}
                  className="text-slate-400 hover:text-red-500 p-1 transition-colors rounded"
                  title="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
