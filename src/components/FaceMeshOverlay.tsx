import React, { useRef, useEffect } from 'react';

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
}

export const FaceMeshOverlay: React.FC<FaceMeshOverlayProps> = ({
  status,
  showBoundingBox = true,
  showScanLine = true,
  showLandmarkNodes = true,
  showWireframe = true,
  confidenceScore = 98.6,
  userName,
  className = '',
  interactivePose = { pitch: 0, yaw: 0, roll: 0 }
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let scanY = 0;
    let scanDirection = 1;
    let tick = 0;

    const render = () => {
      tick += 1;
      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Face center & bounds
      const centerX = width / 2 + interactivePose.yaw * 18;
      const centerY = height / 2 + interactivePose.pitch * 14;
      const faceW = Math.min(width, height) * 0.62;
      const faceH = faceW * 1.34;

      // Scanning laser bar
      if (showScanLine && (status === 'SCANNING' || status === 'NO_FACE')) {
        scanY += 2.2 * scanDirection;
        const topLimit = centerY - faceH * 0.58;
        const bottomLimit = centerY + faceH * 0.58;
        if (scanY > bottomLimit) {
          scanY = bottomLimit;
          scanDirection = -1;
        } else if (scanY < topLimit) {
          scanY = topLimit;
          scanDirection = 1;
        }

        const laserGrad = ctx.createLinearGradient(centerX - faceW * 0.55, scanY, centerX + faceW * 0.55, scanY);
        laserGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        laserGrad.addColorStop(0.3, status === 'DETECTED_UNKNOWN' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(16, 185, 129, 0.7)');
        laserGrad.addColorStop(0.5, '#ffffff');
        laserGrad.addColorStop(0.7, status === 'DETECTED_UNKNOWN' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(16, 185, 129, 0.7)');
        laserGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.save();
        ctx.strokeStyle = laserGrad;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = status === 'DETECTED_UNKNOWN' ? '#ef4444' : '#10b981';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(centerX - faceW * 0.56, scanY);
        ctx.lineTo(centerX + faceW * 0.56, scanY);
        ctx.stroke();
        ctx.restore();
      }

      // 1. Crisp White Bounding Box (Exact match to reference photos 2, 3, 4, 5)
      if (showBoundingBox) {
        const boxX = centerX - faceW * 0.54;
        const boxY = centerY - faceH * 0.55;
        const boxW = faceW * 1.08;
        const boxH = faceH * 1.12;

        ctx.save();
        ctx.lineWidth = 1.8;
        if (status === 'DETECTED_KNOWN') {
          ctx.strokeStyle = '#10b981'; // Green on verified
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 12;
        } else if (status === 'DETECTED_UNKNOWN') {
          ctx.strokeStyle = '#ef4444'; // Red on unknown
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 12;
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)'; // Crisp white default as in image
          ctx.shadowColor = 'rgba(255, 255, 255, 0.35)';
          ctx.shadowBlur = 6;
        }
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Corner bracket accents (like image 1)
        const cornerLen = 16;
        ctx.lineWidth = 3;
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
        ctx.restore();
      }

      // 2. Generate 3D Topological Facial Net Coordinates
      // Mathematical projection with perspective depth and breathing micro-pulse
      const pulse = Math.sin(tick * 0.05) * 1.5;
      const rx = faceW * 0.48;
      const ry = faceH * 0.49;

      // Grouped landmark points
      // Each point has { x, y, type: 'NOSE' | 'MOUTH' | 'JAW' | 'EYE' | 'FOREHEAD' }
      interface NodePoint {
        x: number;
        y: number;
        z: number;
        type: 'NOSE' | 'MOUTH' | 'JAW' | 'EYE' | 'FOREHEAD';
      }

      const points: NodePoint[] = [];

      // A. Forehead Nodes (Arch + Radial Star from center forehead)
      const foreheadCenter = { x: centerX, y: centerY - ry * 0.72 + pulse * 0.3, z: 0.8, type: 'FOREHEAD' as const };
      points.push(foreheadCenter);

      for (let i = -3; i <= 3; i++) {
        const u = i / 3.2;
        points.push({
          x: centerX + u * rx * 0.85,
          y: centerY - ry * 0.88 + Math.abs(u) * ry * 0.15,
          z: 0.6,
          type: 'FOREHEAD'
        });
      }

      for (let i = -4; i <= 4; i++) {
        const u = i / 4.2;
        points.push({
          x: centerX + u * rx * 0.92,
          y: centerY - ry * 0.62 + Math.abs(u) * ry * 0.12,
          z: 0.75,
          type: 'FOREHEAD'
        });
      }

      // B. Eyebrows & Eyes
      // Left Eye
      const leftEyeCenter = { x: centerX - rx * 0.45, y: centerY - ry * 0.28 };
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        points.push({
          x: leftEyeCenter.x + Math.cos(a) * rx * 0.22,
          y: leftEyeCenter.y + Math.sin(a) * ry * 0.11,
          z: 0.9,
          type: 'EYE'
        });
      }
      points.push({ x: leftEyeCenter.x, y: leftEyeCenter.y, z: 1.0, type: 'EYE' });

      // Right Eye
      const rightEyeCenter = { x: centerX + rx * 0.45, y: centerY - ry * 0.28 };
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        points.push({
          x: rightEyeCenter.x + Math.cos(a) * rx * 0.22,
          y: rightEyeCenter.y + Math.sin(a) * ry * 0.11,
          z: 0.9,
          type: 'EYE'
        });
      }
      points.push({ x: rightEyeCenter.x, y: rightEyeCenter.y, z: 1.0, type: 'EYE' });

      // Eye Brows
      for (let i = -2; i <= 2; i++) {
        points.push({
          x: leftEyeCenter.x + (i / 2) * rx * 0.28,
          y: leftEyeCenter.y - ry * 0.16 + (i === 0 ? -4 : 0),
          z: 0.95,
          type: 'EYE'
        });
        points.push({
          x: rightEyeCenter.x + (i / 2) * rx * 0.28,
          y: rightEyeCenter.y - ry * 0.16 + (i === 0 ? -4 : 0),
          z: 0.95,
          type: 'EYE'
        });
      }

      // C. Nose Bridge & Nose Heatmap Cluster (Vibrant Red Heatmap in reference images)
      // Vertical bridge
      for (let i = 0; i <= 4; i++) {
        const tVal = i / 4;
        points.push({
          x: centerX,
          y: centerY - ry * 0.25 + tVal * ry * 0.35,
          z: 1.3,
          type: 'NOSE'
        });
      }

      // Dense Nose Tip & Wings cluster (Red Heatmap!)
      const noseTipY = centerY + ry * 0.14;
      const noseTipNodes = [
        { x: centerX, y: noseTipY, z: 1.4 },
        { x: centerX - rx * 0.14, y: noseTipY - 2, z: 1.3 },
        { x: centerX + rx * 0.14, y: noseTipY - 2, z: 1.3 },
        { x: centerX - rx * 0.24, y: noseTipY + 6, z: 1.15 },
        { x: centerX + rx * 0.24, y: noseTipY + 6, z: 1.15 },
        { x: centerX - rx * 0.12, y: noseTipY + 9, z: 1.25 },
        { x: centerX + rx * 0.12, y: noseTipY + 9, z: 1.25 },
        { x: centerX, y: noseTipY + 11, z: 1.3 },
        { x: centerX - rx * 0.08, y: noseTipY + 4, z: 1.35 },
        { x: centerX + rx * 0.08, y: noseTipY + 4, z: 1.35 },
      ];
      noseTipNodes.forEach(n => points.push({ ...n, type: 'NOSE' }));

      // D. Mouth & Lips Cluster (Crimson / Pink cluster)
      const mouthY = centerY + ry * 0.42;
      const lipPoints = [
        // Upper lip
        { x: centerX - rx * 0.32, y: mouthY, z: 1.0 },
        { x: centerX - rx * 0.16, y: mouthY - 7, z: 1.1 },
        { x: centerX, y: mouthY - 5, z: 1.15 },
        { x: centerX + rx * 0.16, y: mouthY - 7, z: 1.1 },
        { x: centerX + rx * 0.32, y: mouthY, z: 1.0 },
        // Lower lip
        { x: centerX - rx * 0.24, y: mouthY + 12, z: 1.05 },
        { x: centerX, y: mouthY + 16, z: 1.1 },
        { x: centerX + rx * 0.24, y: mouthY + 12, z: 1.05 },
        // Inner line
        { x: centerX - rx * 0.16, y: mouthY + 3, z: 1.05 },
        { x: centerX, y: mouthY + 4, z: 1.1 },
        { x: centerX + rx * 0.16, y: mouthY + 3, z: 1.05 },
      ];
      lipPoints.forEach(p => points.push({ ...p, type: 'MOUTH' }));

      // E. Cheeks & Mid-face Triangulation (Blue & Violet Nodes)
      for (let r = 1; r <= 3; r++) {
        const sideDist = rx * (0.35 + r * 0.18);
        points.push({ x: centerX - sideDist, y: centerY - ry * 0.05 + r * 8, z: 0.85, type: 'JAW' });
        points.push({ x: centerX + sideDist, y: centerY - ry * 0.05 + r * 8, z: 0.85, type: 'JAW' });
        points.push({ x: centerX - sideDist * 0.88, y: centerY + ry * 0.16 + r * 8, z: 0.9, type: 'JAW' });
        points.push({ x: centerX + sideDist * 0.88, y: centerY + ry * 0.16 + r * 8, z: 0.9, type: 'JAW' });
      }

      // F. Jawline & Chin Contour (Vibrant Blue & Violet Nodes)
      const jawSteps = 13;
      for (let i = 0; i <= jawSteps; i++) {
        const tVal = (i / jawSteps) * Math.PI; // 0 to PI
        const jx = centerX - Math.cos(tVal) * rx * 0.98;
        const jy = centerY - ry * 0.05 + Math.sin(tVal) * ry * 1.02;
        points.push({
          x: jx,
          y: jy,
          z: 0.7,
          type: 'JAW'
        });
      }

      // Chin center nodes
      points.push({ x: centerX, y: centerY + ry * 0.76, z: 1.0, type: 'MOUTH' });
      points.push({ x: centerX - rx * 0.12, y: centerY + ry * 0.82, z: 0.95, type: 'JAW' });
      points.push({ x: centerX + rx * 0.12, y: centerY + ry * 0.82, z: 0.95, type: 'JAW' });
      points.push({ x: centerX, y: centerY + ry * 0.92, z: 0.9, type: 'JAW' });

      // 3. Draw Connecting Triangular Wireframe Mesh
      if (showWireframe) {
        ctx.save();
        ctx.lineWidth = 0.85;

        // Determine line stroke color based on status
        if (status === 'DETECTED_KNOWN') {
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)'; // Emerald when verified
        } else if (status === 'DETECTED_UNKNOWN') {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)'; // Amber/red when unknown
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)'; // Translucent white/cyan as in reference image
        }

        // Connect nearby points to form the dense 3D wireframe
        const maxDist = rx * 0.38;
        const pLen = points.length;

        for (let i = 0; i < pLen; i++) {
          const p1 = points[i];
          let connections = 0;
          for (let j = i + 1; j < pLen; j++) {
            const p2 = points[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxDist && connections < 5) {
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
              connections++;
            }
          }
        }

        // Radial lines from forehead center (characteristic in image 1)
        points.forEach((p) => {
          if (p.type === 'FOREHEAD' || (p.type === 'EYE' && Math.abs(p.x - centerX) < rx * 0.5)) {
            const dx = p.x - foreheadCenter.x;
            const dy = p.y - foreheadCenter.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < rx * 0.8 && dist > 10) {
              ctx.beginPath();
              ctx.moveTo(foreheadCenter.x, foreheadCenter.y);
              ctx.lineTo(p.x, p.y);
              ctx.stroke();
            }
          }
        });

        ctx.restore();
      }

      // 4. Draw Glowing Landmark Nodes (Heatmap Colors from Reference Images)
      if (showLandmarkNodes) {
        points.forEach((p) => {
          let nodeColor = '#ffffff';
          let glowColor = 'rgba(255, 255, 255, 0.5)';
          let radius = 2.4;

          if (status === 'DETECTED_KNOWN') {
            nodeColor = '#10b981';
            glowColor = 'rgba(16, 185, 129, 0.7)';
            radius = 2.6;
          } else if (status === 'DETECTED_UNKNOWN') {
            nodeColor = '#ef4444';
            glowColor = 'rgba(239, 68, 68, 0.7)';
            radius = 2.6;
          } else {
            // Authentic multi-color gradient nodes exactly as uploaded images 2, 4, 5:
            switch (p.type) {
              case 'NOSE':
                // Bright red / crimson nose heatmap
                nodeColor = '#ef4444';
                glowColor = 'rgba(239, 68, 68, 0.85)';
                radius = 3.2;
                break;
              case 'MOUTH':
                // Red / pink lips cluster
                nodeColor = '#f43f5e';
                glowColor = 'rgba(244, 63, 94, 0.8)';
                radius = 2.8;
                break;
              case 'JAW':
                // Vibrant blue and violet jawline
                nodeColor = p.y > centerY + ry * 0.5 ? '#8b5cf6' : '#3b82f6';
                glowColor = 'rgba(59, 130, 246, 0.8)';
                radius = 2.7;
                break;
              case 'EYE':
                // White / icy cyan eye sockets and brows
                nodeColor = '#ffffff';
                glowColor = 'rgba(165, 243, 252, 0.8)';
                radius = 2.5;
                break;
              case 'FOREHEAD':
                // Coral / orange forehead nodes
                nodeColor = '#fb923c';
                glowColor = 'rgba(251, 146, 60, 0.75)';
                radius = 2.5;
                break;
            }
          }

          ctx.save();
          ctx.fillStyle = nodeColor;
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // 5. HUD Status Badges (Top & Bottom Markers like in Reference Photo 1)
      ctx.save();
      ctx.font = 'bold 9px monospace';

      // Top Diagnostic Banner
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(centerX - 90, centerY - faceH * 0.55 - 24, 180, 20);
      ctx.strokeStyle = status === 'DETECTED_KNOWN' ? '#10b981' : (status === 'DETECTED_UNKNOWN' ? '#ef4444' : 'rgba(255, 255, 255, 0.4)');
      ctx.lineWidth = 1;
      ctx.strokeRect(centerX - 90, centerY - faceH * 0.55 - 24, 180, 20);

      ctx.fillStyle = status === 'DETECTED_KNOWN' ? '#34d399' : (status === 'DETECTED_UNKNOWN' ? '#f87171' : '#38bdf8');
      ctx.textAlign = 'center';
      const statusText = status === 'DETECTED_KNOWN' 
        ? `USO UMETAMBULIWA • ${confidenceScore}%`
        : (status === 'DETECTED_UNKNOWN' 
            ? 'USO HAUPO KWENYE MFUMO' 
            : '3D FACE MESH • 468 NODES');
      ctx.fillText(statusText, centerX, centerY - faceH * 0.55 - 10);

      // Bottom User name or action hint
      if (status === 'DETECTED_KNOWN' && userName) {
        ctx.fillStyle = 'rgba(6, 78, 59, 0.9)';
        ctx.fillRect(centerX - 80, centerY + faceH * 0.55 + 6, 160, 20);
        ctx.strokeStyle = '#10b981';
        ctx.strokeRect(centerX - 80, centerY + faceH * 0.55 + 6, 160, 20);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(userName.toUpperCase(), centerX, centerY + faceH * 0.55 + 20);
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    // Initialize dimensions
    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener('resize', resize);

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [status, showBoundingBox, showScanLine, showLandmarkNodes, showWireframe, confidenceScore, userName, interactivePose]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none z-20 ${className}`}
    />
  );
};
