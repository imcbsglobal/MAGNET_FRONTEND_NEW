import React, { useEffect, useRef, useState } from 'react';
import './PhotoCropEditor.scss';

/**
 * Compact-modal circular photo crop editor with pan, zoom, and touch gestures.
 * Opens with the full image visible; user zooms/pans to frame the desired crop.
 */
const PhotoCropEditor = ({
  isOpen,
  imageData,
  onCropConfirm,
  onCancel,
  onReset
}) => {
  const containerRef     = useRef(null);
  const imageRef         = useRef(null);
  const previewCanvasRef = useRef(null);
  const wrapperRef       = useRef(null);

  const [state, setState] = useState({
    panX: 0,
    panY: 0,
    zoom: 1,
    minZoom: 1,
    rotation: 0,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    dragStartPan: { x: 0, y: 0 },
    lastTouchDistance: 0,
    imageWidth: 0,
    imageHeight: 0
  });

  // Circle occupies 82 % of the container side (matches SCSS .crop-circle-frame width: 82%)
  const CIRCLE_PCT = 0.82;

  // ── Compute fit-zoom so the full image is visible on open ──────────────
  const computeFitZoom = (imgW, imgH) => {
    const containerSize = containerRef.current?.offsetWidth || 400;
    // Scale so the image fills the container (contain-style)
    const scale = Math.min(containerSize / imgW, containerSize / imgH);
    return scale;
  };

  // Reset & draw preview whenever a new image is loaded
  useEffect(() => {
    if (imageData && isOpen) {
      const img = new Image();
      img.onload = () => {
        // Wait one frame so containerRef has its rendered size
        requestAnimationFrame(() => {
          const fitZoom = computeFitZoom(img.width, img.height);
          setState(prev => ({
            ...prev,
            imageWidth:  img.width,
            imageHeight: img.height,
            panX: 0,
            panY: 0,
            zoom:    fitZoom,
            minZoom: fitZoom
          }));
        });
      };
      img.src = imageData;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageData, isOpen]);

  // ── Draw the hidden preview canvas (used for the final crop blob) ──────
  const drawPreview = () => {
    if (!previewCanvasRef.current || !imageData) return;

    const canvas = previewCanvasRef.current;
    const ctx    = canvas.getContext('2d');
    const img    = new Image();

    img.onload = () => {
      canvas.width  = 200;
      canvas.height = 200;

      ctx.beginPath();
      ctx.arc(100, 100, 100, 0, Math.PI * 2);
      ctx.clip();

      const containerSize = containerRef.current?.offsetWidth || 400;
      const circleRadius  = (containerSize * CIRCLE_PCT) / 2;

      // Map the circle region back to image coordinates
      // Image is rendered at: center of container + pan, scaled by zoom
      // So image origin (top-left) in container space = center - (imgW/2)*zoom + panX
      const imgW = state.imageWidth;
      const imgH = state.imageHeight;
      const renderedW = imgW * state.zoom;
      const renderedH = imgH * state.zoom;

      // Top-left of rendered image in container coords
      const imgLeft = containerSize / 2 - renderedW / 2 + state.panX;
      const imgTop  = containerSize / 2 - renderedH / 2 + state.panY;

      // Circle bounds in container coords
      const circleLeft = containerSize / 2 - circleRadius;
      const circleTop  = containerSize / 2 - circleRadius;

      // Map circle bounds to image source coords
      const sx = (circleLeft - imgLeft) / state.zoom;
      const sy = (circleTop  - imgTop)  / state.zoom;
      const sw = (circleRadius * 2)     / state.zoom;
      const sh = (circleRadius * 2)     / state.zoom;

      // Clamp to image bounds
      const csx = Math.max(0, Math.min(sx, imgW - 1));
      const csy = Math.max(0, Math.min(sy, imgH - 1));
      const csw = Math.min(sw, imgW - csx);
      const csh = Math.min(sh, imgH - csy);

      if (csw > 0 && csh > 0) {
        ctx.drawImage(img, csx, csy, csw, csh, 0, 0, 200, 200);
      }
    };

    img.src = imageData;
  };

  useEffect(() => {
    if (isOpen) drawPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.panX, state.panY, state.zoom, state.rotation, state.imageWidth]);

  // ── Non-passive wheel listener ─────────────────────────────────────────
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || !isOpen) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, state.zoom, state.minZoom]);

  // ── Pointer / touch handlers ───────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (e.touches) {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        setState(prev => ({
          ...prev,
          isDragging: true,
          dragStart:    { x: t.clientX, y: t.clientY },
          dragStartPan: { x: prev.panX,  y: prev.panY }
        }));
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        setState(prev => ({
          ...prev,
          isDragging: true,
          lastTouchDistance: Math.sqrt(dx * dx + dy * dy)
        }));
      }
    } else {
      e.preventDefault();
      setState(prev => ({
        ...prev,
        isDragging: true,
        dragStart:    { x: e.clientX, y: e.clientY },
        dragStartPan: { x: prev.panX,  y: prev.panY }
      }));
    }
  };

  const handleMouseMove = (e) => {
    if (!state.isDragging) return;

    if (e.touches) {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        setState(prev => ({
          ...prev,
          panX: prev.dragStartPan.x + (t.clientX - prev.dragStart.x),
          panY: prev.dragStartPan.y + (t.clientY - prev.dragStart.y)
        }));
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (state.lastTouchDistance > 0) {
          const scale = distance / state.lastTouchDistance;
          setState(prev => ({
            ...prev,
            zoom: Math.max(prev.minZoom, Math.min(5, prev.zoom * scale)),
            lastTouchDistance: distance
          }));
        }
      }
    } else {
      setState(prev => ({
        ...prev,
        panX: prev.dragStartPan.x + (e.clientX - prev.dragStart.x),
        panY: prev.dragStartPan.y + (e.clientY - prev.dragStart.y)
      }));
    }
  };

  const handleMouseUp = () => {
    setState(prev => ({ ...prev, isDragging: false, lastTouchDistance: 0 }));
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    setState(prev => ({
      ...prev,
      zoom: Math.max(prev.minZoom, Math.min(5, prev.zoom * delta))
    }));
  };

  const handleReset = () => {
    setState(prev => ({ ...prev, panX: 0, panY: 0, zoom: prev.minZoom, rotation: 0 }));
    if (onReset) onReset();
  };

  const handleConfirm = () => {
    if (!previewCanvasRef.current) return;
    previewCanvasRef.current.toBlob((blob) => {
      onCropConfirm(blob);
    }, 'image/jpeg', 0.95);
  };

  if (!isOpen) return null;

  const zoomPct = Math.round((state.zoom / (state.minZoom || 1)) * 100);

  return (
    <div className="crop-editor-fullscreen" onClick={onCancel}>
      <div className="crop-editor-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Top: image + circle mask ── */}
        <div className="crop-editor-container" ref={containerRef}>
          {/* Dark overlay with circular cutout */}
          <svg
            className="crop-editor-circle-mask"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <mask id="cropCircleMask">
                <rect width="100" height="100" fill="white" />
                <circle cx="50" cy="50" r={CIRCLE_PCT * 50} fill="black" />
              </mask>
            </defs>
            <rect
              width="100"
              height="100"
              fill="rgba(0,0,0,0.6)"
              mask="url(#cropCircleMask)"
            />
          </svg>

          {/* Draggable image */}
          <div
            ref={wrapperRef}
            className="crop-image-wrapper"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            {imageData && (
              <img
                ref={imageRef}
                src={imageData}
                alt="Crop"
                className="crop-editor-image"
                style={{
                  width:  state.imageWidth  ? state.imageWidth  * state.zoom : 'auto',
                  height: state.imageHeight ? state.imageHeight * state.zoom : 'auto',
                  transform: `translate(${state.panX}px, ${state.panY}px) rotate(${state.rotation}deg)`,
                  cursor: state.isDragging ? 'grabbing' : 'grab'
                }}
                draggable="false"
              />
            )}
          </div>

          {/* Circle guide ring */}
          <div className="crop-circle-frame">
            <div className="crop-circle-label">Drag · Scroll to zoom · Pinch on mobile</div>
          </div>

          {/* Hidden canvas for final crop output */}
          <canvas ref={previewCanvasRef} className="crop-preview-canvas" />
        </div>

        {/* ── Bottom: controls ── */}
        <div className="crop-editor-controls">
          <button className="crop-btn crop-btn--secondary" onClick={onCancel}>
            ✕ Cancel
          </button>
          <button className="crop-btn crop-btn--secondary" onClick={handleReset}>
            ↺ Reset
          </button>
          <div className="crop-zoom-indicator">
            Zoom: {zoomPct}%
          </div>
          <button className="crop-btn crop-btn--primary" onClick={handleConfirm}>
            ✓ Crop &amp; Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoCropEditor;
