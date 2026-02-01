import React, { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { authFetch } from '../utils/authFetch';
import { formatDate } from '../utils/dateUtils';

interface PDFBarcodeScannerProps {
  onScan: (result: string) => void;
  entry: any;
  onDataRetrieved?: (data: any) => void;
}

const PDFBarcodeScanner: React.FC<PDFBarcodeScannerProps> = ({ onScan, entry, onDataRetrieved }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [scannedResult, setScannedResult] = useState('');
  const [retrievedData, setRetrievedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const extractIdFromScan = (raw: string) => {
    const text = (raw || '').trim();
    if (!text) return '';

    // Support old QR codes that encoded JSON
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') {
        const id = (parsed as any).id || (parsed as any)._id;
        if (typeof id === 'string') return id;
      }
    } catch {
      // ignore
    }

    // Support QR codes that encoded a URL
    const mongoIdMatch = text.match(/[a-f0-9]{24}/i);
    if (mongoIdMatch) return mongoIdMatch[0];

    return text;
  };

  const fetchJson = async (url: string) => {
    const res = await authFetch(url, { method: 'GET' });
    if (!res.ok) {
      let message = res.statusText;
      try {
        const data = await res.json();
        message = data?.message || message;
      } catch {
        // ignore
      }
      throw new Error(message);
    }
    return res.json();
  };

  const retrieveEntryData = async (rawScan: string) => {
    try {
      setIsLoading(true);

      const id = extractIdFromScan(rawScan);
      if (!id) {
        setError('Invalid scan result.');
        return null;
      }

      // PDF QR encodes submission _id, so try submissions first
      let data: any = null;
      try {
        data = await fetchJson(`/api/submissions/${id}`);
      } catch (e) {
        // Fallback: some parts of the app still use EntryModel routes
        data = await fetchJson(`/api/entries/${id}`);
      }

      setRetrievedData(data);
      if (onDataRetrieved) {
        onDataRetrieved(data);
      }
      return data;
    } catch (err: any) {
      console.error('Failed to retrieve entry data:', err);
      setError(`Failed to retrieve data: ${err?.message || 'Unknown error'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    setIsScanning(false);
  };

  const startScanning = async () => {
    try {
      setError('');
      setScannedResult('');
      setRetrievedData(null);
      setIsScanning(true);
      
      // Request camera permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Initialize the barcode reader
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      
      // Start continuous scanning
      reader.decodeFromVideoDevice(undefined, videoRef.current!, (result, err) => {
        if (result) {
          console.log('Barcode detected:', result.text);
          setScannedResult(result.text);
          onScan(result.text);
          
          // Retrieve entry data
          retrieveEntryData(result.text);
          
          // Stop scanning after successful scan
          stopScanning();
        }
        if (err && !(err.name === 'NotFoundException')) {
          console.error('Scanning error:', err);
        }
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
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 text-sm">Scan Entry ID</h3>
        <div className="text-xs text-slate-500">
          Current: {(entry as any)._id}
        </div>
      </div>
      
      {/* Scanner Area */}
      <div className="relative bg-black aspect-video rounded-lg overflow-hidden mb-4">
        {isScanning ? (
          <div className="relative w-full h-full">
            {/* Video Preview */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* Scanning Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner Brackets */}
              <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
              <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
              
              {/* Scanning Line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-green-400 animate-pulse"></div>
              
              {/* Status Text */}
              <div className="absolute top-2 left-0 right-0 text-center">
                <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm inline-block">
                  Scanning for barcode or QR code...
                </div>
              </div>
            </div>
            
            {/* Stop Button */}
            <button
              onClick={stopScanning}
              className="absolute bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <button
              onClick={startScanning}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors flex items-center"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 013 7.07V3a2 2 0 00-2-2H3a2 2 0 00-2 2v4.07a2 2 0 01.89 1.664l.812 1.22A2 2 0 015.93 9H3zm0 2a2 2 0 002 2v2a2 2 0 01-2 2H3a2 2 0 01-2-2v-2a2 2 0 012-2h.93a2 2 0 001.664.89l.812 1.22A2 2 0 015.07 11H3z" />
              </svg>
              Start Scanning
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c-1 0-3-1.5-4.5-4.5S18.5 3 17 3H7c-1.5 0-3 1.5-3 3.5S5.5 9 7 9v10c0 1.5 1.5 3 3.5s3.5-1.5 3.5-3.5V9c0-1.5-1.5-3-3.5-3.5z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="font-medium">Retrieving entry data...</span>
          </div>
        </div>
      )}

      {/* Retrieved Data */}
      {retrievedData && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-green-800">Entry Data Retrieved</h4>
            <button
              onClick={() => {
                setRetrievedData(null);
                setScannedResult('');
              }}
              className="text-green-600 hover:text-green-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium text-green-700">ID:</div>
              <div className="font-mono text-green-600">{retrievedData._id}</div>
              
              <div className="font-medium text-green-700">Status:</div>
              <div className="text-green-600">{retrievedData.status || 'N/A'}</div>
              
              <div className="font-medium text-green-700">Created:</div>
              <div className="text-green-600">{formatDate(retrievedData.createdAt)}</div>
              
              {retrievedData.school && (
                <>
                  <div className="font-medium text-green-700">School:</div>
                  <div className="text-green-600">{retrievedData.school}</div>
                </>
              )}
              
              {retrievedData.district && (
                <>
                  <div className="font-medium text-green-700">District:</div>
                  <div className="text-green-600">{retrievedData.district}</div>
                </>
              )}
            </div>
            
            {/* Additional data if available */}
            {Object.keys(retrievedData).filter(key => !['_id', 'status', 'createdAt', 'school', 'district', '__v'].includes(key)).length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-green-700 hover:text-green-800">
                  View All Data ({Object.keys(retrievedData).length - 6} fields)
                </summary>
                <pre className="mt-2 text-xs bg-white p-2 rounded border border-green-200 overflow-auto max-h-40">
                  {JSON.stringify(retrievedData, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}

      {/* Scan Result */}
      {scannedResult && !retrievedData && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-blue-800 mb-2">Scanned ID</h4>
              <p className="font-mono text-lg text-blue-600">{scannedResult}</p>
            </div>
            <button
              onClick={() => retrieveEntryData(scannedResult)}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Loading...' : 'Get Data'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFBarcodeScanner;
