import React, { useCallback, useState } from 'react';
import { UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import { uploadReceipt } from '../services/api';

interface ReceiptUploadProps {
  paymentRequestId: string;
  onUploadSuccess: () => void;
}

const ReceiptUpload: React.FC<ReceiptUploadProps> = ({ paymentRequestId, onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    // Validate client-side
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }
    
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only PDF, JPEG, and PNG are allowed.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      await uploadReceipt(paymentRequestId, file);
      onUploadSuccess();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Failed to upload receipt');
    } finally {
      setIsUploading(false);
    }
  }, [paymentRequestId, onUploadSuccess]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleChange}
          accept=".pdf,.jpg,.jpeg,.png"
          disabled={isUploading}
        />
        
        <div className="flex flex-col items-center justify-center space-y-3">
          {isUploading ? (
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          ) : (
            <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
          )}
          
          <div>
            <p className="text-sm font-medium text-slate-700">
              {isUploading ? 'Uploading...' : 'Click or drag file to this area to upload'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Strictly PDF, JPG or PNG. Max 10MB.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default ReceiptUpload;
