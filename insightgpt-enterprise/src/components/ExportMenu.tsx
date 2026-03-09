'use client';
// InsightGPT Enterprise - Export Utilities
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, Link2, Check, Loader2, ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportMenuProps {
  targetRef: React.RefObject<HTMLElement>;
  filename?: string;
  title?: string;
}

export default function ExportMenu({ targetRef, filename = 'dashboard', title }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const exportAsPNG = async () => {
    if (!targetRef.current) return;
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: '#111827',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      setExportStatus('success');
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportStatus('idle'), 2000);
    }
  };

  const exportAsPDF = async () => {
    if (!targetRef.current) return;
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: '#111827',
        scale: 2,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${filename}.pdf`);
      
      setExportStatus('success');
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportStatus('idle'), 2000);
    }
  };

  const copyShareLink = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 2000);
    } catch (error) {
      setExportStatus('error');
    }
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white font-medium transition-colors"
      >
        <Download className="w-4 h-4" />
        Export
        {isExporting && <Loader2 className="w-4 h-4 animate-spin" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden"
            >
              {title && (
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="text-sm font-medium text-white">{title}</p>
                </div>
              )}
              
              <div className="p-2">
                <button
                  onClick={exportAsPNG}
                  disabled={isExporting}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
                >
                  <ImageIcon className="w-4 h-4 text-green-400" />
                  <span>Export as PNG</span>
                </button>
                
                <button
                  onClick={exportAsPDF}
                  disabled={isExporting}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
                >
                  <FileText className="w-4 h-4 text-red-400" />
                  <span>Export as PDF</span>
                </button>
                
                <button
                  onClick={copyShareLink}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <Link2 className="w-4 h-4 text-blue-400" />
                  <span>Copy Share Link</span>
                  {exportStatus === 'success' && <Check className="w-4 h-4 text-green-400 ml-auto" />}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
