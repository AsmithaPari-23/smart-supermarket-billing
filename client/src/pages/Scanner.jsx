import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { BrowserMultiFormatReader } from '@zxing/library';
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

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  // Play synthentic beep using Web Audio API
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
  const triggerVibrate = () => {
    if (navigator.vibrate) {
      navigator.vibrate(120);
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
        triggerVibrate();
      });

      socket.on('scan-failed', (data) => {
        setLastScannedProduct({ success: false, name: data.message });
        triggerVibrate();
        // double vibration on error
        setTimeout(() => triggerVibrate(), 200);
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

  // Store refs for values used inside the mediaStream callback to avoid restarting stream on value changes
  const roomRef = useRef(room);
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  const lastScannedRef = useRef(lastScanned);
  useEffect(() => {
    lastScannedRef.current = lastScanned;
  }, [lastScanned]);

  // Initializing Camera & Scanner
  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;
    let activeStream = null;

    const startCamera = async () => {
      try {
        setScanStatus('Requesting camera permission...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode }
        });
        activeStream = stream;
        setHasCamera(true);
        setScanStatus('Ready to scan. Point camera at barcode.');

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Start decoding from stream
        codeReader.decodeFromStream(stream, videoRef.current, (result, err) => {
          if (result) {
            const barcode = result.getText();
            if (barcode && barcode !== lastScannedRef.current) {
              setLastScanned(barcode);
              // Send to dashboard via Socket
              sendBarcode(barcode, roomRef.current);
              
              // Temporary scan status transition
              setScanStatus(`Scanned code: ${barcode}`);
              setTimeout(() => {
                setLastScanned('');
                setScanStatus('Ready to scan. Point camera at barcode.');
              }, 2500);
            }
          }
        });

      } catch (err) {
        console.error("Camera error:", err);
        setHasCamera(false);
        setScanStatus(`Camera error: ${err.message || err}`);
      }
    };

    startCamera();

    return () => {
      if (codeReader) {
        codeReader.reset();
      }
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
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
      const stream = videoRef.current.srcObject;
      if (stream) {
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        
        if (capabilities.torch) {
          const newTorch = !torchEnabled;
          await track.applyConstraints({
            advanced: [{ torch: newTorch }]
          });
          setTorchEnabled(newTorch);
        } else {
          alert('Torch flashlight is not supported on this device/camera.');
        }
      }
    } catch (err) {
      console.error('Torch toggle failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col justify-between p-4 select-none relative overflow-hidden">
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
      <div className="relative flex-1 my-4 bg-black rounded-3xl border border-white/10 overflow-hidden flex items-center justify-center">
        <video 
          ref={videoRef} 
          className={`absolute inset-0 w-full h-full object-cover ${hasCamera ? 'block' : 'hidden'}`} 
          playsInline
          autoPlay
          muted
        />
        
        {!hasCamera && (
          <div className="text-center p-6 space-y-2">
            <Camera size={48} className="mx-auto text-gray-500 stroke-[1.5]" />
            <p className="text-sm font-semibold px-4">{scanStatus}</p>
          </div>
        )}

        {/* Scan Reticle Guides */}
        {hasCamera && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-36 border-2 border-accent-primary/60 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
              {/* Laser line effect */}
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-red-500 shadow-md shadow-red-500/80 animate-bounce"></div>
            </div>
          </div>
        )}
      </div>

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
