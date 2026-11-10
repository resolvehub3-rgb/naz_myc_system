import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeCameraScanConfig, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, Flashlight, RefreshCw, AlertCircle, CheckCircle2, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { verifyQrPayload } from '../lib/attendanceLogic';
import { Member, AttendanceSession } from '../types/database';

interface CameraScannerProps {
  session: AttendanceSession;
  members: Member[];
  onAttendanceSuccess: (member: Member, arrivalTime: string, isDuplicate?: boolean) => void;
  onError?: (errorMsg: string) => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  session,
  members,
  onAttendanceSuccess,
  onError,
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lastScannedResult, setLastScannedResult] = useState<{
    status: 'success' | 'duplicate' | 'invalid';
    member?: Member;
    message: string;
    timestamp: string;
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isCooldownRef = useRef<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play audio chime using Web Audio API (works reliably offline and on mobile without assets)
  const playChime = useCallback((type: 'success' | 'duplicate' | 'error') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'success') {
        // High pleasant double-tone
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.1); // A5
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'duplicate') {
        // Warning buzz tone
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.setValueAtTime(240, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else {
        // Error lower tone
        osc.frequency.setValueAtTime(180, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  }, [soundEnabled]);

  // Handle scanned QR text
  const handleScanSuccess = useCallback(
    async (decodedText: string) => {
      if (isCooldownRef.current) return;
      isCooldownRef.current = true;

      const verification = verifyQrPayload(decodedText);

      if (!verification.isValid) {
        playChime('error');
        setLastScannedResult({
          status: 'invalid',
          message: verification.error || 'Invalid or unrecognized QR code.',
          timestamp: new Date().toLocaleTimeString(),
        });
        setTimeout(() => {
          isCooldownRef.current = false;
        }, 1500);
        return;
      }

      // Look up member in members list by memberId or membershipNumber
      let matchedMember = members.find((m) => {
        if (verification.memberId && m.id === verification.memberId) return true;
        if (
          verification.membershipNumber &&
          m.membership_number.toUpperCase() === verification.membershipNumber.toUpperCase()
        ) {
          return true;
        }
        return false;
      });

      if (!matchedMember) {
        // Might be a direct membership ID scanned
        const cleanCode = decodedText.trim().toUpperCase();
        matchedMember = members.find((m) => m.membership_number.toUpperCase() === cleanCode);
      }

      if (!matchedMember) {
        playChime('error');
        setLastScannedResult({
          status: 'invalid',
          message: `Member ID "${verification.membershipNumber || decodedText}" not found in church records.`,
          timestamp: new Date().toLocaleTimeString(),
        });
        setTimeout(() => {
          isCooldownRef.current = false;
        }, 1800);
        return;
      }

      // Found valid member: trigger parent callback which handles attendance insertion
      try {
        onAttendanceSuccess(matchedMember, new Date().toISOString());
        playChime('success');
        setLastScannedResult({
          status: 'success',
          member: matchedMember,
          message: `Attendance recorded for ${matchedMember.full_name}`,
          timestamp: new Date().toLocaleTimeString('en-GB'),
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        playChime('error');
        setLastScannedResult({
          status: 'invalid',
          message: msg,
          timestamp: new Date().toLocaleTimeString(),
        });
      }

      // Brief cooldown before next scan
      setTimeout(() => {
        isCooldownRef.current = false;
      }, 1600);
    },
    [members, onAttendanceSuccess, playChime]
  );

  const startScanner = useCallback(async () => {
    setCameraError(null);
    try {
      const qrScanner = new Html5Qrcode('qr-reader-container', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });

      const config: Html5QrcodeCameraScanConfig = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      // Prefer rear environment camera on smartphone
      await qrScanner.start(
        { facingMode: 'environment' },
        config,
        handleScanSuccess,
        () => {
          // Frame scanned without QR, ignore
        }
      );

      // Only assign ref if start succeeded
      scannerRef.current = qrScanner;
      setIsScanning(true);

      // Check flashlight support
      try {
        const capabilities = qrScanner.getRunningTrackCapabilities();
        if (capabilities && 'torch' in capabilities) {
          setTorchSupported(true);
        }
      } catch {
        setTorchSupported(false);
      }
    } catch (err: unknown) {
      console.warn('Camera init notice (device may not have camera attached):', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('NotAllowedError') || msg.includes('Permission denied')) {
        setCameraError('Camera permission denied. Please allow camera access in browser settings.');
      } else if (msg.includes('NotFoundError') || msg.includes('Requested device not found')) {
        setCameraError('No camera found on this device. Use "Manual Search" tab to record attendance.');
      } else {
        setCameraError(`Camera notice: ${msg}. Manual search is available below.`);
      }
      setIsScanning(false);
      scannerRef.current = null;
      if (onError) onError(msg);
    }
  }, [handleScanSuccess, onError]);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (scanner) {
      try {
        if (scanner.getState() === 2) {
          await scanner.stop();
        }
        scanner.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      } finally {
        setIsScanning(false);
      }
    }
  }, []);

  const toggleTorch = async () => {
    if (scannerRef.current && torchSupported) {
      try {
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: !torchOn } as unknown as MediaTrackConstraintSet],
        });
        setTorchOn(!torchOn);
      } catch (err) {
        console.warn('Failed to toggle torch:', err);
      }
    }
  };

  useEffect(() => {
    startScanner();
    return () => {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        try {
          if (scanner.getState() === 2) {
            scanner.stop().catch(() => {}).finally(() => {
              try { scanner.clear(); } catch {}
            });
          } else {
            try { scanner.clear(); } catch {}
          }
        } catch {
          // ignore
        }
      }
    };
  }, [startScanner]);

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto select-none">
      {/* Meeting Session Banner */}
      <div className="w-full bg-[#0B2345] text-white p-3 rounded-t-2xl flex items-center justify-between shadow-sm">
        <div className="min-w-0 pr-2">
          <span className="text-[10px] font-bold tracking-widest text-[#38BDF8] uppercase">
            Active Scanning Session
          </span>
          <h4 className="text-sm font-extrabold truncate text-white">{session.session_name}</h4>
          <span className="text-xs text-slate-300">
            {session.activity_type} • {session.meeting_date}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {torchSupported && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-2 rounded-xl transition-all ${
                torchOn ? 'bg-amber-400 text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title="Toggle Flashlight"
            >
              <Flashlight className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl transition-all ${
              soundEnabled ? 'bg-white/10 text-white' : 'bg-red-500/30 text-red-200'
            }`}
            title="Toggle Audio Feedback"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Video Viewport Container */}
      <div className="w-full relative bg-slate-950 aspect-square overflow-hidden border-x border-slate-300 flex items-center justify-center">
        <div id="qr-reader-container" className="w-full h-full" />

        {/* Framing Overlay for User Guidance */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8">
            <div className="relative w-64 h-64 border-2 border-white/40 rounded-2xl">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#38BDF8] rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#38BDF8] rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#38BDF8] rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#38BDF8] rounded-br-lg" />

              {/* Animated laser scanline */}
              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent animate-bounce opacity-80" />
            </div>
            <p className="mt-3 text-xs font-semibold text-white/90 bg-slate-900/80 px-3 py-1 rounded-full backdrop-blur-xs">
              Position member QR card inside frame
            </p>
          </div>
        )}

        {/* Camera Error / Permission Fallback */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-white">
            <ShieldAlert className="w-12 h-12 text-amber-400 mb-3" />
            <h5 className="font-bold text-sm mb-1">Camera Access Notice</h5>
            <p className="text-xs text-slate-300 mb-4 max-w-xs">{cameraError}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={startScanner}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#38BDF8] text-[#0B2345] font-bold text-xs rounded-xl shadow-md hover:bg-sky-300"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Camera
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Real-Time Scan Status Box */}
      <div className="w-full bg-white p-4 rounded-b-2xl border border-slate-300 border-t-0 shadow-md">
        {lastScannedResult ? (
          <div
            className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
              lastScannedResult.status === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : lastScannedResult.status === 'duplicate'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            {lastScannedResult.status === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wide">
                  {lastScannedResult.status === 'success' ? 'Recorded Successfully' : 'Notice'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {lastScannedResult.timestamp}
                </span>
              </div>
              {lastScannedResult.member && (
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {lastScannedResult.member.full_name} ({lastScannedResult.member.membership_number})
                </p>
              )}
              <p className="text-xs mt-0.5 opacity-90">{lastScannedResult.message}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-500 py-1">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Camera active & ready to scan
            </span>
            <span className="font-medium text-slate-400">Continuous mode</span>
          </div>
        )}

        {/* Scanner Control buttons */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={isScanning ? stopScanner : startScanner}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              isScanning
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-[#123B70] text-white hover:bg-[#0B2345]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            {isScanning ? 'Pause Camera' : 'Resume Camera'}
          </button>
        </div>
      </div>
    </div>
  );
};
