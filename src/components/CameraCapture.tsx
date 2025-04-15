import React, { useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture }) => {
  const webcamRef = useRef<Webcam>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
    }
  }, [onCapture]);

  return (
    <div className="relative">
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="w-full rounded-lg"
      />
      <button
        onClick={capture}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                   bg-blue-500 text-white px-4 py-2 rounded-full
                   flex items-center space-x-2 hover:bg-blue-600 transition-colors"
      >
        <Camera className="w-5 h-5" />
        <span>Capture</span>
      </button>
    </div>
  );
};