'use client';
// Dataset Upload Page
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Database,
  ArrowRight,
  Trash2,
  Eye,
} from 'lucide-react';
import { Sidebar, Header, DataTable, LoadingState } from '@/components';
import { useAppStore } from '@/store';

interface UploadedFile {
  name: string;
  size: number;
  data: any[];
  columns: string[];
  status: 'processing' | 'success' | 'error';
  error?: string;
}

export default function UploadPage() {
  const { setCustomDataset, setDataset, setDatasetAnalysis, customDataset, theme } = useAppStore();
  const isDark = theme === 'dark';
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setUploadedFile({
        name: file.name,
        size: file.size,
        data: [],
        columns: [],
        status: 'error',
        error: 'Only CSV files are supported',
      });
      return;
    }

    setIsProcessing(true);
    setUploadedFile({
      name: file.name,
      size: file.size,
      data: [],
      columns: [],
      status: 'processing',
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/data', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadedFile({
          name: file.name,
          size: file.size,
          data: result.data,
          columns: Object.keys(result.data[0] || {}),
          status: 'success',
        });
      } else {
        setUploadedFile(prev => prev ? {
          ...prev,
          status: 'error',
          error: result.error || 'Failed to process file',
        } : null);
      }
    } catch (error) {
      setUploadedFile(prev => prev ? {
        ...prev,
        status: 'error',
        error: 'Failed to upload file',
      } : null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseDataset = () => {
    if (uploadedFile?.data) {
      setCustomDataset(uploadedFile.data);
      setDataset(uploadedFile.data);
      // Navigate to dashboard
      window.location.href = '/dashboard';
    }
  };

  const handleClearUpload = () => {
    setUploadedFile(null);
    setShowPreview(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Dataset Upload" subtitle="Upload and analyze custom datasets" />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-2xl font-bold text-white">Upload Dataset</h1>
              <p className="text-gray-500">Upload your own CSV file to analyze with AI</p>
            </motion.div>

            {/* Upload Area */}
            {!uploadedFile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative border-2 border-dashed rounded-2xl p-16 text-center transition-all ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-500/10' 
                    : 'border-white/10 glass-bright hover:border-white/20'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {/* Animated background */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-indigo-500/10 to-transparent blur-3xl" />
                </div>
                
                <div className="relative">
                  <motion.div 
                    animate={{ y: isDragging ? -10 : 0 }}
                    className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/30"
                  >
                    <Upload className="w-12 h-12 text-white" />
                  </motion.div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {isDragging ? 'Drop your file here' : 'Drag and drop your CSV file'}
                  </h3>
                  <p className="text-gray-400 mb-8">or click to browse your files</p>
                  
                  <label className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl font-semibold text-white cursor-pointer transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50">
                    <FileSpreadsheet className="w-5 h-5" />
                    Select CSV File
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  
                  <div className="mt-10 flex items-center justify-center gap-8 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      CSV format
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      Up to 50MB
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      Auto-detect columns
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Upload Progress / Result */}
            {uploadedFile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-bright rounded-2xl overflow-hidden"
              >
                {/* File Info Header */}
                <div className="p-6 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        uploadedFile.status === 'success' ? 'bg-emerald-500/20' :
                        uploadedFile.status === 'error' ? 'bg-red-500/20' :
                        'bg-indigo-500/20'
                      }`}>
                        {uploadedFile.status === 'success' ? (
                          <CheckCircle className="w-7 h-7 text-emerald-400" />
                        ) : uploadedFile.status === 'error' ? (
                          <XCircle className="w-7 h-7 text-red-400" />
                        ) : (
                          <Database className="w-7 h-7 text-indigo-400 animate-pulse" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">{uploadedFile.name}</h3>
                        <p className="text-sm text-gray-500">
                          {uploadedFile.status === 'processing' 
                            ? 'Processing...' 
                            : formatFileSize(uploadedFile.size)}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleClearUpload}
                      className="p-3 glass rounded-xl transition-colors text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>

                  {uploadedFile.status === 'error' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
                    >
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <span>{uploadedFile.error}</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Success State */}
                {uploadedFile.status === 'success' && (
                  <>
                    {/* Stats */}
                    <div className="p-6 grid grid-cols-3 gap-6 border-b border-white/5">
                      {[
                        { label: 'Total Rows', value: uploadedFile.data.length.toLocaleString() },
                        { label: 'Columns', value: uploadedFile.columns.length },
                        { label: 'File Size', value: formatFileSize(uploadedFile.size) },
                      ].map((stat, index) => (
                        <motion.div 
                          key={stat.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <p className="text-sm text-gray-500">{stat.label}</p>
                          <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Column List */}
                    <div className="p-6 border-b border-white/5">
                      <h4 className="text-sm font-medium text-gray-400 mb-4">Detected Columns</h4>
                      <div className="flex flex-wrap gap-2">
                        {uploadedFile.columns.map((col, index) => (
                          <motion.span
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.03 }}
                            className="px-4 py-2 glass rounded-xl text-sm text-gray-300"
                          >
                            {col}
                          </motion.span>
                        ))}
                      </div>
                    </div>

                    {/* Preview Toggle */}
                    <div className="p-6 border-b border-white/5">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                        {showPreview ? 'Hide Preview' : 'Show Data Preview'}
                      </motion.button>
                    </div>

                    {/* Data Preview */}
                    {showPreview && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-6 border-b border-white/5"
                      >
                        <DataTable data={uploadedFile.data.slice(0, 10)} pageSize={10} />
                        <p className="text-sm text-gray-500 mt-4 text-center">
                          Showing first 10 rows of {uploadedFile.data.length.toLocaleString()} total
                        </p>
                      </motion.div>
                    )}

                    {/* Actions */}
                    <div className="p-6 flex items-center justify-end gap-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleClearUpload}
                        className="px-6 py-3 glass rounded-xl font-medium text-gray-300 hover:text-white transition-colors"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleUseDataset}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl font-semibold text-white transition-all shadow-lg shadow-indigo-500/30"
                      >
                        Use This Dataset
                        <ArrowRight className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </>
                )}

                {/* Processing State */}
                {uploadedFile.status === 'processing' && (
                  <div className="p-16">
                    <LoadingState type="inline" message="Analyzing your dataset..." />
                  </div>
                )}
              </motion.div>
            )}

            {/* Tips */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 glass-bright rounded-2xl p-6"
            >
              <h3 className="font-semibold text-white mb-6">Tips for best results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Use headers',
                    description: 'First row should contain column names',
                    color: 'indigo',
                  },
                  {
                    title: 'Clean data',
                    description: 'Remove empty rows and fix formatting issues',
                    color: 'emerald',
                  },
                  {
                    title: 'Consistent types',
                    description: 'Keep numeric columns as numbers, not text',
                    color: 'amber',
                  },
                  {
                    title: 'Descriptive names',
                    description: 'Use clear, meaningful column headers',
                    color: 'purple',
                  },
                ].map((tip, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-start gap-4 p-4 glass rounded-xl"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-${tip.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-sm font-bold text-${tip.color}-400`}>{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{tip.title}</p>
                      <p className="text-sm text-gray-500">{tip.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
