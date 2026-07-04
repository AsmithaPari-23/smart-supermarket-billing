import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import axios from 'axios';
import { 
  Camera, 
  RotateCw, 
  Lightbulb, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';

const Scanner = () => {
  const [searchParams] = useSearchParams();
  const room = searchParams.get('room');
  
  const { connected, joinSession, sendBarcode, socket } = useSocket();

  // Scanner state
  const [hasCamera, setHasCamera] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [videoDevices, setVideoDevices] = useState([]);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scanStatus, setScanStatus] = useState('Initializing camera...');
  const [lastScanned, setLastScanned] = useState('');
  const [lastScannedProduct, setLastScannedProduct] = useState(null);
  const [loadingCamera, setLoadingCamera] = useState(true);

  // Manual fallback search state
  const [showFallback, setShowFallback] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fallbackProducts, setFallbackProducts] = useState([]);
  const [searching, setSearching] = useState(false);

  const html5QrCodeRef = useRef(null);
  const isScanningRef = useRef(false);
  const lastScannedRef = useRef({ code: '', time: 0 });

  // Play synthetic beep using Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // 1200 Hz
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);

      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (err) {
      console.warn('Audio feedback failed:', err);
    }
  };

  // Trigger device haptic vibration
  const triggerVibrate = (duration = 100) => {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  };

  // Link socket room on load
  useEffect(() => {
    if (room) {
      joinSession(room);
    }
  }, [room]);

  // Connect socket notifications from dashboard
  useEffect(() => {
    if (socket) {
      socket.on('scan-success', (data) => {
        setLastScannedProduct({ success: true, name: data.name });
        playBeep();
        triggerVibrate(100);
      });

      socket.on('scan-failed', (data) => {
        setLastScannedProduct({ success: false, name: data.message });
        triggerVibrate(100);
        // double vibration on error
        setTimeout(() => triggerVibrate(100), 200);
      });
    }
    return () => {
      if (socket) {
        socket.off('scan-success');
        socket.off('scan-failed');
      }
    };
  }, [socket]);

  // Find available video inputs for enabling/disabling the Camera Swap button
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then((devices) => {
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        setVideoDevices(videoInputs);
      })
      .catch((err) => {
        console.error('Enumerate devices error:', err);
      });
  }, []);

  // Store refs for values used inside the scanner callbacks to avoid resetting scanner
  const roomRef = useRef(room);
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  // Setup 5-second timer for manual fallback search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch product list for fallback search when triggered or query changes
  useEffect(() => {
    if (!showFallback) return;

    let isCurrent = true;
    const fetchFallbackProducts = async () => {
      try {
        setSearching(true);
        const { data } = await axios.get(`/api/products/public/search?search=${searchQuery}`);
        if (data.success && isCurrent) {
          setFallbackProducts(data.products);
        }
      } catch (err) {
        console.error("Failed to load products for manual search:", err);
      } finally {
        if (isCurrent) setSearching(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchFallbackProducts();
    }, 300);

    return () => {
      isCurrent = false;
      clearTimeout(delayDebounce);
    };
  }, [showFallback, searchQuery]);

  // Initializing Camera & html5-qrcode
  useEffect(() => {
    let isMounted = true;
    setLoadingCamera(true);
    setScanStatus('Initializing camera...');

    const scannerContainer = document.getElementById("scanner-reader");
    if (!scannerContainer) {
      setScanStatus('Scanner target element missing.');
      setLoadingCamera(false);
      return;
    }

    const codeReader = new Html5Qrcode("scanner-reader");
    html5QrCodeRef.current = codeReader;

    const startCamera = async () => {
      try {
        await codeReader.start(
          { facingMode: facingMode },
          {
            fps: 10,
            qrbox: { width: 300, height: 300 },
            rememberLastUsedCamera: true,
            aspectRatio: 1.777,
            disableFlip: false,
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.CODE_93,
              Html5QrcodeSupportedFormats.ITF,
              Html5QrcodeSupportedFormats.CODABAR,
            ]
          },
          (decodedText, decodedResult) => {
            if (isMounted) {
              const now = Date.now();
              if (decodedText && (decodedText !== lastScannedRef.current.code || (now - lastScannedRef.current.time) > 2000)) {
                lastScannedRef.current = { code: decodedText, time: now };
                setLastScanned(decodedText);
                
                // Send to dashboard via Socket
                sendBarcode(decodedText, roomRef.current);
                
                // Temporary scan status transition
                setScanStatus(`Scanned code: ${decodedText}`);
                setTimeout(() => {
                  if (isMounted) {
                    setLastScanned('');
                    setScanStatus('Ready to scan. Point camera at barcode.');
                  }
                }, 2500);
              }
            }
          },
          (errorMessage) => {
            // Ignored to prevent performance drop on high frame rate
          }
        );

        if (isMounted) {
          setHasCamera(true);
          setLoadingCamera(false);
          setScanStatus('Ready to scan. Point camera at barcode.');
          isScanningRef.current = true;
        }
      } catch (err) {
        console.error("Camera error:", err);
        if (isMounted) {
          setHasCamera(false);
          setLoadingCamera(false);
          if (err.toString().includes("NotAllowedError") || err.toString().includes("Permission denied")) {
            setScanStatus("Camera permission denied. Please grant permission in browser settings.");
          } else if (err.toString().includes("NotFoundError") || err.toString().includes("Requested device not found")) {
            setScanStatus("Camera unavailable or not found.");
          } else {
            setScanStatus(`Camera error: ${err.message || err}`);
          }
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (codeReader) {
        if (isScanningRef.current) {
          isScanningRef.current = false;
          codeReader.stop().then(() => {
            console.log("Scanner stopped.");
          }).catch(err => {
            console.error("Error stopping scanner on cleanup:", err);
          });
        }
      }
    };
  }, [facingMode, sendBarcode]);

  // Camera Swap
  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Toggle Torch Flashlight
  const toggleTorch = async () => {
    try {
      if (html5QrCodeRef.current && isScanningRef.current) {
        const capabilities = html5QrCodeRef.current.getRunningTrackCameraCapabilities();
        const torch = capabilities.torchFeature();
        if (torch && torch.isSupported()) {
          const nextVal = !torchEnabled;
          await torch.apply(nextVal);
          setTorchEnabled(nextVal);
        } else {
          // Fallback to standard track constraint
          const stream = document.querySelector("#scanner-reader video")?.srcObject;
          if (stream) {
            const track = stream.getVideoTracks()[0];
            const trackCaps = track.getCapabilities();
            if (trackCaps.torch) {
              const nextVal = !torchEnabled;
              await track.applyConstraints({
                advanced: [{ torch: nextVal }]
              });
              setTorchEnabled(nextVal);
            } else {
              alert('Torch flashlight is not supported on this device/camera.');
            }
          } else {
            alert('Torch flashlight is not supported on this device/camera.');
          }
        }
      }
    } catch (err) {
      console.error('Torch toggle failed:', err);
    }
  };

  const handleProductSelect = (product) => {
    // Send manually selected product barcode
    sendBarcode(product.barcode, room);
    setScanStatus(`Selected manually: ${product.name}`);
    setTimeout(() => {
      setScanStatus('Ready to scan. Point camera at barcode.');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col justify-between p-4 select-none relative overflow-hidden">
      {/* Dynamic styling override for html5-qrcode video element to fit container */}
      <style>{`
        #scanner-reader {
          width: 100% !important;
          height: 100% !important;
          position: absolute !important;
          top: 0;
          left: 0;
        }
        #scanner-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
      `}</style>

      {/* Top Details & Socket Link */}
      <header className="flex justify-between items-center bg-black/40 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
        <div>
          <h1 className="font-heading font-bold text-sm tracking-tight">Apex MobilScanner</h1>
          <p className="text-[10px] text-gray-400 font-medium tracking-wide">Terminal room: {room || 'No session'}</p>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
              <Wifi size={12} /> Sync Active
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
              <WifiOff size={12} /> Offline
            </span>
          )}
        </div>
      </header>

      {/* Video Scanning Container */}
      <div className="relative flex-1 min-h-[220px] my-4 bg-black rounded-3xl border border-white/10 overflow-hidden flex items-center justify-center">
        <div id="scanner-reader" />
        
        {loadingCamera && (
          <div className="absolute z-10 text-center p-6 space-y-2">
            <div className="mx-auto h-8 w-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold">Initializing camera...</p>
          </div>
        )}

        {!hasCamera && !loadingCamera && (
          <div className="absolute z-10 text-center p-6 space-y-2">
            <Camera size={48} className="mx-auto text-gray-500 stroke-[1.5]" />
            <p className="text-sm font-semibold px-4">{scanStatus}</p>
          </div>
        )}

        {/* Scan Reticle Guides */}
        {hasCamera && !loadingCamera && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-64 h-36 border-2 border-accent-primary/60 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
              {/* Laser line effect */}
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-red-500 shadow-md shadow-red-500/80 animate-bounce"></div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Fallback Search Box & List */}
      {showFallback && (
        <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 max-h-56 overflow-hidden mb-4 backdrop-blur-md">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <h3 className="text-xs uppercase font-bold tracking-wider text-accent-primary flex items-center gap-1.5">
              Manual Fallback Search
            </h3>
            <span className="text-[9px] text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
              No barcode scan detected
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product by name..."
              className="w-full pl-3 pr-8 py-2 rounded-xl border border-white/10 bg-white/5 focus:bg-white/10 focus:border-accent-primary outline-none transition text-xs font-semibold"
            />
            {searching && (
              <div className="absolute right-3 top-2.5 h-4 w-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 max-h-32 custom-scrollbar">
            {fallbackProducts.length > 0 ? (
              fallbackProducts.map((product) => (
                <div
                  key={product._id}
                  onClick={() => handleProductSelect(product)}
                  className="py-2 px-2 hover:bg-white/5 text-xs font-medium flex justify-between items-center cursor-pointer active:bg-white/10 rounded-lg transition"
                >
                  <div>
                    <p className="text-white font-semibold">{product.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">Barcode: {product.barcode}</p>
                  </div>
                  <span className="text-accent-primary font-bold">₹{product.sellingPrice.toFixed(2)}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-gray-500 py-3">No products found</p>
            )}
          </div>
        </div>
      )}

      {/* Scanned product status box */}
      <footer className="space-y-4">
        {lastScannedProduct && (
          <div className={`p-4 rounded-2xl border flex items-center gap-3 backdrop-blur-md transition duration-300 ${
            lastScannedProduct.success 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {lastScannedProduct.success ? <CheckCircle size={22} /> : <AlertTriangle size={22} />}
            <div className="overflow-hidden">
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                {lastScannedProduct.success ? 'Product Scanned' : 'Scan Refused'}
              </p>
              <h4 className="text-sm font-bold truncate leading-snug">{lastScannedProduct.name}</h4>
            </div>
          </div>
        )}

        {/* Action button bar */}
        <div className="grid grid-cols-3 gap-3 bg-black/40 border border-white/10 p-3 rounded-2xl backdrop-blur-md text-center">
          <button 
            onClick={toggleCamera} 
            disabled={videoDevices.length <= 1}
            className="flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-gray-300 active:text-white disabled:opacity-30"
          >
            <RotateCw size={20} />
            Camera
          </button>
          
          <div className="text-[11px] font-semibold flex items-center justify-center text-gray-400 leading-tight">
            {scanStatus}
          </div>

          <button 
            onClick={toggleTorch} 
            className="flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-gray-300 active:text-white"
          >
            <Lightbulb size={20} className={torchEnabled ? 'text-yellow-400 fill-yellow-400' : ''} />
            Flash
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Scanner;
