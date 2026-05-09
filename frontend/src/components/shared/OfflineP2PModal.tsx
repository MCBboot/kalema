"use client";
import { useState } from "react";
import QRCode from "react-qr-code";
import { QRScanner } from "./QRScanner";
import Button from "./Button";
import { p2pManager } from "@/lib/webrtc/WebRTCManager";

interface OfflineP2PModalProps {
  onClose: () => void;
  isHost: boolean;
  targetPlayerId?: string; // used by Host to know who is connecting
}

export function OfflineP2PModal({ onClose, isHost, targetPlayerId }: OfflineP2PModalProps) {
  const [step, setStep] = useState(isHost ? "GENERATE_OFFER" : "SCAN_OFFER");
  const [offerText, setOfferText] = useState("");
  const [answerText, setAnswerText] = useState("");

  const handleGenerateOffer = () => {
    if (!targetPlayerId) return;

    // Create a callback explicitly for grabbing the initial offer string without Socket.IO
    p2pManager.generateOfflineOffer(targetPlayerId, (offerStr) => {
       setOfferText(offerStr);
       setStep("SHOW_OFFER");
    });
  };

  const handleScanOffer = (data: string) => {
    // Client scanned Host's offer, now generate an answer
    p2pManager.generateOfflineAnswer(data, (answerStr) => {
      setAnswerText(answerStr);
      setStep("SHOW_ANSWER");
    });
  };

  const handleScanAnswer = (data: string) => {
    if (!targetPlayerId) return;
    // Host scanned Client's answer
    p2pManager.acceptOfflineAnswer(targetPlayerId, data);
    setStep("CONNECTED");
    setTimeout(onClose, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-surface p-6 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto text-center">
        <h2 className="text-2xl font-bold mb-4 text-primary">
          {isHost ? "استضافة لاعب أوفلاين" : "انضمام للعبة أوفلاين"}
        </h2>

        {step === "GENERATE_OFFER" && isHost && (
          <div>
            <p className="mb-4">اضغط لتوليد كود الاتصال</p>
            <Button onClick={handleGenerateOffer}>توليد QR Code</Button>
          </div>
        )}

        {step === "SHOW_OFFER" && isHost && (
          <div>
            <p className="mb-4">اجعل اللاعب يمسح هذا الكود</p>
            <div className="bg-white p-4 rounded-lg inline-block mb-4">
              <QRCode value={offerText} size={200} />
            </div>
            <Button onClick={() => setStep("SCAN_ANSWER")}>تم المسح - الخطوة التالية</Button>
          </div>
        )}

        {step === "SCAN_OFFER" && !isHost && (
          <div>
            <p className="mb-4">قم بمسح كود المضيف (Host)</p>
            <QRScanner onScan={handleScanOffer} />
          </div>
        )}

        {step === "SHOW_ANSWER" && !isHost && (
          <div>
            <p className="mb-4">اجعل المضيف يمسح هذا الكود</p>
            <div className="bg-white p-4 rounded-lg inline-block mb-4">
              <QRCode value={answerText} size={200} />
            </div>
            <p className="text-sm text-gray-400 mt-2">بعد مسح المضيف ستتصل باللعبة تلقائياً</p>
          </div>
        )}

        {step === "SCAN_ANSWER" && isHost && (
          <div>
            <p className="mb-4">قم بمسح كود اللاعب لتأكيد الاتصال</p>
            <QRScanner onScan={handleScanAnswer} />
          </div>
        )}

        {step === "CONNECTED" && (
          <div className="text-green-500 font-bold text-xl">
            تم الاتصال بنجاح!
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 text-gray-400 hover:text-white"
        >
          إلغاء وإغلاق
        </button>
      </div>
    </div>
  );
}
