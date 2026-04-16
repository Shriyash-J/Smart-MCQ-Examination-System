import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Proctor = ({ examId, onViolation, compact = false }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [facePresent, setFacePresent] = useState(true);
  const [warning, setWarning] = useState('');
  const [localViolations, setLocalViolations] = useState(0);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
        console.log('✅ Face detection models loaded');
      } catch (err) {
        console.error('❌ Failed to load models:', err);
      }
    };
    loadModels();
  }, []);

  // Log violation to backend AND notify parent
  const logViolation = useCallback(async (type, details = {}) => {
    console.log(`🚨 Violation detected: ${type}`, details);
    
    setLocalViolations(prev => prev + 1);
    
    if (typeof onViolation === 'function') {
      console.log('📢 Notifying parent of violation');
      onViolation({ type, details, timestamp: new Date().toISOString() });
    } else {
      console.warn('⚠️ onViolation is not a function!');
    }

    try {
      await axios.post(`${API_URL}/proctoring/log`, {
        examId,
        violationType: type,
        details
      });
    } catch (err) {
      console.error('Backend log failed:', err);
    }
  }, [examId, onViolation]);

  // Face detection loop
  useEffect(() => {
    if (!modelsLoaded || !webcamRef.current) return;

    let interval;
    let noFaceStartTime = null;
    let faceWarningShown = false;

    const detectFace = async () => {
      if (!webcamRef.current || !canvasRef.current) return;

      const video = webcamRef.current.video;
      if (video.readyState !== 4) return;

      try {
        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks();

        const canvas = canvasRef.current;
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);

        const faceCount = detections.length;

        if (faceCount === 0) {
          if (!noFaceStartTime) {
            noFaceStartTime = Date.now();
          } else if (Date.now() - noFaceStartTime > 3000 && !faceWarningShown) {
            setFacePresent(false);
            setWarning('No face detected!');
            logViolation('no_face', { duration: Date.now() - noFaceStartTime });
            faceWarningShown = true;
          }
        } else if (faceCount > 1) {
          setFacePresent(false);
          setWarning('Multiple faces detected!');
          logViolation('multiple_faces', { count: faceCount });
        } else {
          setFacePresent(true);
          setWarning('');
          noFaceStartTime = null;
          faceWarningShown = false;
        }
      } catch (err) {
        console.error('Detection error:', err);
      }
    };

    interval = setInterval(detectFace, 1500);
    return () => clearInterval(interval);
  }, [modelsLoaded, logViolation]);

  // Fullscreen enforcement
  const enterFullscreen = () => {
    document.documentElement.requestFullscreen?.();
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setWarning('Stay in fullscreen mode!');
        logViolation('fullscreen_exit');
        setTimeout(enterFullscreen, 1000);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [logViolation]);

  // Tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation('tab_switch');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [logViolation]);

  // Auto-enter fullscreen on mount (only if not compact mode)
  useEffect(() => {
    if (!compact) {
      enterFullscreen();
    }
  }, [compact]);

  if (!modelsLoaded) {
    return compact ? (
      <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse" />
    ) : (
      <div className="p-4 text-center text-sm">Loading face detection...</div>
    );
  }

  // COMPACT MODE - Larger circular webcam (96x96px) for better visibility
  if (compact) {
    return (
      <div className="relative inline-block">
        <div className={`w-24 h-24 rounded-full overflow-hidden border-2 ${facePresent ? 'border-green-500' : 'border-red-500'}`}>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{ width: 320, height: 240, facingMode: 'user' }}
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full hidden" />
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${facePresent ? 'bg-green-500' : 'bg-red-500'}`} />
        {warning && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
            {warning}
          </div>
        )}
      </div>
    );
  }

  // FULL MODE - For dedicated proctoring view (optional)
  return (
    <div className="relative">
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      </div>

      <div className="mt-2 p-3 rounded bg-gray-50 border">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${facePresent ? 'text-green-600' : 'text-red-600'}`}>
            {facePresent ? '✅ Face detected' : '❌ Face not detected'}
          </span>
          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
            Violations: {localViolations}
          </span>
        </div>
        {warning && <p className="text-xs text-red-500 mt-1">{warning}</p>}
        <button
          onClick={enterFullscreen}
          className="mt-2 w-full text-xs bg-blue-100 text-blue-800 py-1 rounded hover:bg-blue-200"
        >
          Enter Fullscreen
        </button>
      </div>
    </div>
  );
};

export default Proctor;