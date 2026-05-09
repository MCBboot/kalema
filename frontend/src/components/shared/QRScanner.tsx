"use client";
import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (err: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scannerRef.current.render(
      (decodedText) => {
        // Automatically stop after a successful scan
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
        onScan(decodedText);
      },
      (errorMessage) => {
        if (onError) onError(errorMessage);
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan, onError]);

  return <div id="qr-reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-lg"></div>;
}
