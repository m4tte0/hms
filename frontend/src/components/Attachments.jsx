import React, { useState, useEffect } from 'react';
import { Upload, File, FileText, Image, Download, Trash2, X, Paperclip, AlertCircle } from 'lucide-react';

const Attachments = ({ projectId }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (projectId) {
      loadAttachments();
    }
  }, [projectId]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/attachments/${projectId}`);

      if (response.ok) {
        const data = await response.json();
        setAttachments(data);
      }
    } catch (error) {
      console.error('Error loading attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);

        const response = await fetch(`${API_BASE_URL}/attachments/${projectId}`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      await loadAttachments();
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (attachment) => {
    setAttachmentToDelete(attachment);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!attachmentToDelete) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/attachments/${projectId}/${attachmentToDelete.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        await loadAttachments();
        setShowDeleteModal(false);
        setAttachmentToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Error deleting file. Please try again.');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setAttachmentToDelete(null);
  };

  const handleDownload = async (attachment) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/attachments/${projectId}/${attachment.id}/download`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.original_name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file. Please try again.');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(Array.from(e.dataTransfer.files));
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) {
      return <Image className="w-8 h-8 text-blue-500" />;
    } else if (['pdf'].includes(extension)) {
      return <FileText className="w-8 h-8 text-red-500" />;
    } else if (['doc', 'docx', 'txt'].includes(extension)) {
      return <FileText className="w-8 h-8 text-blue-700" />;
    } else if (['xls', 'xlsx', 'csv'].includes(extension)) {
      return <FileText className="w-8 h-8 text-green-600" />;
    } else {
      return <File className="w-8 h-8 text-secondary-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-secondary-900">Delete Attachment?</h3>
                <p className="text-sm text-secondary-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded p-4 mb-4">
              <p className="text-sm text-secondary-700 mb-2">You are about to delete:</p>
              <p className="font-semibold text-secondary-900">{attachmentToDelete?.original_name}</p>
              <p className="text-sm text-secondary-600 mt-1">
                {attachmentToDelete?.file_size && formatFileSize(attachmentToDelete.file_size)}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-secondary-700 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-secondary-900">Attachments</h1>
            <p className="text-sm text-secondary-600 mt-1">
              Upload and manage project documents and files
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-secondary-600">
              {attachments.length} file{attachments.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`bg-white rounded shadow-sm border-2 border-dashed p-8 transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-blue-600' : 'text-gray-400'}`} />
          <h3 className="text-sm font-semibold text-secondary-900 mb-2">
            {uploading ? 'Uploading...' : 'Upload Files'}
          </h3>
          <p className="text-sm text-secondary-600 mb-4">
            Drag and drop files here, or click to browse
          </p>
          <label className="inline-block">
            <input
              type="file"
              multiple
              onChange={(e) => handleFileUpload(Array.from(e.target.files))}
              className="hidden"
              disabled={uploading}
            />
            <span className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer inline-flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Choose Files'}
            </span>
          </label>
          <p className="text-xs text-secondary-500 mt-4">
            Supported formats: PDF, Word, Excel, Images, and more
          </p>
        </div>
      </div>

      {/* Files List */}
      {attachments.length === 0 ? (
        <div className="bg-white rounded shadow-sm border border-gray-200 p-12 text-center">
          <Paperclip className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-secondary-600 mb-2">No Attachments Yet</h3>
          <p className="text-secondary-500">
            Upload documents, images, or any files related to this project
          </p>
        </div>
      ) : (
        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="p-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getFileIcon(attachment.original_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-secondary-900 truncate">
                        {attachment.original_name}
                      </h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-secondary-500">
                        <span>{formatFileSize(attachment.file_size || 0)}</span>
                        <span>
                          {new Date(attachment.uploaded_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        {attachment.uploaded_by && (
                          <span>by {attachment.uploaded_by}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDownload(attachment)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(attachment)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {attachment.description && (
                  <p className="mt-2 text-sm text-secondary-600 ml-16">
                    {attachment.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Attachments;
