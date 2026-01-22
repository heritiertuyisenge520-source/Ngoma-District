import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/browser';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose, isOpen }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [torchOn, setTorchOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const startScanning = useCallback(async () => {
    try {
      setError('');
      setIsScanning(true);
      
      // Request camera permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Initialize the barcode reader
      readerRef.current = new BrowserMultiFormatReader();
      
      readerRef.current.decodeFromVideoDevice(stream, videoRef.current!)
        .then((result: Result) => {
          if (result) {
            onScan(result.text);
            setIsScanning(false);
            // Stop the camera stream
            stream.getTracks().forEach(track => track.stop());
          }
        })
        .catch((err: any) => {
          console.error('Barcode scanning error:', err);
          setError('Failed to scan barcode. Please try again.');
          setIsScanning(false);
        });

    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera.');
      } else {
        setError('Failed to access camera. Please try again.');
      }
      setIsScanning(false);
    }
  }, [onScan]);

  const stopScanning = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setIsScanning(false);
  }, []);

  const toggleTorch = useCallback(async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      
      if (videoTrack && 'torch' in videoTrack.getCapabilities()) {
        const capabilities = videoTrack.getCapabilities() as any;
        if (capabilities.torch) {
          try {
            await videoTrack.applyConstraints({
              advanced: [{ torch: !torchOn }]
            });
            setTorchOn(!torchOn);
          } catch (err) {
            console.error('Failed to toggle torch:', err);
          }
        }
      }
    }
  }, [torchOn]);

  useEffect(() => {
    if (isOpen) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen, startScanning, stopScanning]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Barcode Scanner</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-slate-300 transition-colors p-2 rounded-lg hover:bg-slate-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scanner Area */}
        <div className="relative bg-black aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Scanning Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Corner brackets */}
              <div className="absolute w-64 h-64 border-2 border-white">
                {/* Top-left corner */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-500"></div>
                {/* Top-right corner */}
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-500"></div>
                {/* Bottom-left corner */}
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-500"></div>
                {/* Bottom-right corner */}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-500"></div>
              </div>
              
              {/* Scanning line animation */}
              {isScanning && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 animate-pulse"></div>
              )}
            </div>
          </div>

          {/* Status overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            {isScanning && (
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                Scanning...
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 m-4 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-gray-100 p-4 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={toggleTorch}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-2 2h-1a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {torchOn ? 'Flash Off' : 'Flash On'}
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
