import React, { useEffect, useRef, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import {
  fetchIDCardStudents, fetchIDCardSchoolInfo,
  updateIDCardSubmission, uploadStudentPhoto,
} from '../../services/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './IDCard.scss';
import './IDCardTemplate.scss';

// ── ID Card Template (front) ──────────────────────────────────────────────────
const IDCardFront = ({ student, school, photoUrl }) => {
  const d = student?.details || {};
  const address = [d.place, d.district, d.city, d.state, d.pin].filter(Boolean).join(', ');

  return (
    <div className="idt-card idt-front">
      {/* White top strip: logo left, address box right */}
      <div className="idt-top-strip">
        <div className="idt-logo-area">
          {school?.logo_url
            ? <img src={school.logo_url} alt="logo" className="idt-logo" />
            : <div className="idt-logo-placeholder">🏫</div>}
          <div className="idt-school-name">{school?.school_name || 'School Name'}</div>
        </div>
        {school?.place && (
          <div className="idt-address-box">{school.place}</div>
        )}
      </div>

      {/* Purple/blue blob with photo */}
      <div className="idt-blob-area">
        <div className="idt-blob" />
        <div className="idt-photo-ring">
          {photoUrl
            ? <img src={photoUrl} alt="student" className="idt-photo" />
            : <div className="idt-photo-empty">📷</div>}
        </div>
      </div>

      {/* Student info */}
      <div className="idt-body">
        <div className="idt-student-name">
          {(d.student_name || student?.student_name || '').toUpperCase()}
        </div>
        <div className="idt-class">{student?.student_class} {student?.div}</div>

        <div className="idt-info-rows">
          <div className="idt-info-row">
            <span className="idt-info-label">Ad No</span>
            <span className="idt-info-sep">:</span>
            <span className="idt-info-val">{student?.admno}</span>
          </div>
          <div className="idt-info-row">
            <span className="idt-info-label">Phone</span>
            <span className="idt-info-sep">:</span>
            <span className="idt-info-val">{d.phone || student?.mobile || '-'}</span>
          </div>
          <div className="idt-info-row">
            <span className="idt-info-label">Address</span>
            <span className="idt-info-sep">:</span>
            <span className="idt-info-val">{address || ''}</span>
          </div>
        </div>

        {/* Diamond pattern strip */}
        <div className="idt-pattern" />
      </div>
    </div>
  );
};

// ── ID Card Template (back) ───────────────────────────────────────────────────
const IDCardBack = ({ school }) => (
  <div className="idt-card idt-back">
    {/* Two triangles top */}
    <div className="idt-back-top">
      <div className="idt-back-tri--purple" />
      <div className="idt-back-tri--blue" />
    </div>

    {/* Logo in white pill */}
    <div className="idt-back-logo-wrap">
      <div className="idt-back-logo-pill">
        {school?.logo_url
          ? <img src={school.logo_url} alt="logo" className="idt-back-logo" />
          : <div className="idt-back-logo-placeholder">🏫</div>}
      </div>
    </div>

    {/* Rules */}
    <div className="idt-back-rules">
      {[
        'This card is issued for the academic year 2025-26',
        'This card is non-transferable.',
        'Always carry your card during school hours.',
        'In case of loss, inform issuing authority.',
        'If found, please post it to given address',
      ].map((r, i) => (
        <p key={i}><span className="idt-bullet">●</span>{r}</p>
      ))}
    </div>

    {/* School info */}
    <div className="idt-back-school-info">
      <div className="idt-back-school-name">{school?.school_name || 'School Name'}</div>
      {school?.address && <div className="idt-back-affiliation">{school.address}</div>}
      {school?.place   && <div className="idt-back-detail"><span className="idt-back-detail-icon">📍</span>{school.place}</div>}
      {school?.phone   && <div className="idt-back-detail"><span className="idt-back-detail-icon">📞</span>{school.phone}</div>}
      {school?.email   && <div className="idt-back-detail"><span className="idt-back-detail-icon">✉️</span>{school.email}</div>}
    </div>
  </div>
);

// ── Edit fields ───────────────────────────────────────────────────────────────
const EDIT_FIELDS = [
  { name: 'student_name', label: 'Student Name',  type: 'text'  },
  { name: 'father_name',  label: 'Father Name',   type: 'text'  },
  { name: 'mother_name',  label: 'Mother Name',   type: 'text'  },
  { name: 'dob',          label: 'Date of Birth', type: 'date'  },
  { name: 'phone',        label: 'Phone',         type: 'tel'   },
  { name: 'email',        label: 'Email',         type: 'email' },
  { name: 'place',        label: 'Place',         type: 'text'  },
  { name: 'district',     label: 'District',      type: 'text'  },
  { name: 'city',         label: 'City',          type: 'text'  },
  { name: 'state',        label: 'State',         type: 'text'  },
  { name: 'pin',          label: 'PIN Code',      type: 'text'  },
];

// ── Main page ─────────────────────────────────────────────────────────────────
const IssueIDCard = () => {
  const institutionId    = localStorage.getItem('institutionId')    || '';
  const assignedClass    = localStorage.getItem('assignedClass')    || '';
  const assignedDivision = localStorage.getItem('assignedDivision') || '';

  const [students, setStudents]         = useState([]);
  const [school, setSchool]             = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState(null);   // student shown in preview
  const [editForm, setEditForm]         = useState({});
  const [saving, setSaving]             = useState(false);
  const [saveMsg, setSaveMsg]           = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const photoInputRef = useRef(null);
  const cardFrontRef = useRef(null);
  const cardBackRef = useRef(null);

  // Preload images for better PDF generation
  const preloadImages = async (element) => {
    const images = element.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = resolve;
          img.onerror = resolve; // Still resolve to not block the process
          // Set crossOrigin for external images
          if (img.src && !img.src.startsWith(window.location.origin)) {
            img.crossOrigin = 'anonymous';
          }
        }
      });
    });
    await Promise.all(imagePromises);
  };

  // Convert image URL to base64 data URL using multiple methods
  const imageToDataURL = async (url) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    
    console.log('Converting image to data URL:', url);
    
    // Method 1: Try with canvas and CORS
    try {
      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            console.log('Method 1 (CORS) success for:', url);
            resolve(dataURL);
          } catch (error) {
            console.warn('Method 1 (CORS) canvas failed:', error);
            reject(error);
          }
        };
        
        img.onerror = () => {
          console.warn('Method 1 (CORS) image load failed:', url);
          reject(new Error('Image load failed'));
        };
        
        img.src = url;
        
        // Timeout after 10 seconds
        setTimeout(() => {
          console.warn('Method 1 (CORS) timeout:', url);
          reject(new Error('Timeout'));
        }, 10000);
      });
    } catch (error) {
      console.log('Method 1 failed, trying Method 2...');
    }
    
    // Method 2: Try without CORS
    try {
      return await new Promise((resolve, reject) => {
        const img = new Image();
        // Don't set crossOrigin
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            console.log('Method 2 (no CORS) success for:', url);
            resolve(dataURL);
          } catch (error) {
            console.warn('Method 2 (no CORS) canvas failed:', error);
            reject(error);
          }
        };
        
        img.onerror = () => {
          console.warn('Method 2 (no CORS) image load failed:', url);
          reject(new Error('Image load failed'));
        };
        
        img.src = url;
        
        // Timeout after 10 seconds
        setTimeout(() => {
          console.warn('Method 2 (no CORS) timeout:', url);
          reject(new Error('Timeout'));
        }, 10000);
      });
    } catch (error) {
      console.log('Method 2 failed, trying Method 3...');
    }
    
    // Method 3: Try with fetch
    try {
      const response = await fetch(url, { mode: 'no-cors' });
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          console.log('Method 3 (fetch) success for:', url);
          resolve(reader.result);
        };
        reader.onerror = () => {
          console.warn('Method 3 (fetch) failed:', url);
          resolve(null);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('All methods failed for:', url, error);
      return null;
    }
  };

  // Fetch logo once and store as data URL so html2canvas never hits CORS
  const fetchLogoAsDataUrl = async (url) => {
    console.log('Fetching logo as data URL:', url);
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    try {
      const dataUrl = await imageToDataURL(url);
      console.log('Logo conversion result:', dataUrl ? 'SUCCESS' : 'FAILED');
      if (dataUrl) {
        console.log('Logo data URL length:', dataUrl.length);
      }
      return dataUrl;
    } catch (error) {
      console.error('Logo fetch error:', error);
      return null;
    }
  };

  // Preprocess images in the element to convert external URLs to data URLs
  const preprocessImages = async (element) => {
    const images = element.querySelectorAll('img');
    console.log(`Found ${images.length} images to preprocess`);
    
    const promises = Array.from(images).map(async (img, index) => {
      const originalSrc = img.src;
      console.log(`Processing image ${index + 1}: ${originalSrc}`);
      
      if (originalSrc && !originalSrc.startsWith('data:') && !originalSrc.startsWith(window.location.origin)) {
        try {
          console.log(`Converting external image to data URL: ${originalSrc}`);
          const dataUrl = await imageToDataURL(originalSrc);
          if (dataUrl) {
            img.src = dataUrl;
            console.log(`Successfully converted image ${index + 1} to data URL`);
          } else {
            console.warn(`Failed to convert image ${index + 1}, keeping original src`);
          }
        } catch (error) {
          console.warn(`Error preprocessing image ${index + 1}:`, originalSrc, error);
        }
      } else {
        console.log(`Image ${index + 1} is already local or data URL, skipping`);
      }
    });
    
    await Promise.all(promises);
    console.log('Image preprocessing completed');
  };

  // Debug function to test canvas creation
  const testCanvasCreation = async () => {
    if (!cardFrontRef.current) return;
    
    try {
      console.log('Testing canvas creation...');
      console.log('Element dimensions:', cardFrontRef.current.offsetWidth, 'x', cardFrontRef.current.offsetHeight);
      
      // Preprocess images first
      await preprocessImages(cardFrontRef.current);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const canvas = await html2canvas(cardFrontRef.current, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true,
        imageTimeout: 30000,
        onclone: (clonedDoc) => {
          const images = clonedDoc.querySelectorAll('img');
          images.forEach(img => {
            img.crossOrigin = 'anonymous';
            img.style.opacity = '1';
            img.style.visibility = 'visible';
          });
        }
      });
      
      console.log('Canvas created successfully:', canvas.width, 'x', canvas.height);
      
      // Use blob instead of toDataURL to avoid taint issues
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
      const dataUrl = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      
      console.log('Data URL length:', dataUrl.length);
      
      // Open canvas in new tab for debugging
      const newWindow = window.open();
      newWindow.document.write(`<img src="${dataUrl}" style="max-width: 100%; height: auto;" />`);
      
    } catch (err) {
      console.error('Canvas test failed:', err);
    }
  };

  const loadAll = async () => {
    if (!institutionId) { setError('Institution ID missing.'); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [studRes, schoolRes] = await Promise.all([
        fetchIDCardStudents(institutionId, assignedClass, assignedDivision),
        fetchIDCardSchoolInfo(institutionId),
      ]);
      const list = Array.isArray(studRes.data) ? studRes.data : [];
      setStudents(list);
      setSchool(schoolRes.data || null);
      // keep selected in sync
      if (selected) {
        const updated = list.find(s => s.admno === selected.admno);
        if (updated) { setSelected(updated); setEditForm({ ...updated.details }); }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [institutionId, assignedClass, assignedDivision]);

  const handleSelect = (student) => {
    setSelected(student);
    setEditForm({ ...(student.details || {}) });
    setSaveMsg('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!selected?.form_id) return;
    setSaving(true); setSaveMsg('');
    try {
      await updateIDCardSubmission(selected.form_id, editForm);
      setSaveMsg('✅ Details updated successfully.');
      await loadAll();
    } catch (err) {
      setSaveMsg('❌ ' + (err.response?.data?.message || 'Failed to save.'));
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    if (!file.type.startsWith('image/')) { setSaveMsg('❌ Only image files allowed.'); return; }
    if (file.size > 5 * 1024 * 1024) { setSaveMsg('❌ Photo must be under 5MB.'); return; }

    setUploadingPhoto(true); setSaveMsg('');
    const fd = new FormData();
    fd.append('institution_id', institutionId);
    fd.append('admno', selected.admno);
    fd.append('photo', file);
    try {
      await uploadStudentPhoto(fd);
      setSaveMsg('✅ Photo uploaded.');
      await loadAll();
    } catch (err) {
      setSaveMsg('❌ ' + (err.response?.data?.message || 'Upload failed.'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ─── PDF generation: render cards off-screen with base64 images, then html2canvas ───

  // Renders one student's cards into a hidden div, captures with html2canvas, adds to pdf
  const captureCardToPdf = async (pdf, student, school, logoB64, isFirst) => {
    console.log('captureCardToPdf called with:');
    console.log('- Student:', student?.student_name);
    console.log('- School:', school?.school_name);
    console.log('- Logo B64:', logoB64 ? 'PROVIDED' : 'NULL');
    console.log('- Logo B64 length:', logoB64?.length || 0);
    
    // 1. Fetch student photo as base64
    let photoB64 = student?.photo_url
      ? await imageToDataURL(student.photo_url).catch(() => null)
      : null;

    // 2. Build the card HTML string (mirrors IDCardFront + IDCardBack JSX exactly)
    const d = student?.details || {};
    const address = [d.place, d.district, d.city, d.state, d.pin].filter(Boolean).join(', ');
    const studentName = (d.student_name || student?.student_name || '').toUpperCase();

    const logoSrc  = logoB64 || (school?.logo_url && !school.logo_url.startsWith('http') ? school.logo_url : '');
    const photoSrc = photoB64 || '';

    console.log('Using logo src:', logoSrc ? 'DATA_URL' : 'PLACEHOLDER');
    console.log('Using photo src:', photoSrc ? 'DATA_URL' : 'PLACEHOLDER');

    const cardHTML = `
      <div style="display:flex;gap:24px;align-items:flex-start;background:#f0f0f0;padding:32px;width:fit-content;">

        <!-- FRONT -->
        <div style="
          width:280px;border-radius:16px;overflow:hidden;
          box-shadow:0 12px 40px rgba(15,23,42,0.22);
          font-family:'Segoe UI',Arial,sans-serif;background:#fff;
          position:relative;flex-shrink:0;
        ">
          <!-- Top strip -->
          <div style="display:flex;justify-content:space-between;align-items:center;
            background:#fff;padding:10px 12px 8px;min-height:68px;position:relative;z-index:3;">
            <div style="display:flex;align-items:center;gap:8px;">
              ${logoSrc
                ? `<img src="${logoSrc}" style="width:42px;height:42px;object-fit:contain;" crossorigin="anonymous"/>`
                : `<div style="width:42px;height:42px;background:#e2e8f0;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;">🏫</div>`}
              <div style="font-size:0.72rem;font-weight:800;color:#1b254b;text-transform:uppercase;
                letter-spacing:0.04em;line-height:1.3;max-width:100px;">
                ${school?.school_name || 'School Name'}
              </div>
            </div>
            ${school?.place ? `
              <div style="background:#2d3f7c;color:#fff;font-size:0.65rem;font-weight:600;
                padding:6px 10px;border-radius:6px;text-align:right;line-height:1.4;max-width:90px;">
                ${school.place}
              </div>` : ''}
          </div>

          <!-- Blob area -->
          <div style="position:relative;height:200px;overflow:hidden;margin-top:-2px;">
            <div style="
              position:absolute;top:-20px;left:-30px;width:240px;height:240px;
              background:linear-gradient(135deg,#5b3fa0 0%,#4a3494 25%,#3d2d8e 50%,#2d2d8e 75%,#2d3fa0 100%);
              border-radius:50% 60% 55% 45% / 50% 45% 60% 55%;z-index:1;
            "></div>
            <div style="
              width:130px;height:130px;border-radius:50%;border:3px solid #fff;
              box-shadow:0 4px 20px rgba(45,45,142,0.4);overflow:hidden;
              position:absolute;top:30px;left:50%;transform:translateX(-50%);
              background:linear-gradient(135deg,#5b3fa0 0%,#4a3494 25%,#3d2d8e 50%,#2d2d8e 75%,#2d3fa0 100%);
              z-index:2;display:flex;align-items:center;justify-content:center;
            ">
              ${photoSrc
                ? `<img src="${photoSrc}" style="width:100%;height:100%;object-fit:cover;" crossorigin="anonymous"/>`
                : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2.8rem;color:rgba(255,255,255,0.35);">📷</div>`}
            </div>
          </div>

          <!-- Body -->
          <div style="padding:12px 16px 16px;text-align:center;background:#fff;position:relative;z-index:2;">
            <div style="font-size:1.05rem;font-weight:900;color:#111827;letter-spacing:0.03em;
              margin-bottom:3px;text-transform:uppercase;">${studentName}</div>
            <div style="font-size:1rem;font-weight:700;color:#7c3aed;margin-bottom:12px;">
              ${student?.student_class || ''} ${student?.div || ''}
            </div>
            <div style="text-align:left;display:flex;flex-direction:column;gap:4px;padding:0 4px;">
              ${[
                ['Ad No',   student?.admno || ''],
                ['Phone',   d.phone || student?.mobile || '-'],
                ['Address', address],
              ].map(([label, val]) => `
                <div style="display:flex;gap:4px;font-size:0.76rem;align-items:flex-start;">
                  <span style="color:#2d3f7c;font-weight:700;min-width:54px;">${label}</span>
                  <span style="color:#64748b;flex-shrink:0;">:</span>
                  <span style="color:#1e293b;flex:1;line-height:1.4;">${val}</span>
                </div>`).join('')}
            </div>
            <!-- Diamond pattern -->
            <div style="
              position:relative;height:40px;margin-top:8px;
              background-image:
                repeating-linear-gradient(45deg,rgba(100,100,200,0.08) 0px,rgba(100,100,200,0.08) 1px,transparent 1px,transparent 12px),
                repeating-linear-gradient(-45deg,rgba(100,100,200,0.08) 0px,rgba(100,100,200,0.08) 1px,transparent 1px,transparent 12px);
            "></div>
          </div>
        </div>

        <!-- BACK -->
        <div style="
          width:280px;border-radius:16px;overflow:hidden;
          box-shadow:0 12px 40px rgba(15,23,42,0.22);
          font-family:'Segoe UI',Arial,sans-serif;
          background:linear-gradient(180deg,#dde4f0 0%,#eef1f8 40%,#f5f7fc 100%);
          min-height:420px;display:flex;flex-direction:column;
          position:relative;flex-shrink:0;
        ">
          <!-- Triangles -->
          <div style="position:relative;height:100px;flex-shrink:0;overflow:hidden;">
            <div style="position:absolute;top:0;left:0;width:0;height:0;
              border-right:140px solid transparent;border-top:100px solid #7c3aed;"></div>
            <div style="position:absolute;top:0;right:0;width:0;height:0;
              border-left:280px solid transparent;border-top:70px solid #2d3f7c;"></div>
          </div>

          <!-- Logo pill -->
          <div style="display:flex;justify-content:center;margin:-28px 0 16px;position:relative;z-index:2;">
            <div style="background:#fff;border-radius:20px;padding:10px 20px;
              box-shadow:0 4px 20px rgba(15,23,42,0.12);display:flex;align-items:center;justify-content:center;">
              ${logoSrc
                ? `<img src="${logoSrc}" style="width:110px;height:52px;object-fit:contain;" crossorigin="anonymous"/>`
                : `<div style="font-size:2rem;width:110px;text-align:center;">🏫</div>`}
            </div>
          </div>

          <!-- Rules -->
          <div style="padding:4px 18px 10px;display:flex;flex-direction:column;gap:6px;flex:1;">
            ${[
              'This card is issued for the academic year 2025-26',
              'This card is non-transferable.',
              'Always carry your card during school hours.',
              'In case of loss, inform issuing authority.',
              'If found, please post it to given address',
            ].map(r => `
              <p style="font-size:0.73rem;color:#334155;margin:0;display:flex;gap:8px;align-items:flex-start;line-height:1.4;">
                <span style="color:#2d3f7c;flex-shrink:0;font-size:0.6rem;margin-top:3px;">●</span>
                ${r}
              </p>`).join('')}
          </div>

          <!-- School info footer -->
          <div style="padding:12px 18px 18px;border-top:1px solid rgba(45,63,124,0.12);margin-top:4px;">
            <div style="font-size:0.9rem;font-weight:900;color:#1b254b;text-transform:uppercase;
              letter-spacing:0.04em;margin-bottom:2px;">${school?.school_name || ''}</div>
            ${school?.address ? `<div style="font-size:0.68rem;color:#475569;margin-bottom:8px;">${school.address}</div>` : ''}
            ${school?.place  ? `<div style="font-size:0.7rem;color:#334155;margin-bottom:3px;display:flex;gap:5px;">📍 ${school.place}</div>` : ''}
            ${school?.phone  ? `<div style="font-size:0.7rem;color:#334155;margin-bottom:3px;display:flex;gap:5px;">📞 ${school.phone}</div>` : ''}
            ${school?.email  ? `<div style="font-size:0.7rem;color:#334155;margin-bottom:3px;display:flex;gap:5px;">✉️ ${school.email}</div>` : ''}
          </div>
        </div>
      </div>
    `;

    // 3. Mount in a hidden off-screen container
    const container = document.createElement('div');
    container.style.cssText = `
      position:fixed;top:-9999px;left:-9999px;
      z-index:-1;pointer-events:none;opacity:1;
    `;
    container.innerHTML = cardHTML;
    document.body.appendChild(container);

    // 4. Wait for images to load
    const imgs = container.querySelectorAll('img');
    await Promise.all(Array.from(imgs).map(img =>
      new Promise(res => { if (img.complete) res(); else { img.onload = res; img.onerror = res; } })
    ));
    await new Promise(res => setTimeout(res, 200));

    // 5. Capture with html2canvas
    const canvas = await html2canvas(container.firstElementChild, {
      scale: 3,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#f0f0f0',
      logging: false,
    });

    document.body.removeChild(container);

    // 6. Add to PDF page
    if (!isFirst) pdf.addPage();
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW  = pageW - 20;
    const imgH  = (canvas.height / canvas.width) * imgW;
    const imgX  = 10;
    const imgY  = (pageH - imgH) / 2;
    pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', imgX, imgY, imgW, imgH);

    // Student info text below
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    const info = `${student?.student_name || ''} · Adm No: ${student?.admno || ''} · Class: ${student?.student_class || ''}-${student?.div || ''}`;
    pdf.text(info, pageW / 2, imgY + imgH + 8, { align: 'center' });
  };

  // Single student PDF download
  const handleDownloadPDF = async () => {
    if (!selected) return;
    setDownloadingPDF(true);
    setSaveMsg('');
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      // Fetch logo on-demand for PDF generation
      const logoDataUrl = school?.logo_url ? await fetchLogoAsDataUrl(school.logo_url) : null;
      await captureCardToPdf(pdf, selected, school, logoDataUrl, true);
      const fileName = `ID_Card_${(selected.student_name || selected.admno || 'student').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      pdf.save(fileName);
      setSaveMsg('✅ ID Card PDF downloaded successfully.');
    } catch (err) {
      console.error('PDF generation error:', err);
      setSaveMsg('❌ Failed to generate PDF: ' + err.message);
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Bulk PDF download
  const handleBulkDownloadPDF = async () => {
    const submittedStudents = filtered.filter(s => s.parent_submitted);
    if (submittedStudents.length === 0) return;
    setDownloadingPDF(true);
    setSaveMsg('');
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      // Fetch logo once for all students
      const logoDataUrl = school?.logo_url ? await fetchLogoAsDataUrl(school.logo_url) : null;
      for (let i = 0; i < submittedStudents.length; i++) {
        await captureCardToPdf(pdf, submittedStudents[i], school, logoDataUrl, i === 0);
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i + 1} of ${submittedStudents.length}`, pageW - 10, pageH - 5, { align: 'right' });
      }
      const fileName = `ID_Cards_Bulk_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      setSaveMsg(`✅ ${submittedStudents.length} ID Cards downloaded successfully.`);
    } catch (err) {
      console.error('Bulk PDF generation error:', err);
      setSaveMsg('❌ Failed to generate bulk PDF: ' + err.message);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const filtered = students.filter(s =>
    (s.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.admno        || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.mobile       || '').includes(search)
  );

  const statusBadge = (s) => {
    if (s.parent_submitted) return <span className="badge badge--green">Submitted</span>;
    return <span className="badge badge--gray">Pending</span>;
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="teacher" />
      <main className="dashboard-main">
        <Navbar />
        <div className="idcard-page">

          <div className="idcard-header">
            <div>
              <h1>Issue ID Card</h1>
              <p>Select a student to preview their ID card, upload photo, and edit details.</p>
            </div>
            <div className="idcard-header-actions">
              <button 
                type="button" 
                className="secondary-btn" 
                onClick={handleBulkDownloadPDF}
                disabled={downloadingPDF || filtered.filter(s => s.parent_submitted).length === 0}
              >
                {downloadingPDF ? '⏳ Generating...' : '📄 Download All PDFs'}
              </button>
              <button type="button" className="secondary-btn" onClick={loadAll} disabled={loading}>
                Refresh
              </button>
            </div>
          </div>

          {error && <div className="idcard-error">{error}</div>}

          <div className="issue-layout">
            {/* ── Left: student list ── */}
            <div className="issue-list-panel">
              <div className="idcard-search-bar">
                <input type="text" value={search} placeholder="Search student or adm no..."
                  onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="issue-list-card">
                <div className="issue-list-header">
                  <span className="issue-list-title">Students</span>
                  <span className="issue-list-count">{filtered.length}</span>
                </div>
                {loading ? (
                  <div className="idcard-empty">Loading...</div>
                ) : filtered.length === 0 ? (
                  <div className="idcard-empty">No students found.</div>
                ) : (
                  <div className="issue-student-list">
                    {filtered.map((s) => (
                      <div
                        key={s.admno}
                        className={`issue-student-row ${selected?.admno === s.admno ? 'issue-student-row--active' : ''}`}
                        onClick={() => handleSelect(s)}
                      >
                        <div className="issue-student-avatar">
                          {s.photo_url
                            ? <img src={s.photo_url} alt="" />
                            : (s.student_name?.charAt(0) || '?')}
                        </div>
                        <div className="issue-student-info">
                          <div className="issue-student-name">{s.student_name}</div>
                          <div className="issue-student-meta">{s.admno} · Cls {s.student_class}-{s.div}</div>
                        </div>
                        <div className="issue-student-actions">
                          {statusBadge(s)}
                          {s.parent_submitted && (
                            <button
                              type="button"
                              className="issue-download-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(s);
                                setTimeout(() => handleDownloadPDF(), 100);
                              }}
                              disabled={downloadingPDF}
                              title="Download PDF"
                            >
                              📄
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: preview + edit ── */}
            <div className="issue-preview-panel">
              {!selected ? (
                <div className="issue-no-selection">
                  <div style={{ fontSize: '3rem' }}>🪪</div>
                  <p>Select a student from the list to preview their ID card</p>
                </div>
              ) : (
                <>
                  {/* ID Card previews */}
                  <div className="idt-preview-row">
                    <div ref={cardFrontRef}>
                      <IDCardFront student={selected} school={school} photoUrl={selected.photo_url} />
                    </div>
                    <div ref={cardBackRef}>
                      <IDCardBack school={school} />
                    </div>
                  </div>

                  {/* Photo upload and PDF download */}
                  <div className="issue-photo-section">
                    <input type="file" ref={photoInputRef} accept="image/*"
                      onChange={handlePhotoChange} style={{ display: 'none' }} />
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? '⏳ Uploading...' : '📷 Upload Student Photo'}
                    </button>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={handleDownloadPDF}
                      disabled={downloadingPDF || !selected}
                      style={{ marginLeft: '12px' }}
                    >
                      {downloadingPDF ? '⏳ Generating PDF...' : '📄 Download PDF'}
                    </button>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={testCanvasCreation}
                      disabled={!selected}
                      style={{ marginLeft: '12px' }}
                    >
                      🔍 Test Canvas
                    </button>
                    <span className="issue-photo-hint">JPG / PNG · Max 5MB</span>
                  </div>

                  {saveMsg && (
                    <div className={`idcard-${saveMsg.startsWith('✅') ? 'status' : 'error'}`}>
                      {saveMsg}
                    </div>
                  )}

                  {/* Edit details */}
                  {selected.parent_submitted && (
                    <div className="idcard-edit-panel">
                      <h2>Edit Details — {selected.student_name}</h2>
                      <div className="idcard-edit-grid">
                        {EDIT_FIELDS.map(({ name, label, type }) => (
                          <div className="idcard-field" key={name}>
                            <label htmlFor={`ef-${name}`}>{label}</label>
                            <input
                              id={`ef-${name}`} type={type} name={name}
                              value={editForm[name] || ''} onChange={handleEditChange}
                              disabled={saving}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="idcard-edit-actions">
                        <button className="primary-btn" onClick={handleSave} disabled={saving}>
                          {saving ? 'Saving...' : '💾 Save Changes'}
                        </button>
                        <button className="secondary-btn" onClick={() => { setSelected(null); setSaveMsg(''); }}>
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IssueIDCard;