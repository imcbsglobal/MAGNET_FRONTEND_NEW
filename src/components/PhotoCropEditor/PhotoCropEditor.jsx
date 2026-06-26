import React, { useEffect, useRef, useState } from 'react';
import './PhotoCropEditor.scss';

/**
 * Circular photo crop editor.
 *
 * Props:
 *   isOpen           – show/hide
 *   imageData        – base64 data URL (new file picked; null when showing existing)
 *   existingPhotoUrl – remote URL of already-uploaded photo (shown via <img>, no CORS issue)
 *   onCropConfirm    – called with (croppedBlob, originalBlob)
 *   onCancel         – close without saving
 *
 * Behaviour:
 *   • If existingPhotoUrl is set (and no new file picked yet): the existing photo is shown
 *     via a regular <img> tag in the crop circle (no canvas needed, no CORS).
 *     "Change Photo" lets the user pick a new file to replace it.
 *   • Once a new file is picked, its data URL is used for both display and canvas crop.
 *   • "Crop & Upload" is disabled until a NEW file is selected (re-cropping an already
 *     uploaded R2 URL is not possible due to CORS canvas restrictions).
 */
const CIRCLE_PCT = 0.82;

const PhotoCropEditor = ({ isOpen, imageData, existingPhotoUrl, onCropConfirm, onCancel }) => {
  const containerRef     = useRef(null);
  const wrapperRef       = useRef(null);
  const previewCanvasRef = useRef(null);
  const changeInputRef   = useRef(null);

  // activeImage is always a data URL (new file) — never the remote URL
  const [activeImage, setActiveImage]   = useState(null);
  const [originalBlob, setOriginalBlob] = useState(null);
  const [imgW, setImgW]   = useState(0);
  const [imgH, setImgH]   = useState(0);
  const [pan,  setPan]    = useState({ x: 0, y: 0 });
  const [zoom, setZoom]   = useState(1);
  const [minZ, setMinZ]   = useState(1);

  const dragRef  = useRef({ on: false, sx: 0, sy: 0, spx: 0, spy: 0 });
  const pinchRef = useRef({ on: false, d: 0 });

  const getCsz = () => containerRef.current?.offsetWidth || 420;

  const applyImage = (dataUrl) => {
    const img = new Image();
    img.onload = () => {
      const csz = getCsz();
      const fit = Math.min(csz / img.width, csz / img.height);
      setImgW(img.width);
      setImgH(img.height);
      setPan({ x: 0, y: 0 });
      setZoom(fit);
      setMinZ(fit);
    };
    img.src = dataUrl;
  };

  // Reset when closed / re-opened
  useEffect(() => {
    if (isOpen) {
      if (imageData) {
        // Proxy succeeded — full crop enabled
        setActiveImage(imageData);
        setOriginalBlob(null);
        applyImage(imageData);
      } else {
        // No proxy data — show existing photo read-only
        setActiveImage(null);
        setOriginalBlob(null);
        setImgW(0); setImgH(0);
        setPan({ x: 0, y: 0 });
        setZoom(1); setMinZ(1);
      }
    } else {
      setActiveImage(null);
      setOriginalBlob(null);
      setImgW(0); setImgH(0);
      setPan({ x: 0, y: 0 });
      setZoom(1); setMinZ(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, imageData]);

  // Update canvas when pan/zoom/image changes (only for data URLs)
  useEffect(() => {
    if (!isOpen || !activeImage || !imgW) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const csz = getCsz();
      canvas.width = 400; canvas.height = 400;
      ctx.clearRect(0, 0, 400, 400);
      ctx.save();
      ctx.beginPath();
      ctx.arc(200, 200, 200, 0, Math.PI * 2);
      ctx.clip();
      const cr = (csz * CIRCLE_PCT) / 2;
      const rW = imgW * zoom, rH = imgH * zoom;
      const iL = csz / 2 - rW / 2 + pan.x;
      const iT = csz / 2 - rH / 2 + pan.y;
      const cL = csz / 2 - cr, cT = csz / 2 - cr;
      const sx = (cL - iL) / zoom, sy = (cT - iT) / zoom;
      const sw = (cr * 2) / zoom,  sh = (cr * 2) / zoom;
      const csx = Math.max(0, Math.min(sx, imgW - 1));
      const csy = Math.max(0, Math.min(sy, imgH - 1));
      const csw = Math.min(sw, imgW - csx);
      const csh = Math.min(sh, imgH - csy);
      if (csw > 0 && csh > 0) ctx.drawImage(img, csx, csy, csw, csh, 0, 0, 400, 400);
      ctx.restore();
    };
    img.src = activeImage;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pan.x, pan.y, zoom, imgW, activeImage, isOpen]);

  // Wheel zoom (new file only)
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || !isOpen || !activeImage) return;
    const fn = (e) => {
      e.preventDefault();
      setZoom(z => Math.max(minZ, Math.min(5, z * (e.deltaY > 0 ? 0.92 : 1.08))));
    };
    el.addEventListener('wheel', fn, { passive: false });
    return () => el.removeEventListener('wheel', fn);
  }, [isOpen, minZ, activeImage]);

  // Drag (new file only)
  const down = (e) => {
    if (!activeImage) return;
    if (e.touches) {
      if (e.touches.length === 1)
        dragRef.current = { on: true, sx: e.touches[0].clientX, sy: e.touches[0].clientY, spx: pan.x, spy: pan.y };
      else if (e.touches.length === 2)
        pinchRef.current = { on: true, d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY) };
    } else {
      e.preventDefault();
      dragRef.current = { on: true, sx: e.clientX, sy: e.clientY, spx: pan.x, spy: pan.y };
    }
  };
  const move = (e) => {
    if (e.touches) {
      if (e.touches.length === 1 && dragRef.current.on)
        setPan({ x: dragRef.current.spx + e.touches[0].clientX - dragRef.current.sx, y: dragRef.current.spy + e.touches[0].clientY - dragRef.current.sy });
      else if (e.touches.length === 2 && pinchRef.current.on) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        if (pinchRef.current.d > 0) setZoom(z => Math.max(minZ, Math.min(5, z * d / pinchRef.current.d)));
        pinchRef.current.d = d;
      }
    } else if (dragRef.current.on) {
      setPan({ x: dragRef.current.spx + e.clientX - dragRef.current.sx, y: dragRef.current.spy + e.clientY - dragRef.current.sy });
    }
  };
  const up = () => { dragRef.current.on = false; pinchRef.current.on = false; };

  const handleConfirm = () => {
    previewCanvasRef.current?.toBlob(
      (blob) => onCropConfirm(blob, originalBlob || null),
      'image/jpeg', 0.95
    );
  };

  const handleChangePhotoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setOriginalBlob(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setActiveImage(ev.target.result);
      applyImage(ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleReset = () => { setPan({ x: 0, y: 0 }); setZoom(minZ); };
  const zoomPct = minZ > 0 ? Math.round((zoom / minZ) * 100) : 100;

  // Are we showing the existing remote photo (no canvas) or a new data URL?
  const showingExisting = !activeImage && !!existingPhotoUrl;
  const hasNewFile      = !!activeImage;
  // imageData from proxy = existing photo as data URL (full crop enabled)
  const proxyLoaded     = !!imageData && activeImage === imageData && !originalBlob;

  if (!isOpen) return null;

  return (
    <div className="crop-editor-fullscreen" onClick={onCancel}>
      <div className="crop-editor-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="crop-editor-header">
          <span className="crop-editor-title">
            {showingExisting ? '⚠ Photo preview — pick a new one to crop' : 'Adjust Photo'}
          </span>
          <button className="crop-change-photo-btn" onClick={() => changeInputRef.current?.click()}>
            📷 {showingExisting ? 'Change Photo' : 'Pick Different'}
          </button>
          <input ref={changeInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleChangePhotoFile} />
        </div>

        {/* Crop area */}
        <div className="crop-editor-container" ref={containerRef}>
          <svg className="crop-editor-circle-mask" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <mask id="cropCircleMask">
                <rect width="100" height="100" fill="white" />
                <circle cx="50" cy="50" r={CIRCLE_PCT * 50} fill="black" />
              </mask>
            </defs>
            <rect width="100" height="100" fill="rgba(0,0,0,0.6)" mask="url(#cropCircleMask)" />
          </svg>

          <div
            ref={wrapperRef}
            className="crop-image-wrapper"
            onMouseDown={down}
            onMouseMove={move}
            onMouseUp={up}
            onMouseLeave={up}
            onTouchStart={down}
            onTouchMove={move}
            onTouchEnd={up}
          >
            {showingExisting ? (
              /* Existing photo — shown via <img> tag, no CORS issues.
                 Drag/crop disabled; user must pick a new photo. */
              <img
                src={existingPhotoUrl}
                alt="Current photo"
                className="crop-editor-image crop-editor-image--existing"
                draggable="false"
              />
            ) : hasNewFile ? (
              /* New file picked OR proxy data URL — fully adjustable */
              <img
                src={activeImage}
                alt="Photo"
                className="crop-editor-image"
                style={{
                  width:     imgW ? imgW * zoom : 'auto',
                  height:    imgH ? imgH * zoom : 'auto',
                  transform: `translate(${pan.x}px, ${pan.y}px)`,
                  cursor:    dragRef.current.on ? 'grabbing' : 'grab',
                }}
                draggable="false"
              />
            ) : (
              <div className="crop-editor-empty">
                <span>📷</span>
                <p>Click "Change Photo" to select an image</p>
              </div>
            )}
          </div>

          <div className="crop-circle-frame">
            {showingExisting && (
              <div className="crop-circle-label crop-circle-label--warn">
                Photo shown for reference · Click "Change Photo" to replace
              </div>
            )}
            {hasNewFile && (
              <div className="crop-circle-label">Drag · Scroll to zoom · Pinch on mobile</div>
            )}
          </div>

          <canvas ref={previewCanvasRef} className="crop-preview-canvas" />
        </div>

        {/* Controls */}
        <div className="crop-editor-controls">
          <button className="crop-btn crop-btn--secondary" onClick={onCancel}>✕ Cancel</button>
          <button className="crop-btn crop-btn--secondary" onClick={handleReset} disabled={!hasNewFile}>↺ Reset</button>
          <div className="crop-zoom-indicator">Zoom: {zoomPct}%</div>
          <button
            className="crop-btn crop-btn--primary"
            onClick={handleConfirm}
            disabled={!hasNewFile}
            title={!hasNewFile ? 'Select a new photo first' : ''}
          >
            ✓ Crop &amp; Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoCropEditor;
