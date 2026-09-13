import React, { useRef, useEffect, useState, useCallback } from 'react';

export interface FaceMeshOverlayProps {
  status: 'SCANNING' | 'DETECTED_KNOWN' | 'DETECTED_UNKNOWN' | 'NO_FACE';
  showBoundingBox?: boolean;
  showScanLine?: boolean;
  showLandmarkNodes?: boolean;
  showWireframe?: boolean;
  confidenceScore?: number;
  userName?: string;
  className?: string;
  interactivePose?: { pitch: number; yaw: number; roll: number };
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  isMirrored?: boolean;
  enablePoseControls?: boolean;
  onFaceTracked?: (data: {
    detected: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    yaw: number;
    pitch: number;
  }) => void;
}

// 3D Point with Normalized Anatomical Coordinates (x: -1 to 1, y: -1 to 1, z: depth forward/back)
interface Landmark3D {
  id: number;
  x: number;
  y: number;
  z: number;
  group: 'forehead' | 'eyes' | 'nose' | 'mouth' | 'cheeks' | 'jaw';
  color: string;
  glowColor: string;
  size: number;
}

export const FaceMeshOverlay: React.FC<FaceMeshOverlayProps> = ({
  status,
  showBoundingBox = true,
  showScanLine = true,
  showLandmarkNodes = true,
  showWireframe = true,
  confidenceScore = 99.4,
  userName,
  className = '',
  interactivePose = { pitch: 0, yaw: 0, roll: 0 },
  videoRef,
  isMirrored = true,
  enablePoseControls = true,
  onFaceTracked
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Real-time tracking state
  const [faceDetected, setFaceDetected] = useState<boolean>(true);
  const [currentPose, setCurrentPose] = useState<{ yaw: number; pitch: number }>({ yaw: 0, pitch: 0 });
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);

  // Tracker state ref for 60fps butter-smooth EMA interpolation without lag or re-renders
  const trackerRef = useRef<{
    currX: number;
    currY: number;
    currW: number;
    currH: number;
    currYaw: number;
    currPitch: number;
    targetX: number;
    targetY: number;
    targetW: number;
    targetH: number;
    targetYaw: number;
    targetPitch: number;
    isDetected: boolean;
  }>({
    currX: 0,
    currY: 0,
    currW: 0,
    currH: 0,
    currYaw: 0,
    currPitch: 0,
    targetX: 0,
    targetY: 0,
    targetW: 0,
    targetH: 0,
    targetYaw: 0,
    targetPitch: 0,
    isDetected: true
  });

  // Offscreen sampler for ultra-fast computer-vision analysis
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  // Drag-to-rotate interaction
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, startYaw: 0, startPitch: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startYaw: trackerRef.current.currYaw,
      startPitch: trackerRef.current.currPitch
    };
    setIsManualOverride(true);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // Convert pixel drag to radians (~-45° to +45°)
    const newYaw = Math.max(-0.75, Math.min(0.75, dragStartRef.current.startYaw + (dx / 120)));
    const newPitch = Math.max(-0.5, Math.min(0.5, dragStartRef.current.startPitch + (dy / 140)));

    trackerRef.current.targetYaw = newYaw;
    trackerRef.current.targetPitch = newPitch;
    setCurrentPose({
      yaw: Math.round((newYaw * 180) / Math.PI),
      pitch: Math.round((newPitch * 180) / Math.PI)
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Preset quick pose buttons
  const setQuickPose = (yawDeg: number, pitchDeg: number = 0) => {
    setIsManualOverride(true);
    const yawRad = (yawDeg * Math.PI) / 180;
    const pitchRad = (pitchDeg * Math.PI) / 180;
    trackerRef.current.targetYaw = yawRad;
    trackerRef.current.targetPitch = pitchRad;
    setCurrentPose({ yaw: yawDeg, pitch: pitchDeg });
  };

  const resetToAutoTrack = () => {
    setIsManualOverride(false);
    trackerRef.current.targetYaw = 0;
    trackerRef.current.targetPitch = 0;
    setCurrentPose({ yaw: 0, pitch: 0 });
  };

  // Sync with interactivePose prop if provided
  useEffect(() => {
    if (interactivePose.yaw !== 0 || interactivePose.pitch !== 0) {
      const yawRad = (interactivePose.yaw * Math.PI) / 180;
      const pitchRad = (interactivePose.pitch * Math.PI) / 180;
      trackerRef.current.targetYaw = yawRad;
      trackerRef.current.targetPitch = pitchRad;
    }
  }, [interactivePose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement('canvas');
      offscreenRef.current.width = 96;
      offscreenRef.current.height = 72;
    }
    const offscreen = offscreenRef.current;
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });

    let animationFrameId: number;
    let scanY = 0;
    let scanDirection = 1;
    let lastSampleTime = 0;

    // =========================================================================
    // 3D TOPOLOGICAL LANDMARKS DEFINITION WITH HEATMAP REGIONS
    // User Specification:
    // - Pua (Nose bridge & tip): Glowing red nodes (Red Heatmap cluster)
    // - Midomo (Lips): Crimson/Pink nodes
    // - Mashavu na Taya (Jawline): Electric Blue & Violet nodes
    // - Macho na Nyusi: Icy Cyan & White nodes
    // - Mapaji ya Uso: Amber / Orange nodes
    // =========================================================================
    const landmarks3D: Landmark3D[] = [
      // --- MAPAJI YA USO (Forehead: Golden Amber Nodes) ---
      { id: 0, x: -0.40, y: -0.42, z: -0.15, group: 'forehead', color: '#f97316', glowColor: 'rgba(249, 115, 22, 0.4)', size: 3.4 },
      { id: 1, x: -0.22, y: -0.45, z: -0.04, group: 'forehead', color: '#f97316', glowColor: 'rgba(249, 115, 22, 0.4)', size: 3.6 },
      { id: 2, x:  0.00, y: -0.46, z:  0.03, group: 'forehead', color: '#fbbf24', glowColor: 'rgba(251, 191, 36, 0.5)', size: 4.0 },
      { id: 3, x:  0.22, y: -0.45, z: -0.04, group: 'forehead', color: '#f97316', glowColor: 'rgba(249, 115, 22, 0.4)', size: 3.6 },
      { id: 4, x:  0.40, y: -0.42, z: -0.15, group: 'forehead', color: '#f97316', glowColor: 'rgba(249, 115, 22, 0.4)', size: 3.4 },

      { id: 5, x: -0.32, y: -0.32, z: -0.10, group: 'forehead', color: '#fb923c', glowColor: 'rgba(251, 146, 60, 0.4)', size: 3.2 },
      { id: 6, x: -0.15, y: -0.34, z:  0.02, group: 'forehead', color: '#fb923c', glowColor: 'rgba(251, 146, 60, 0.4)', size: 3.4 },
      { id: 7, x:  0.00, y: -0.35, z:  0.08, group: 'forehead', color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.5)', size: 3.8 },
      { id: 8, x:  0.15, y: -0.34, z:  0.02, group: 'forehead', color: '#fb923c', glowColor: 'rgba(251, 146, 60, 0.4)', size: 3.4 },
      { id: 9, x:  0.32, y: -0.32, z: -0.10, group: 'forehead', color: '#fb923c', glowColor: 'rgba(251, 146, 60, 0.4)', size: 3.2 },

      // --- NYUSI NA MACHO (Icy Cyan & White Nodes) ---
      // Left Eyebrow
      { id: 10, x: -0.38, y: -0.22, z: -0.08, group: 'eyes', color: '#ffffff', glowColor: 'rgba(255, 255, 255, 0.4)', size: 3.4 },
      { id: 11, x: -0.26, y: -0.24, z: -0.02, group: 'eyes', color: '#ffffff', glowColor: 'rgba(255, 255, 255, 0.4)', size: 3.5 },
      { id: 12, x: -0.14, y: -0.22, z:  0.04, group: 'eyes', color: '#ffffff', glowColor: 'rgba(255, 255, 255, 0.4)', size: 3.5 },
      // Right Eyebrow
      { id: 13, x:  0.14, y: -0.22, z:  0.04, group: 'eyes', color: '#ffffff', glowColor: 'rgba(255, 255, 255, 0.4)', size: 3.5 },
      { id: 14, x:  0.26, y: -0.24, z: -0.02, group: 'eyes', color: '#ffffff', glowColor: 'rgba(255, 255, 255, 0.4)', size: 3.5 },
      { id: 15, x:  0.38, y: -0.22, z: -0.08, group: 'eyes', color: '#ffffff', glowColor: 'rgba(255, 255, 255, 0.4)', size: 3.4 },

      // Left Eye
      { id: 16, x: -0.32, y: -0.14, z: -0.06, group: 'eyes', color: '#ffffff', glowColor: 'rgba(255, 255, 255, 0.4)', size: 3.6 },
      { id: 17, x: -0.23, y: -0.17, z: -0.03, group: 'eyes', color: '#ffffff', glowColor: 'rgba(255, 255, 255, 0.4)', size: 3.6 },
      { id: 18, x: -0.14, y: -0.14, z:  0.00, group: 'eyes', color: '#ffffff', glowColor: 'rgba(255, 255, 255, 0.4)', size: 3.6 },
      { id: 19, x: -0.23, y: -0.10, z: -0.03, group: 'eyes', color: '#ffffff', glowColor: 'rgba(255, 255, 255, 0.4)', size: 3.6 },
      { id: 20, x: -0.23, y: -0.135, z: -0.02, group: 'eyes', color: '#a5f3fc', glowColor: 'rgba(165, 243, 252, 0.8)', size: 4.2 }, // Left Pupil (Icy Cyan)

      // Right Eye
      { id: 21, x:  0.14, y: -0.14, z:  0.00, group: 'eyes', color: '#ffffff', glowColor: 'rgba(255, 255, 255, 0.4)', size: 3.6 },
      { id: 22, x:  0.23, y: -0.17, z: -0.03, group: 'eyes', color: '#ffffff', glowColor: 'rgba(255, 255, 255, 0.4)', size: 3.6 },
      { id: 23, x:  0.32, y: -0.14, z: -0.06, group: 'eyes', color: '#ffffff', glowColor: 'rgba(255, 255, 255, 0.4)', size: 3.6 },
      { id: 24, x:  0.23, y: -0.10, z: -0.03, group: 'eyes', color: '#ffffff', glowColor: 'rgba(255, 255, 255, 0.4)', size: 3.6 },
      { id: 25, x:  0.23, y: -0.135, z: -0.02, group: 'eyes', color: '#a5f3fc', glowColor: 'rgba(165, 243, 252, 0.8)', size: 4.2 }, // Right Pupil (Icy Cyan)

      // --- PUA (NOSE BRIDGE & TIP: Glowing Red Heatmap Cluster) ---
      { id: 26, x:  0.00, y: -0.16, z:  0.18, group: 'nose', color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.8)', size: 4.0 },
      { id: 27, x:  0.00, y: -0.08, z:  0.30, group: 'nose', color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.8)', size: 4.2 },
      { id: 28, x:  0.00, y:  0.00, z:  0.42, group: 'nose', color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.9)', size: 4.6 },
      { id: 29, x:  0.00, y:  0.07, z:  0.52, group: 'nose', color: '#b91c1c', glowColor: 'rgba(239, 68, 68, 1.0)', size: 5.2 }, // Nose Tip (Peak depth)
      { id: 30, x: -0.09, y:  0.07, z:  0.35, group: 'nose', color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.7)', size: 4.0 }, // Left wing
      { id: 31, x:  0.09, y:  0.07, z:  0.35, group: 'nose', color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.7)', size: 4.0 }, // Right wing
      { id: 32, x: -0.14, y:  0.09, z:  0.22, group: 'nose', color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.6)', size: 3.8 },
      { id: 33, x:  0.14, y:  0.09, z:  0.22, group: 'nose', color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.6)', size: 3.8 },

      // --- MIDOMO (LIPS: Crimson & Pink Nodes) ---
      { id: 34, x: -0.18, y:  0.19, z:  0.12, group: 'mouth', color: '#f43f5e', glowColor: 'rgba(244, 63, 94, 0.7)', size: 3.8 }, // Left Corner
      { id: 35, x: -0.09, y:  0.18, z:  0.22, group: 'mouth', color: '#f43f5e', glowColor: 'rgba(244, 63, 94, 0.7)', size: 4.0 },
      { id: 36, x:  0.00, y:  0.17, z:  0.28, group: 'mouth', color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.9)', size: 4.6 }, // Cupid's bow center (Red)
      { id: 37, x:  0.09, y:  0.18, z:  0.22, group: 'mouth', color: '#f43f5e', glowColor: 'rgba(244, 63, 94, 0.7)', size: 4.0 },
      { id: 38, x:  0.18, y:  0.19, z:  0.12, group: 'mouth', color: '#f43f5e', glowColor: 'rgba(244, 63, 94, 0.7)', size: 3.8 }, // Right Corner
      // Lower Lip
      { id: 39, x: -0.12, y:  0.24, z:  0.18, group: 'mouth', color: '#fb7185', glowColor: 'rgba(251, 113, 133, 0.7)', size: 4.0 },
      { id: 40, x:  0.00, y:  0.26, z:  0.24, group: 'mouth', color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.9)', size: 4.4 }, // Center lower lip
      { id: 41, x:  0.12, y:  0.24, z:  0.18, group: 'mouth', color: '#fb7185', glowColor: 'rgba(251, 113, 133, 0.7)', size: 4.0 },

      // --- MASHAVU (CHEEKS: Electric Blue Nodes) ---
      { id: 42, x: -0.42, y: -0.04, z: -0.18, group: 'cheeks', color: '#3b82f6', glowColor: 'rgba(59, 130, 246, 0.7)', size: 4.2 },
      { id: 43, x:  0.42, y: -0.04, z: -0.18, group: 'cheeks', color: '#3b82f6', glowColor: 'rgba(59, 130, 246, 0.7)', size: 4.2 },
      { id: 44, x: -0.34, y:  0.06, z: -0.06, group: 'cheeks', color: '#3b82f6', glowColor: 'rgba(59, 130, 246, 0.7)', size: 4.2 },
      { id: 45, x:  0.34, y:  0.06, z: -0.06, group: 'cheeks', color: '#3b82f6', glowColor: 'rgba(59, 130, 246, 0.7)', size: 4.2 },
      { id: 46, x: -0.26, y:  0.13, z:  0.04, group: 'cheeks', color: '#60a5fa', glowColor: 'rgba(96, 165, 250, 0.7)', size: 3.8 },
      { id: 47, x:  0.26, y:  0.13, z:  0.04, group: 'cheeks', color: '#60a5fa', glowColor: 'rgba(96, 165, 250, 0.7)', size: 3.8 },

      // --- TAYA NA KIDEVU (JAWLINE & CHIN: Violet & Purple Nodes) ---
      { id: 48, x: -0.44, y:  0.12, z: -0.26, group: 'jaw', color: '#6366f1', glowColor: 'rgba(99, 102, 241, 0.7)', size: 4.0 },
      { id: 49, x:  0.44, y:  0.12, z: -0.26, group: 'jaw', color: '#6366f1', glowColor: 'rgba(99, 102, 241, 0.7)', size: 4.0 },
      { id: 50, x: -0.40, y:  0.24, z: -0.20, group: 'jaw', color: '#8b5cf6', glowColor: 'rgba(139, 92, 246, 0.7)', size: 4.0 },
      { id: 51, x:  0.40, y:  0.24, z: -0.20, group: 'jaw', color: '#8b5cf6', glowColor: 'rgba(139, 92, 246, 0.7)', size: 4.0 },
      { id: 52, x: -0.32, y:  0.34, z: -0.12, group: 'jaw', color: '#8b5cf6', glowColor: 'rgba(139, 92, 246, 0.7)', size: 4.0 },
      { id: 53, x:  0.32, y:  0.34, z: -0.12, group: 'jaw', color: '#8b5cf6', glowColor: 'rgba(139, 92, 246, 0.7)', size: 4.0 },
      { id: 54, x: -0.18, y:  0.42, z:  0.02, group: 'jaw', color: '#a855f7', glowColor: 'rgba(168, 85, 247, 0.8)', size: 4.2 },
      { id: 55, x:  0.18, y:  0.42, z:  0.02, group: 'jaw', color: '#a855f7', glowColor: 'rgba(168, 85, 247, 0.8)', size: 4.2 },
      { id: 56, x:  0.00, y:  0.42, z:  0.20, group: 'jaw', color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.9)', size: 4.8 }, // Chin apex (Gnathion - Red)
      { id: 57, x:  0.00, y:  0.49, z:  0.12, group: 'jaw', color: '#8b5cf6', glowColor: 'rgba(139, 92, 246, 0.8)', size: 4.2 }  // Menton
    ];

    // Anatomical 3D Wireframe Edges (Triangulated face mesh)
    const wireframeEdges: Array<[number, number]> = [
      // Forehead
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [1, 6], [2, 7], [3, 8], [4, 9],
      [5, 6], [6, 7], [7, 8], [8, 9],
      [5, 10], [6, 11], [7, 26], [8, 14], [9, 15],

      // Eyebrows & Eyes
      [10, 11], [11, 12], [12, 26], [13, 26], [13, 14], [14, 15],
      [10, 16], [11, 17], [12, 18], [13, 21], [14, 22], [15, 23],
      [16, 17], [17, 18], [18, 19], [19, 16], [17, 20], [19, 20], // Left Eye ring
      [21, 22], [22, 23], [23, 24], [24, 21], [22, 25], [24, 25], // Right Eye ring

      // Nose Dorsum & Wings
      [26, 27], [27, 28], [28, 29],
      [27, 30], [27, 31],
      [28, 30], [28, 31],
      [29, 30], [29, 31],
      [30, 32], [31, 33],
      [32, 34], [33, 38],
      [29, 36], // Nose tip to Cupid's bow

      // Cheeks
      [16, 42], [42, 44], [44, 46], [46, 34],
      [23, 43], [43, 45], [45, 47], [47, 38],
      [32, 46], [33, 47],
      [18, 27], [21, 27],

      // Lips
      [34, 35], [35, 36], [36, 37], [37, 38],
      [34, 39], [39, 40], [40, 41], [41, 38],
      [35, 39], [36, 40], [37, 41],

      // Jawline
      [42, 48], [48, 50], [50, 52], [52, 54], [54, 56],
      [43, 49], [49, 51], [51, 53], [53, 55], [55, 56],
      [54, 57], [55, 57], [56, 57],
      [40, 56], [39, 54], [41, 55],
      [46, 52], [47, 53]
    ];

    const render = () => {
      const now = performance.now();
      const width = canvas.width;
      const height = canvas.height;

      if (width === 0 || height === 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const tracker = trackerRef.current;

      // Default initialization on first frame
      if (tracker.currX === 0 && tracker.currY === 0) {
        tracker.currX = width * 0.5;
        tracker.currY = height * 0.46;
        tracker.currW = width * 0.58;
        tracker.currH = tracker.currW * 1.34;
        tracker.targetX = tracker.currX;
        tracker.targetY = tracker.currY;
        tracker.targetW = tracker.currW;
        tracker.targetH = tracker.currH;
      }

      // =========================================================================
      // REAL-TIME VIDEO VISION ANALYZER & HEAD POSE / YAW ESTIMATOR
      // Tracks face center and head rotation (e.g. user turning right or left)
      // =========================================================================
      const video = videoRef?.current;
      const hasActiveVideo = video && video.readyState >= 2 && !video.paused && !video.ended;

      if (hasActiveVideo && now - lastSampleTime > 40 && !isManualOverride) {
        lastSampleTime = now;
        const sw = offscreen.width;
        const sh = offscreen.height;

        try {
          if (offCtx) {
            offCtx.drawImage(video, 0, 0, sw, sh);
            const imgData = offCtx.getImageData(0, 0, sw, sh).data;

            let sumX = 0;
            let sumY = 0;
            let count = 0;
            let minX = sw;
            let maxX = 0;
            let minY = sh;
            let maxY = 0;

            // Skin chrominance blob detection in upper 85% of camera frame
            const maxSearchY = Math.floor(sh * 0.85);

            for (let y = 3; y < maxSearchY; y++) {
              for (let x = 3; x < sw - 3; x++) {
                const idx = (y * sw + x) * 4;
                const r = imgData[idx];
                const g = imgData[idx + 1];
                const b = imgData[idx + 2];

                // YCbCr skin tone transform
                const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
                const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

                if (cb >= 74 && cb <= 135 && cr >= 127 && cr <= 182 && r > 40 && g > 25 && b > 15 && r > b) {
                  sumX += x;
                  sumY += y;
                  count++;
                  if (x < minX) minX = x;
                  if (x > maxX) maxX = x;
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;
                }
              }
            }

            if (count > 60) {
              const avgX = sumX / count;
              const avgY = sumY / count;
              const clusterW = Math.max(20, maxX - minX);

              // Mirrored selfie camera calculation
              const normX = isMirrored ? (1 - avgX / sw) : (avgX / sw);
              const normY = avgY / sh;
              const normW = clusterW / sw;

              tracker.targetX = normX * width;
              tracker.targetY = normY * height;
              tracker.targetW = Math.max(width * 0.45, normW * width * 1.25);
              tracker.targetH = tracker.targetW * 1.34;
              tracker.isDetected = true;

              // =========================================================================
              // HEAD POSE (YAW / ROTATION) ESTIMATOR
              // Computes horizontal asymmetry between left and right halves of face
              // When user turns their head right: features shift towards that side
              // =========================================================================
              const midX = Math.floor((minX + maxX) / 2);
              let leftFeatureMass = 0;
              let rightFeatureMass = 0;

              for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                  const idx = (y * sw + x) * 4;
                  const r = imgData[idx];
                  const g = imgData[idx + 1];
                  const b = imgData[idx + 2];
                  // High-contrast facial landmarks (pupils, nostrils, lips) are darker/redder
                  const contrast = (255 - (r * 0.3 + g * 0.59 + b * 0.11)) + (r - g);
                  if (x < midX) {
                    leftFeatureMass += contrast;
                  } else {
                    rightFeatureMass += contrast;
                  }
                }
              }

              const totalMass = leftFeatureMass + rightFeatureMass;
              if (totalMass > 0) {
                // In mirrored mode: if user turns head to their right (right of screen in mirrored video)
                const asymmetry = (rightFeatureMass - leftFeatureMass) / totalMass;
                const detectedYaw = isMirrored ? -asymmetry * 1.2 : asymmetry * 1.2;
                tracker.targetYaw = Math.max(-0.65, Math.min(0.65, detectedYaw));
              }

              if (!faceDetected) setFaceDetected(true);
            } else {
              // No clear face found in camera view
              if (faceDetected) setFaceDetected(false);
            }
          }
        } catch (e) {
          // Camera feed initializing
        }
      }

      // Smooth EMA interpolation for 60fps tracking
      const lerp = 0.22;
      tracker.currX += (tracker.targetX - tracker.currX) * lerp;
      tracker.currY += (tracker.targetY - tracker.currY) * lerp;
      tracker.currW += (tracker.targetW - tracker.currW) * lerp;
      tracker.currH += (tracker.targetH - tracker.currH) * lerp;
      tracker.currYaw += (tracker.targetYaw - tracker.currYaw) * lerp;
      tracker.currPitch += (tracker.targetPitch - tracker.currPitch) * lerp;

      // Ensure face stays within comfortable canvas bounds
      const centerX = Math.max(tracker.currW * 0.48, Math.min(width - tracker.currW * 0.48, tracker.currX));
      const centerY = Math.max(tracker.currH * 0.48, Math.min(height - tracker.currH * 0.48, tracker.currY));
      const faceW = tracker.currW;
      const faceH = tracker.currH;
      const yaw = tracker.currYaw;
      const pitch = tracker.currPitch;

      ctx.clearRect(0, 0, width, height);

      // =========================================================================
      // 1. SCANNING LASER BAR
      // =========================================================================
      if (showScanLine && (status === 'SCANNING' || status === 'NO_FACE')) {
        scanY += 2.8 * scanDirection;
        const topLimit = centerY - faceH * 0.54;
        const bottomLimit = centerY + faceH * 0.54;
        if (scanY > bottomLimit) {
          scanY = bottomLimit;
          scanDirection = -1;
        } else if (scanY < topLimit) {
          scanY = topLimit;
          scanDirection = 1;
        }

        const laserGrad = ctx.createLinearGradient(centerX - faceW * 0.55, scanY, centerX + faceW * 0.55, scanY);
        laserGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        laserGrad.addColorStop(0.3, status === 'DETECTED_UNKNOWN' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(16, 185, 129, 0.8)');
        laserGrad.addColorStop(0.5, '#ffffff');
        laserGrad.addColorStop(0.7, status === 'DETECTED_UNKNOWN' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(16, 185, 129, 0.8)');
        laserGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.save();
        ctx.strokeStyle = laserGrad;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = status === 'DETECTED_UNKNOWN' ? '#ef4444' : '#10b981';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(centerX - faceW * 0.55, scanY);
        ctx.lineTo(centerX + faceW * 0.55, scanY);
        ctx.stroke();
        ctx.restore();
      }

      // =========================================================================
      // 2. CRISP WHITE BOUNDING BOX WITH CORNER ACCENTS
      // =========================================================================
      if (showBoundingBox) {
        const boxX = centerX - faceW * 0.54;
        const boxY = centerY - faceH * 0.55;
        const boxW = faceW * 1.08;
        const boxH = faceH * 1.12;

        ctx.save();
        ctx.lineWidth = 2;

        if (status === 'DETECTED_KNOWN') {
          ctx.strokeStyle = '#10b981';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 14;
        } else if (status === 'DETECTED_UNKNOWN') {
          ctx.strokeStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 14;
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.shadowColor = 'rgba(255, 255, 255, 0.45)';
          ctx.shadowBlur = 8;
        }

        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Corner bracket accents (L-shaped corners)
        const cornerLen = 18;
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = status === 'DETECTED_UNKNOWN' ? '#ef4444' : '#10b981';

        // Top-Left
        ctx.beginPath();
        ctx.moveTo(boxX - 2, boxY + cornerLen);
        ctx.lineTo(boxX - 2, boxY - 2);
        ctx.lineTo(boxX + cornerLen, boxY - 2);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - cornerLen, boxY - 2);
        ctx.lineTo(boxX + boxW + 2, boxY - 2);
        ctx.lineTo(boxX + boxW + 2, boxY + cornerLen);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(boxX - 2, boxY + boxH - cornerLen);
        ctx.lineTo(boxX - 2, boxY + boxH + 2);
        ctx.lineTo(boxX + cornerLen, boxY + boxH + 2);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - cornerLen, boxY + boxH + 2);
        ctx.lineTo(boxX + boxW + 2, boxY + boxH + 2);
        ctx.lineTo(boxX + boxW + 2, boxY + boxH - cornerLen);
        ctx.stroke();

        // Real-Time Angle & 3D Sensor Tag
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(boxX, boxY - 22, 190, 18);
        ctx.strokeStyle = status === 'DETECTED_UNKNOWN' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY - 22, 190, 18);

        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillStyle = status === 'DETECTED_UNKNOWN' ? '#ef4444' : '#38bdf8';
        const yawDegrees = Math.round((yaw * 180) / Math.PI);
        const dirLabel = yawDegrees > 5 ? 'KULIA ➡️' : yawDegrees < -5 ? 'KUSHOTO ⬅️' : 'MBELE ⏺️';
        ctx.fillText(`3D YAW: ${yawDegrees > 0 ? '+' : ''}${yawDegrees}° (${dirLabel})`, boxX + 6, boxY - 9);

        ctx.restore();
      }

      // =========================================================================
      // 3. 3D FACIAL GEOMETRIC ROTATION & PERSPECTIVE PROJECTION
      // Rotates every landmark in 3D around Y (Yaw) and X (Pitch)
      // When person turns right (yaw > 0):
      // - Nose tip (z > 0) projects rightward!
      // - Right cheek rotates back in depth (foreshortened)
      // - Left cheek rotates forward toward camera
      // =========================================================================
      const cosYaw = Math.cos(yaw);
      const sinYaw = Math.sin(yaw);
      const cosPitch = Math.cos(pitch);
      const sinPitch = Math.sin(pitch);
      const perspectiveDist = 3.2; // Virtual camera distance

      const projectedPoints: Array<{
        x: number;
        y: number;
        z: number;
        color: string;
        glowColor: string;
        size: number;
        group: string;
      }> = landmarks3D.map(p => {
        // Step 1: Rotate around Y-axis (Yaw: Turning Left/Right)
        const x1 = p.x * cosYaw + p.z * sinYaw;
        const y1 = p.y;
        const z1 = -p.x * sinYaw + p.z * cosYaw;

        // Step 2: Rotate around X-axis (Pitch: Looking Up/Down)
        const x2 = x1;
        const y2 = y1 * cosPitch - z1 * sinPitch;
        const z2 = y1 * sinPitch + z1 * cosPitch;

        // Step 3: Realistic Perspective Division
        const scale = perspectiveDist / (perspectiveDist - z2 * 0.45);

        return {
          x: centerX + x2 * faceW * scale,
          y: centerY + y2 * faceH * scale,
          z: z2,
          color: p.color,
          glowColor: p.glowColor,
          size: p.size * Math.max(0.75, Math.min(1.35, scale)),
          group: p.group
        };
      });

      // =========================================================================
      // 4. DRAW 3D TOPOLOGICAL WIREFRAME EDGES (Triangulated geometric mesh)
      // =========================================================================
      if (showWireframe) {
        ctx.save();
        ctx.strokeStyle = status === 'DETECTED_UNKNOWN' 
          ? 'rgba(239, 68, 68, 0.45)' 
          : 'rgba(226, 232, 240, 0.48)';
        ctx.lineWidth = 1.0;

        for (const [idx1, idx2] of wireframeEdges) {
          const pt1 = projectedPoints[idx1];
          const pt2 = projectedPoints[idx2];
          if (!pt1 || !pt2) continue;

          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // =========================================================================
      // 5. DRAW HEATMAP LANDMARK NODES WITH DYNAMIC GLOW
      // Pua (Nose): Glowing Red Heatmap
      // Midomo (Lips): Crimson/Pink
      // Mashavu na Taya (Jaw): Electric Blue & Violet
      // Macho na Nyusi: Icy Cyan & White
      // =========================================================================
      if (showLandmarkNodes) {
        ctx.save();
        // Sort by depth (z-buffer) so closer points render in front
        const sortedIndices = projectedPoints
          .map((pt, i) => ({ pt, i }))
          .sort((a, b) => a.pt.z - b.pt.z);

        for (const { pt } of sortedIndices) {
          // Node Outer Heatmap Halo
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size * 1.6, 0, Math.PI * 2);
          ctx.fillStyle = pt.glowColor;
          ctx.fill();

          // Node Core
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fillStyle = pt.color;
          ctx.fill();

          // Specular Glint on Nose and Eyes
          if (pt.group === 'nose' || pt.group === 'eyes') {
            ctx.beginPath();
            ctx.arc(pt.x - pt.size * 0.25, pt.y - pt.size * 0.25, pt.size * 0.35, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // =========================================================================
      // 6. VERIFICATION STATUS BADGE
      // =========================================================================
      if (status === 'DETECTED_KNOWN' && userName) {
        ctx.save();
        const badgeW = 220;
        const badgeH = 34;
        const badgeX = centerX - badgeW / 2;
        const badgeY = centerY + faceH * 0.58;

        ctx.fillStyle = 'rgba(6, 78, 59, 0.94)';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(`✓ ${userName}`, centerX, badgeY + 16);

        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#6ee7b7';
        ctx.fillText(`MATCH: ${confidenceScore}% • 3D POSE: VERIFIED`, centerX, badgeY + 28);
        ctx.restore();
      } else if (status === 'DETECTED_UNKNOWN') {
        ctx.save();
        const badgeW = 230;
        const badgeH = 34;
        const badgeX = centerX - badgeW / 2;
        const badgeY = centerY + faceH * 0.58;

        ctx.fillStyle = 'rgba(127, 29, 29, 0.94)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(`⚠️ USO HAUPO KWENYE MFUMO`, centerX, badgeY + 16);

        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#fca5a5';
        ctx.fillText(`UNREGISTERED FACE • ENROLL REQUIRED`, centerX, badgeY + 28);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    status,
    showBoundingBox,
    showScanLine,
    showLandmarkNodes,
    showWireframe,
    confidenceScore,
    userName,
    videoRef,
    isMirrored,
    isManualOverride,
    faceDetected
  ]);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`absolute inset-0 w-full h-full select-none cursor-grab active:cursor-grabbing ${className}`}
      title="Buruza kuzungusha uso au bonyeza vitufe vya pembe (Drag to rotate 3D face mesh)"
    >
      <canvas
        ref={canvasRef}
        width={360}
        height={480}
        className="w-full h-full object-cover"
      />

      {/* Real-time Angle & Tracking HUD */}
      <div className="absolute top-2 right-2 z-30 pointer-events-none">
        <div className="px-2 py-1 rounded-md bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[10px] font-mono flex items-center gap-1.5 shadow-lg">
          <span className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className={faceDetected ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {faceDetected ? `3D TRACKING (${currentPose.yaw > 0 ? `KULIA +${currentPose.yaw}°` : currentPose.yaw < 0 ? `KUSHOTO ${currentPose.yaw}°` : 'MBELE 0°'})` : 'SEEKING FACE'}
          </span>
        </div>
      </div>

      {/* Interactive 3D Head Rotation Quick-Pose Controls */}
      {enablePoseControls && (
        <div className="absolute bottom-2 left-2 right-2 z-30 flex items-center justify-between gap-1 p-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 pointer-events-auto">
          <span className="text-[10px] font-mono text-slate-400 px-1 font-semibold hidden sm:inline">
            Jaribu Pembe:
          </span>
          <div className="flex items-center gap-1 w-full sm:w-auto justify-center">
            <button
              type="button"
              onClick={() => setQuickPose(-25, 0)}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-cyan-300 active:scale-95 transition-all"
              title="Geuka Kushoto"
            >
              ⬅️ Kushoto (-25°)
            </button>
            <button
              type="button"
              onClick={resetToAutoTrack}
              className="px-2 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-[10px] font-mono text-emerald-300 font-bold active:scale-95 transition-all"
              title="Mbele / Auto Camera Tracking"
            >
              ⏺️ Mbele (Auto)
            </button>
            <button
              type="button"
              onClick={() => setQuickPose(25, 0)}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-cyan-300 active:scale-95 transition-all"
              title="Geuka Kulia"
            >
              Kulia (+25°) ➡️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
