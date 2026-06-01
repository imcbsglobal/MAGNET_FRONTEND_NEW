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
    console.log('- Student photo URL:', student?.photo_url);
    console.log('- School logo URL:', school?.logo_url);
    
    // 1. Fetch student photo as base64 with better error handling
    let photoB64 = null;
    if (student?.photo_url) {
      try {
        console.log('Converting student photo to base64...');
        photoB64 = await imageToDataURL(student.photo_url);
        console.log('Student photo conversion:', photoB64 ? 'SUCCESS' : 'FAILED');
        if (photoB64) {
          console.log('Photo data URL length:', photoB64.length);
        }
      } catch (error) {
        console.warn('Failed to convert student photo:', error);
        photoB64 = null;
      }
    }

    // 2. Ensure school logo is also converted if not already provided
    let finalLogoB64 = logoB64;
    if (!finalLogoB64 && school?.logo_url) {
      try {
        console.log('Converting school logo to base64...');
        finalLogoB64 = await imageToDataURL(school.logo_url);
        console.log('School logo conversion:', finalLogoB64 ? 'SUCCESS' : 'FAILED');
        if (finalLogoB64) {
          console.log('Logo data URL length:', finalLogoB64.length);
        }
      } catch (error) {
        console.warn('Failed to convert school logo:', error);
        finalLogoB64 = null;
      }
    }

    // 3. Build the card HTML string (mirrors IDCardFront + IDCardBack JSX exactly)
    const d = student?.details || {};
    const address = [d.place, d.district, d.city, d.state, d.pin].filter(Boolean).join(', ');
    const studentName = (d.student_name || student?.student_name || '').toUpperCase();

    console.log('Final image sources for PDF:');
    console.log('- Logo B64:', finalLogoB64 ? 'AVAILABLE' : 'NULL');
    console.log('- Photo B64:', photoB64 ? 'AVAILABLE' : 'NULL');

    const cardHTML = `
      <div style="display:flex;gap:24px;align-items:flex-start;background:#e5e7eb;padding:32px;width:fit-content;">

        <!-- FRONT CARD -->
        <div style="
          width:320px;height:500px;border-radius:20px;overflow:hidden;
          box-shadow:0 8px 32px rgba(0,0,0,0.15);
          font-family:'Inter','Segoe UI',Arial,sans-serif;background:#ffffff;
          position:relative;flex-shrink:0;
        ">
          <!-- Top white section with logo and school name -->
          <div style="background:#ffffff;padding:16px 20px;display:flex;justify-content:space-between;align-items:flex-start;min-height:80px;">
            <div style="display:flex;align-items:center;gap:12px;flex:1;">
              ${finalLogoB64
                ? `<img src="${finalLogoB64}" style="width:48px;height:48px;object-fit:contain;border-radius:8px;" />`
                : `<div style="width:48px;height:48px;background:#3b82f6;border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;font-weight:bold;">🏫</div>`}
              <div style="font-size:14px;font-weight:800;color:#1f2937;text-transform:uppercase;letter-spacing:0.5px;line-height:1.2;max-width:140px;">
                ${school?.school_name || 'IMCB SOLUTIONS LLP'}
              </div>
            </div>
            ${school?.place ? `
              <div style="background:#3b4d7a;color:#ffffff;font-size:12px;font-weight:600;
                padding:8px 12px;border-radius:8px;text-align:center;min-width:80px;">
                ${school.place}
              </div>` : `
              <div style="background:#3b4d7a;color:#ffffff;font-size:12px;font-weight:600;
                padding:8px 12px;border-radius:8px;text-align:center;min-width:80px;">
                WAYANAD
              </div>`}
          </div>

          <!-- Purple blob section with photo -->
          <div style="position:relative;height:240px;background:linear-gradient(135deg, #7c3aed 0%, #5b21b6 50%, #3b4d7a 100%);overflow:hidden;">
            <!-- Organic blob shape -->
            <div style="
              position:absolute;top:-40px;left:-40px;width:280px;height:280px;
              background:linear-gradient(135deg, #7c3aed 0%, #5b21b6 50%, #3b4d7a 100%);
              border-radius:60% 40% 30% 70% / 60% 30% 70% 40%;
              transform:rotate(-15deg);
            "></div>
            
            <!-- Photo circle with white border -->
            <div style="
              position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);
              width:140px;height:140px;border-radius:50%;
              border:4px solid #ffffff;
              background:#ffffff;
              overflow:hidden;
              box-shadow:0 8px 32px rgba(0,0,0,0.2);
              z-index:10;
            ">
              ${photoB64
                ? `<img src="${photoB64}" style="width:100%;height:100%;object-fit:cover;" />`
                : `<div style="width:100%;height:100%;background:linear-gradient(135deg, #7c3aed 0%, #5b21b6 50%, #3b4d7a 100%);display:flex;align-items:center;justify-content:center;font-size:48px;color:rgba(255,255,255,0.4);">📷</div>`}
            </div>
          </div>

          <!-- Student info section -->
          <div style="padding:20px;text-align:center;background:#ffffff;">
            <div style="font-size:20px;font-weight:900;color:#1f2937;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">
              ${studentName}
            </div>
            <div style="font-size:18px;font-weight:700;color:#7c3aed;margin-bottom:16px;">
              ${student?.student_class || '1'}${student?.div || 'A'}
            </div>
            
            <!-- Info rows -->
            <div style="text-align:left;display:flex;flex-direction:column;gap:8px;">
              <div style="display:flex;align-items:flex-start;font-size:14px;">
                <span style="color:#374151;font-weight:700;min-width:70px;">Ad No</span>
                <span style="color:#6b7280;margin:0 8px;">:</span>
                <span style="color:#1f2937;font-weight:600;">${student?.admno || 'S/7058'}</span>
              </div>
              <div style="display:flex;align-items:flex-start;font-size:14px;">
                <span style="color:#374151;font-weight:700;min-width:70px;">Phone</span>
                <span style="color:#6b7280;margin:0 8px;">:</span>
                <span style="color:#1f2937;font-weight:600;">${d.phone || student?.mobile || '9061947005'}</span>
              </div>
              <div style="display:flex;align-items:flex-start;font-size:14px;">
                <span style="color:#374151;font-weight:700;min-width:70px;">Address</span>
                <span style="color:#6b7280;margin:0 8px;">:</span>
                <span style="color:#1f2937;font-weight:600;line-height:1.4;">${address || 'Wayanad, Wayanad, Kunhome, Kerala, 670731'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- BACK CARD -->
        <div style="
          width:320px;height:500px;border-radius:20px;overflow:hidden;
          box-shadow:0 8px 32px rgba(0,0,0,0.15);
          font-family:'Inter','Segoe UI',Arial,sans-serif;
          background:linear-gradient(135deg, #e5e7eb 0%, #f3f4f6 100%);
          position:relative;flex-shrink:0;
        ">
          <!-- Top triangular design -->
          <div style="position:relative;height:120px;overflow:hidden;">
            <!-- Purple triangle -->
            <div style="position:absolute;top:0;left:0;width:0;height:0;
              border-right:160px solid transparent;border-top:120px solid #7c3aed;"></div>
            <!-- Blue triangle -->
            <div style="position:absolute;top:0;right:0;width:0;height:0;
              border-left:320px solid transparent;border-top:80px solid #3b4d7a;"></div>
          </div>

          <!-- Logo in white pill -->
          <div style="display:flex;justify-content:center;margin:-40px 0 24px;position:relative;z-index:2;">
            <div style="background:#ffffff;border-radius:24px;padding:12px 24px;
              box-shadow:0 4px 20px rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center;min-height:60px;">
              ${finalLogoB64
                ? `<img src="${finalLogoB64}" style="height:36px;max-width:120px;object-fit:contain;" />`
                : `<div style="color:#3b82f6;font-size:24px;font-weight:bold;">🏫</div>`}
            </div>
          </div>

          <!-- Rules section -->
          <div style="padding:0 24px 16px;display:flex;flex-direction:column;gap:8px;">
            ${[
              'This card is issued for the academic year 2025-26',
              'This card is non-transferable.',
              'Always carry your card during school hours.',
              'In case of loss, inform issuing authority.',
              'If found, please post it to given address',
            ].map(rule => `
              <div style="display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#4b5563;line-height:1.4;">
                <span style="color:#7c3aed;font-weight:bold;margin-top:2px;">•</span>
                <span>${rule}</span>
              </div>`).join('')}
          </div>

          <!-- School info footer -->
          <div style="padding:16px 24px;margin-top:auto;border-top:1px solid rgba(107,114,128,0.2);">
            <div style="font-size:16px;font-weight:900;color:#1f2937;text-transform:uppercase;
              letter-spacing:0.5px;margin-bottom:4px;">${school?.school_name || 'IMCB SOLUTIONS LLP'}</div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:12px;">${school?.address || 'IMCB SOLUTIONS LLP'}</div>
            
            <div style="display:flex;flex-direction:column;gap:4px;">
              <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#4b5563;">
                <span style="color:#ef4444;">📍</span>
                <span>${school?.place || 'WAYANAD'}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#4b5563;">
                <span style="color:#ef4444;">📞</span>
                <span>${school?.phone || '9061947005'}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#4b5563;">
                <span style="color:#d1d5db;">✉️</span>
                <span>${school?.email || 'sajiththomas231@gmail.com'}</span>
              </div>
            </div>
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
    console.log(`Found ${imgs.length} images to load in PDF template`);
    
    await Promise.all(Array.from(imgs).map((img, index) =>
      new Promise(res => { 
        if (img.complete) {
          console.log(`Image ${index + 1} already loaded`);
          res(); 
        } else { 
          img.onload = () => {
            console.log(`Image ${index + 1} loaded successfully`);
            res();
          }; 
          img.onerror = () => {
            console.warn(`Image ${index + 1} failed to load`);
            res();
          }; 
        } 
      })
    ));
    
    // Extra wait to ensure rendering is complete
    await new Promise(res => setTimeout(res, 500));

    // 5. Capture with html2canvas
    const canvas = await html2canvas(container.firstElementChild, {
      scale: 2,
      useCORS: false, // Since we're using base64 data URLs, we don't need CORS
      allowTaint: true, // Allow tainted canvas since we're using data URLs
      backgroundColor: '#e5e7eb',
      logging: false,
      width: container.firstElementChild.scrollWidth,
      height: container.firstElementChild.scrollHeight,
      onclone: (clonedDoc) => {
        // Ensure all images are properly loaded in the cloned document
        const images = clonedDoc.querySelectorAll('img');
        images.forEach(img => {
          img.style.display = 'block';
          img.style.opacity = '1';
          img.style.visibility = 'visible';
        });
      }
    });

    document.body.removeChild(container);

    // 6. Add to PDF page
    if (!isFirst) pdf.addPage();
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    
    // Calculate dimensions to fit both cards side by side
    const imgW = Math.min(pageW - 20, (canvas.width / canvas.height) * (pageH - 40));
    const imgH = (canvas.height / canvas.width) * imgW;
    const imgX = (pageW - imgW) / 2;
    const imgY = (pageH - imgH) / 2;
    
    pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', imgX, imgY, imgW, imgH);

    // Student info text below
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(75, 85, 99);
    const info = `${student?.student_name || ''} • Adm No: ${student?.admno || ''} • Class: ${student?.student_class || ''}-${student?.div || ''}`;
    pdf.text(info, pageW / 2, imgY + imgH + 12, { align: 'center' });
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