import React, { useState } from 'react';
import { API_ENDPOINTS } from '../config/api';

interface UploadedDocument {
  url: string;
  publicId: string;
  format: string;
  originalName: string;
  resourceType: string;
}

const DocumentUploadView: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert('Please select files to upload');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      
      if (files.length === 1) {
        // Single file upload
        formData.append('file', files[0]);
      } else {
        // Multiple files upload
        files.forEach(file => {
          formData.append('files', file);
        });
      }

      const endpoint = files.length === 1 ? API_ENDPOINTS.UPLOAD : API_ENDPOINTS.UPLOAD_MULTIPLE;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (files.length === 1) {
        // Single file result
        setUploadedDocs(prev => [...prev, {
          url: result.url,
          publicId: result.publicId,
          format: result.format,
          originalName: files[0].name,
          resourceType: result.resourceType
        }]);
      } else {
        // Multiple files result
        const newDocs = result.files.map((file: any, index: number) => ({
          url: file.url,
          publicId: file.publicId,
          format: file.format,
          originalName: file.originalName,
          resourceType: file.resourceType
        }));
        setUploadedDocs(prev => [...prev, ...newDocs]);
      }
      
      setFiles([]);
      alert(`Successfully uploaded ${files.length} document(s)!`);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload documents. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (publicId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.UPLOAD}/delete/${publicId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }
      
      setUploadedDocs(prev => prev.filter(doc => doc.publicId !== publicId));
      alert('Document deleted successfully!');
      
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Document Upload</h1>
            <p className="text-gray-600 mb-8">Upload supporting documents for your monitoring entries</p>
          </div>

          <div className="space-y-6">
            {/* File Selection */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 00-4.8 4.8 0 00-9.6 9.6-4.8 0-4.8 9.6-4.8 0z" />
                </svg>
                <p className="mt-4 text-sm text-gray-600">Click to select or drag and drop files</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {uploading ? 'Uploading...' : 'Choose Files'}
                </label>
              </div>
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload Documents'}
            </button>
          </div>

          {/* Uploaded Documents */}
          {uploadedDocs.length > 0 && (
            <div className="border-2 border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Uploaded Documents</h2>
              
              <div className="space-y-4">
                {uploadedDocs.map((doc, index) => (
                  <div key={doc.publicId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{doc.originalName}</p>
                      <p className="text-sm text-gray-600">
                        Type: {doc.resourceType} | Format: {doc.format}
                      </p>
                    </div>
                    <div className="text-right">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => handleDelete(doc.publicId)}
                        className="ml-4 text-red-600 hover:text-red-800 underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadView;
