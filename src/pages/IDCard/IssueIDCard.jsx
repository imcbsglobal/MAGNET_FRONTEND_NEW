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

// ── Utility Functions ────────────────────────────────────────────────────────
const generateInitialsPhoto = (studentName) => {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  
  const initials = (studentName || 'ST')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
  
  const colors = [
    ['#7c3aed', '#5b21b6'], ['#2563eb', '#1d4ed8'], ['#059669', '#047857'],
    ['#dc2626', '#b91c1c'], ['#d97706', '#b45309'], ['#7c2d12', '#92400e']
  ];
  
  const colorIndex = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % colors.length;
  const [color1, color2] = colors[colorIndex];
  
  const gradient = ctx.createRadialGradient(100, 100, 0, 100, 100, 100);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(100, 100, 95, 0, 2 * Math.PI);
  ctx.fill();
  
  ctx.fillStyle = 'white';
  ctx.font = 'bold 60px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 4;
  ctx.fillText(initials, 100, 100);
  
  return canvas.toDataURL('image/png', 1.0);
};

// ── ID Card Template (front) ──────────────────────────────────────────────────
const IDCardFront = ({ student, school, photoUrl }) => {
  const d = student?.details || {};
  const address = [d.house_name, d.place, d.city, d.pin].filter(Boolean).join(', ');

  return (
    <div className="idt-card idt-front">
      <div className="idt-grid-pattern" />
      
      {/* Header: logo + school name left, badge right */}
      <div className="idt-header">
        <div className="idt-header-left">
          <div className="idt-logo-area">
            {school?.logo_url
              ? <img src={school.logo_url} alt="logo" className="idt-logo" />
              : <div className="idt-logo-placeholder">🏫</div>}
            <div className="idt-school-name">{school?.school_name || 'School Name'}</div>
          </div>
        </div>
        <div className="idt-header-right">
          {school?.place && (
            <div className="idt-place-badge">{school.place}</div>
          )}
        </div>
      </div>

      {/* Photo section with curve */}
      <div className="idt-photo-area">
        <div className="idt-purple-curve" />
        <div className="idt-photo-circle">
          {photoUrl
            ? <img src={photoUrl} alt="student" className="idt-photo" />
            : <img 
                src={generateInitialsPhoto(d.student_name || student?.student_name)} 
                alt="student" 
                className="idt-photo" 
              />}
        </div>
      </div>

      {/* Student info */}
      <div className="idt-body">
        <div className="idt-student-name">
          {(d.student_name || student?.student_name || '').toUpperCase()}
        </div>
        <div className="idt-class">
          {(student?.student_class || '')} {(student?.div || '')}
        </div>

        <div className="idt-info-table">
          <div className="idt-info-row">
            <span className="idt-info-label">Ad No</span>
            <span className="idt-info-sep">:</span>
            <span className="idt-info-val">{(student?.admno || '').toUpperCase()}</span>
          </div>
          <div className="idt-info-row">
            <span className="idt-info-label">Phone</span>
            <span className="idt-info-sep">:</span>
            <span className="idt-info-val">{(d.phone || student?.mobile || '-').toUpperCase()}</span>
          </div>
          <div className="idt-info-row">
            <span className="idt-info-label">Address</span>
            <span className="idt-info-sep">:</span>
            <span className="idt-info-val">{(address || '').toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── ID Card Template (back) ───────────────────────────────────────────────────
const IDCardBack = ({ school }) => (
  <div className="idt-card idt-back">
    {/* Curves at top */}
    <div className="idt-back-header">
      <div className="idt-back-curve-purple" />
      <div className="idt-back-curve-navy" />
    </div>

    {/* Logo in white pill */}
    <div className="idt-back-logo-container">
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
        <div key={i} className="idt-rule-item">
          <span className="idt-bullet">•</span>
          <span className="idt-rule-text">{r}</span>
        </div>
      ))}
    </div>

    {/* School info footer */}
    <div className="idt-back-footer">
      <div className="idt-back-school-name">{school?.school_name || 'School Name'}</div>
      <div className="idt-back-sub-name">{school?.school_name || 'School Name'}</div>
      
      <div className="idt-back-contact">
        {school?.place && (
          <div className="idt-contact-row">
            <span className="idt-contact-icon">📍</span>
            <span className="idt-contact-val">{school.place.toUpperCase()}</span>
          </div>
        )}
        {school?.phone && (
          <div className="idt-contact-row">
            <span className="idt-contact-icon">📞</span>
            <span className="idt-contact-val">{school.phone.toUpperCase()}</span>
          </div>
        )}
        {school?.email && (
          <div className="idt-contact-row">
            <span className="idt-contact-icon">✉️</span>
            <span className="idt-contact-val">{school.email}</span>
          </div>
        )}
      </div>
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
  { name: 'house_name',   label: 'House Name',    type: 'text'  },
  { name: 'place',        label: 'Place',         type: 'text'  },
  { name: 'city',         label: 'City',          type: 'text'  },
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

  // ROBUST IMAGE EMBEDDING - Use canvas + no-cors as primary method
  const embedImageDirectly = async (url) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url; // Already base64
    
    console.log('🖼️ Embedding image from URL:', url);
    
    // CRITICAL: Use canvas method with no-cors mode - most reliable for external images
    try {
      console.log('  Method: Canvas + no-cors (most reliable)');
      const img = new Image();
      
      const dataUrl = await new Promise((resolve) => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.naturalWidth || img.width || 400;
            canvas.height = img.naturalHeight || img.height || 400;
            
            // Draw image on canvas
            ctx.drawImage(img, 0, 0);
            const result = canvas.toDataURL('image/png', 1.0);
            console.log('  ✅ Canvas conversion successful -', canvas.width, 'x', canvas.height);
            resolve(result);
          } catch (canvasError) {
            console.log('  ❌ Canvas drawing error:', canvasError.message);
            resolve(null);
          }
        };
        
        img.onerror = () => {
          console.log('  ❌ Image failed to load from:', url);
          resolve(null);
        };
        
        // Set crossOrigin to 'anonymous' BEFORE src
        img.crossOrigin = 'anonymous';
        img.src = url;
        
        // Timeout: 15 seconds
        setTimeout(() => {
          console.log('  ⏰ Image load timeout (15s)');
          resolve(null);
        }, 15000);
      });
      
      if (dataUrl && dataUrl.length > 1000) {
        console.log('  ✅ Image embedded successfully, size:', dataUrl.length, 'bytes');
        return dataUrl;
      }
    } catch (error) {
      console.log('  ❌ Canvas method error:', error.message);
    }
    
    // Method 2: Direct fetch with blob conversion (better for CORS)
    try {
      console.log('  Method 2: Direct fetch with blob');
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          console.log('  ✅ Fetch+blob successful, size:', reader.result.length);
          resolve(reader.result);
        };
        reader.onerror = () => {
          console.log('  ❌ FileReader error');
          resolve(null);
        };
        reader.readAsDataURL(blob);
      });
      
      if (dataUrl) return dataUrl;
    } catch (error) {
      console.log('  ❌ Fetch method error:', error.message);
    }
    
    // Method 3: Proxy for stubborn URLs
    try {
      console.log('  Method 3: CORS proxy');
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (response.ok) {
        const blob = await response.blob();
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            console.log('  ✅ Proxy successful, size:', reader.result.length);
            resolve(reader.result);
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
        if (dataUrl) return dataUrl;
      }
    } catch (error) {
      console.log('  ❌ Proxy error:', error.message);
    }
    
    console.log('🚫 All embedding methods failed for:', url);
    return null;
  };

  // IMAGE VALIDATION AND DEBUGGING
  const validateAndDebugImage = async (url, type = 'unknown') => {
    console.log(`🔍 Validating ${type} image:`, url);
    
    if (!url) {
      console.log(`❌ ${type} image URL is empty`);
      return { valid: false, reason: 'Empty URL' };
    }
    
    if (url.startsWith('data:')) {
      console.log(`✅ ${type} image is already base64`);
      return { valid: true, reason: 'Base64 data URL' };
    }
    
    try {
      // Test if URL is accessible
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      console.log(`📡 ${type} image HEAD request status:`, response.status || 'no-cors');
      
      // Test image loading with longer timeout
      const img = new Image();
      const loadTest = await new Promise((resolve) => {
        img.onload = () => {
          console.log(`✅ ${type} image loads successfully:`, img.width, 'x', img.height);
          resolve({ valid: true, width: img.width, height: img.height });
        };
        img.onerror = () => {
          console.log(`❌ ${type} image failed to load`);
          resolve({ valid: false, reason: 'Image load error' });
        };
        img.crossOrigin = 'anonymous';
        img.src = url;
        
        // Longer timeout to allow image loading from slow servers
        setTimeout(() => {
          console.log(`⏰ ${type} image load timeout (10s)`);
          resolve({ valid: false, reason: 'Load timeout' });
        }, 10000);
      });
      
      return loadTest;
    } catch (error) {
      console.log(`❌ ${type} image validation error:`, error.message);
      return { valid: false, reason: error.message };
    }
  };

  // Perfect fallback images matching the ID card design
  const getDefaultLogoB64 = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      
      // Draw blue rounded rectangle background (matching the reference logo style)
      const gradient = ctx.createLinearGradient(0, 0, 120, 120);
      gradient.addColorStop(0, '#2563eb');
      gradient.addColorStop(1, '#1d4ed8');
      ctx.fillStyle = gradient;
      
      // Draw rounded rectangle
      const drawRoundedRect = (x, y, width, height, radius) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      };
      
      drawRoundedRect(15, 15, 90, 90, 12);
      ctx.fill();
      
      // Add subtle inner shadow effect
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      
      // Draw school building icon in white
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'transparent';
      
      // Building base
      drawRoundedRect(35, 65, 50, 25, 3);
      ctx.fill();
      
      // Building roof (triangle)
      ctx.beginPath();
      ctx.moveTo(30, 65);
      ctx.lineTo(60, 45);
      ctx.lineTo(90, 65);
      ctx.closePath();
      ctx.fill();
      
      // Door
      ctx.fillStyle = '#2563eb';
      drawRoundedRect(55, 75, 10, 15, 2);
      ctx.fill();
      
      // Windows
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(40, 70, 6, 6);
      ctx.fillRect(74, 70, 6, 6);
      
      // Add text below
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SCHOOL', 60, 100);
      
      const result = canvas.toDataURL('image/png', 1.0);
      console.log('✅ Default logo generated, length:', result.length);
      return result;
    } catch (err) {
      console.error('❌ Failed to generate default logo:', err);
      return null;
    }
  };

  // Generate personalized profile picture with student initials
  const getPersonalizedPhotoB64 = (studentName) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      
      // Get initials from student name
      const initials = (studentName || 'ST')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
      
      // Create gradient background with colors based on initials
      const colors = [
        ['#7c3aed', '#5b21b6'], // Purple
        ['#2563eb', '#1d4ed8'], // Blue  
        ['#059669', '#047857'], // Green
        ['#dc2626', '#b91c1c'], // Red
        ['#d97706', '#b45309'], // Orange
        ['#7c2d12', '#92400e'], // Brown
      ];
      
      const colorIndex = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % colors.length;
      const [color1, color2] = colors[colorIndex];
      
      const gradient = ctx.createRadialGradient(100, 100, 0, 100, 100, 100);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(100, 100, 95, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add subtle inner glow
      const innerGlow = ctx.createRadialGradient(100, 100, 0, 100, 100, 70);
      innerGlow.addColorStop(0, 'rgba(255,255,255,0.2)');
      innerGlow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = innerGlow;
      ctx.beginPath();
      ctx.arc(100, 100, 70, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw initials
      ctx.fillStyle = 'white';
      ctx.font = 'bold 60px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      ctx.fillText(initials, 100, 100);
      
      const result = canvas.toDataURL('image/png', 1.0);
      console.log('✅ Personalized photo generated for:', studentName, ', length:', result.length);
      return result;
    } catch (err) {
      console.error('❌ Failed to generate personalized photo:', err);
      return null;
    }
  };

  // Fetch logo once and store as data URL so html2canvas never hits CORS
  const fetchLogoAsDataUrl = async (url) => {
    console.log('🏫 Fetching logo as data URL from:', url);
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    try {
      const dataUrl = await embedImageDirectly(url);
      console.log('✅ Logo conversion result:', dataUrl ? 'SUCCESS (base64 ready)' : 'FAILED');
      return dataUrl;
    } catch (error) {
      console.error('❌ Logo fetch error:', error);
      return null;
    }
  };

  // Debug function to test canvas creation
  const testCanvasCreation = async () => {
    if (!cardFrontRef.current) return;
    
    try {
      console.log('Testing canvas creation...');
      console.log('Element dimensions:', cardFrontRef.current.offsetWidth, 'x', cardFrontRef.current.offsetHeight);
      
      const canvas = await html2canvas(cardFrontRef.current, {
        scale: 1,
        useCORS: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true,
        imageTimeout: 30000
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
    console.log('🎯 === Starting PDF generation for:', student?.student_name);
    
    let studentPhotoData = null;
    let schoolLogoData = logoB64;
    
    // STUDENT PHOTO HANDLING - MUST ALWAYS SUCCEED
    console.log('📸 Processing student photo...');
    try {
      if (student?.photo_url) {
        console.log('  - Found photo URL:', student.photo_url.substring(0, 60) + '...');
        const validation = await validateAndDebugImage(student.photo_url, 'student photo');
        
        if (validation.valid) {
          console.log('  - Validation passed, attempting to embed...');
          studentPhotoData = await embedImageDirectly(student.photo_url);
          if (studentPhotoData) {
            console.log('  - ✅ Real photo embedded successfully');
          } else {
            console.log('  - ⚠️ Embedding failed for real photo');
          }
        } else {
          console.log('  - ⚠️ Photo validation failed:', validation.reason);
        }
      } else {
        console.log('  - No photo URL provided');
        studentPhotoData = null;
      }
    } catch (err) {
      console.error('  - ❌ Error processing photo URL:', err.message);
      studentPhotoData = null;
    }
    
    // NO FALLBACK - Only real images
    
    // SCHOOL LOGO HANDLING
    console.log('🏫 Processing school logo...');
    try {
      if (!schoolLogoData && school?.logo_url) {
        console.log('  - Found logo URL:', school.logo_url.substring(0, 60) + '...');
        const validation = await validateAndDebugImage(school.logo_url, 'school logo');
        
        if (validation.valid) {
          console.log('  - Validation passed, attempting to embed...');
          schoolLogoData = await embedImageDirectly(school.logo_url);
          if (schoolLogoData) {
            console.log('  - ✅ Real logo embedded successfully');
          } else {
            console.log('  - ⚠️ Embedding failed for real logo');
          }
        } else {
          console.log('  - ⚠️ Logo validation failed:', validation.reason);
        }
      }
    } catch (err) {
      console.error('  - ❌ Error processing logo URL:', err.message);
      schoolLogoData = null;
    }
    
    // FINAL STATUS CHECK
    console.log('📊 Image status:');
    console.log('  - Student photo:', studentPhotoData ? '✅ LOADED' : '❌ NOT AVAILABLE');
    console.log('  - School logo:', schoolLogoData ? '✅ LOADED' : '❌ NOT AVAILABLE');
    const d = student?.details || {};
    const fullAddress = [d.house_name, d.place, d.city, d.pin].filter(Boolean).join(', ');
    const studentName = (d.student_name || student?.student_name || '').toUpperCase();
    
    console.log('Student info - Name:', studentName, ', Address:', fullAddress);

    // Create HTML with embedded base64 images - CURRENT MODERN STYLE
    const cardHTML = `
      <div style="display:flex;gap:20px;align-items:flex-start;background:#f5f5f5;padding:30px;width:fit-content;font-family:'Inter','Segoe UI',Arial,sans-serif;">

        <!-- FRONT CARD - Current Modern Style -->
        <div style="width:320px;height:500px;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.15);background:#ffffff;position:relative;flex-shrink:0;">
          
          <!-- Top white section with logo and school info -->
          <div style="background:#ffffff;padding:20px;display:flex;justify-content:space-between;align-items:flex-start;min-height:90px;border-bottom:1px solid #f0f0f0;">
            <div style="display:flex;align-items:center;gap:12px;flex:1;">
              <div style="width:48px;height:48px;border-radius:50%;overflow:hidden;background:#4a5568;display:flex;align-items:center;justify-content:center;">
                ${schoolLogoData ? `<img src="${schoolLogoData}" style="width:100%;height:100%;object-fit:contain;" alt="logo" />` : '<div style="width:100%;height:100%;background:#4a5568;border-radius:50%;color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;">LOGO</div>'}
              </div>
              <div style="font-size:13px;font-weight:800;color:#1f2937;text-transform:uppercase;letter-spacing:0.5px;line-height:1.3;max-width:140px;">
                ${(school?.school_name || 'IMCB SOLUTIONS LLP').toUpperCase()}
              </div>
            </div>
            <div style="background:#4a5568;color:#ffffff;font-size:11px;font-weight:600;padding:6px 12px;border-radius:6px;text-align:center;min-width:70px;">
              ${(school?.place || 'WAYANAD').toUpperCase()}
            </div>
          </div>

          <!-- Purple gradient blob section with student photo -->
          <div style="position:relative;height:220px;background:linear-gradient(135deg, #7c3aed 0%, #5b21b6 50%, #4a5568 100%);overflow:hidden;">
            <!-- Organic blob shape -->
            <div style="position:absolute;top:-30px;left:-30px;width:260px;height:260px;background:linear-gradient(135deg, rgba(124,58,237,0.9) 0%, rgba(91,33,182,0.8) 50%, rgba(74,85,104,0.9) 100%);border-radius:60% 40% 30% 70% / 60% 30% 70% 40%;transform:rotate(-12deg);"></div>
            
            <!-- Student photo in white circle -->
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);width:130px;height:130px;border-radius:50%;border:4px solid #ffffff;background:#ffffff;overflow:hidden;box-shadow:0 8px 25px rgba(0,0,0,0.2);z-index:10;">
              ${studentPhotoData ? `<img src="${studentPhotoData}" style="width:100%;height:100%;object-fit:cover;" alt="student-photo" />` : '<div style="width:100%;height:100%;background:#f0f0f0;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#666;font-size:40px;">�</div>'}
            </div>
          </div>

          <!-- Student information section -->
          <div style="padding:24px 20px;text-align:center;background:#ffffff;">
            <!-- Student name -->
            <div style="font-size:18px;font-weight:900;color:#1f2937;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px;">${studentName}</div>
            
            <!-- Class -->
            <div style="font-size:16px;font-weight:700;color:#7c3aed;margin-bottom:18px;">${(student?.student_class || '1').toUpperCase()}${(student?.div || 'A').toUpperCase()}</div>
            
            <!-- Information rows -->
            <div style="text-align:left;display:flex;flex-direction:column;gap:10px;">
              <div style="display:flex;align-items:flex-start;font-size:13px;">
                <span style="color:#374151;font-weight:700;min-width:65px;">Ad No</span>
                <span style="color:#6b7280;margin:0 8px;">:</span>
                <span style="color:#1f2937;font-weight:600;">${(student?.admno || 'S/7058').toUpperCase()}</span>
              </div>
              <div style="display:flex;align-items:flex-start;font-size:13px;">
                <span style="color:#374151;font-weight:700;min-width:65px;">Phone</span>
                <span style="color:#6b7280;margin:0 8px;">:</span>
                <span style="color:#1f2937;font-weight:600;">${(d.phone || student?.mobile || '9061947005').toUpperCase()}</span>
              </div>
              <div style="display:flex;align-items:flex-start;font-size:13px;">
                <span style="color:#374151;font-weight:700;min-width:65px;">Address</span>
                <span style="color:#6b7280;margin:0 8px;">:</span>
                <span style="color:#1f2937;font-weight:600;line-height:1.4;flex:1;word-wrap:break-word;overflow-wrap:break-word;max-width:170px;">${(fullAddress || 'Wayanad, Wayanad, Kunhome, Kerala, 670731').toUpperCase()}</span>
              </div>
            </div>

            <!-- Decorative diamond pattern -->
            <div style="margin-top:16px;height:8px;background:linear-gradient(90deg, transparent 0%, #7c3aed 20%, #5b21b6 50%, #7c3aed 80%, transparent 100%);border-radius:4px;opacity:0.6;"></div>
          </div>
        </div>

        <!-- BACK CARD - Current Modern Style -->
        <div style="width:320px;height:500px;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.15);background:#f8f9fa;position:relative;flex-shrink:0;">
          
          <!-- Top triangular design -->
          <div style="position:relative;height:100px;overflow:hidden;">
            <div style="position:absolute;top:0;left:0;width:0;height:0;border-right:160px solid transparent;border-top:100px solid #7c3aed;"></div>
            <div style="position:absolute;top:0;right:0;width:0;height:0;border-left:320px solid transparent;border-top:70px solid #4a5568;"></div>
          </div>

          <!-- School logo in white pill container -->
          <div style="display:flex;justify-content:center;margin:-35px 0 20px;position:relative;z-index:2;">
            <div style="background:#ffffff;border-radius:20px;padding:10px 20px;box-shadow:0 4px 15px rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center;min-height:50px;min-width:100px;">
              ${schoolLogoData ? `<img src="${schoolLogoData}" style="height:30px;max-width:100px;object-fit:contain;" alt="logo" />` : '<div style="height:30px;width:80px;background:#4a5568;border-radius:4px;color:white;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:bold;">LOGO</div>'}
            </div>
          </div>

          <!-- Rules and regulations -->
          <div style="padding:0 20px 16px;display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#4b5563;line-height:1.4;">
              <span style="color:#7c3aed;font-weight:bold;margin-top:2px;font-size:8px;">●</span>
              <span>This card is issued for the academic year 2025-26</span>
            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#4b5563;line-height:1.4;">
              <span style="color:#7c3aed;font-weight:bold;margin-top:2px;font-size:8px;">●</span>
              <span>This card is non-transferable.</span>
            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#4b5563;line-height:1.4;">
              <span style="color:#7c3aed;font-weight:bold;margin-top:2px;font-size:8px;">●</span>
              <span>Always carry your card during school hours.</span>
            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#4b5563;line-height:1.4;">
              <span style="color:#7c3aed;font-weight:bold;margin-top:2px;font-size:8px;">●</span>
              <span>In case of loss, inform issuing authority.</span>
            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#4b5563;line-height:1.4;">
              <span style="color:#7c3aed;font-weight:bold;margin-top:2px;font-size:8px;">●</span>
              <span>If found, please post it to given address</span>
            </div>
          </div>

          <!-- School information footer -->
          <div style="position:absolute;bottom:0;left:0;right:0;padding:16px 20px;background:linear-gradient(to top, rgba(255,255,255,0.95), rgba(255,255,255,0.8));border-top:1px solid rgba(107,114,128,0.2);">
            <div style="font-size:14px;font-weight:900;color:#1f2937;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${(school?.school_name || 'IMCB SOLUTIONS LLP').toUpperCase()}</div>
            <div style="font-size:11px;color:#6b7280;margin-bottom:8px;">${(school?.address || 'IMCB SOLUTIONS LLP').toUpperCase()}</div>
            <div style="display:flex;flex-direction:column;gap:3px;">
              <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#4b5563;">
                <span style="color:#ef4444;font-size:10px;">📍</span>
                <span>${(school?.place || 'WAYANAD').toUpperCase()}</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#4b5563;">
                <span style="color:#3b82f6;font-size:10px;">📞</span>
                <span>${(school?.phone || '9061947005').toUpperCase()}</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#4b5563;">
                <span style="color:#6b7280;font-size:10px;">✉️</span>
                <span>${school?.email || 'sajiththomas231@gmail.com'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Create and mount HTML container
    const container = document.createElement('div');
    container.style.cssText = `
      position:fixed;top:-9999px;left:-9999px;
      z-index:-1;pointer-events:none;opacity:1;
    `;
    container.innerHTML = cardHTML;
    document.body.appendChild(container);

    console.log('✅ HTML DOM created with base64 images');

    // Wait for DOM rendering
    console.log('⏳ Waiting for DOM rendering (1500ms)...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verify images loaded in DOM
    const images = container.querySelectorAll('img');
    console.log(`📊 Found ${images.length} images in DOM`);
    images.forEach((img, i) => {
      const isLoaded = img.complete && (img.naturalWidth > 0 || img.src.startsWith('data:'));
      console.log(`  Image ${i + 1}: ${isLoaded ? '✅' : '⏳'} (src length: ${img.src.length})`);
    });

    // Capture with html2canvas
    console.log('🎨 Capturing with html2canvas...');
    const canvas = await html2canvas(container.firstElementChild, {
      scale: 2,
      useCORS: false,
      allowTaint: true,
      backgroundColor: '#e5e7eb',
      logging: false,
      width: container.firstElementChild.scrollWidth,
      height: container.firstElementChild.scrollHeight,
      imageTimeout: 0,
      removeContainer: false
    });

    console.log('✅ Canvas captured:', canvas.width, 'x', canvas.height);

    // Cleanup DOM
    document.body.removeChild(container);

    // Add to PDF
    if (!isFirst) pdf.addPage();
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    
    const aspectRatio = canvas.width / canvas.height;
    let imgW = pageW - 40;
    let imgH = imgW / aspectRatio;
    
    if (imgH > pageH - 60) {
      imgH = pageH - 60;
      imgW = imgH * aspectRatio;
    }
    
    const imgX = (pageW - imgW) / 2;
    const imgY = (pageH - imgH) / 2;
    
    pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', imgX, imgY, imgW, imgH);

    // Add student info footer
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(75, 85, 99);
    const info = `${student?.student_name || ''} • Adm No: ${student?.admno || ''} • Class: ${student?.student_class || ''}-${student?.div || ''}`;
    const textY = Math.min(imgY + imgH + 15, pageH - 10);
    pdf.text(info, pageW / 2, textY, { align: 'center' });
    
    console.log('✅ PDF page complete for:', student?.student_name);
  };

  // Single student PDF download
  const handleDownloadPDF = async () => {
    if (!selected) return;
    setDownloadingPDF(true);
    setSaveMsg('');
    try {
      console.log('📥 Requesting PDF from backend for:', selected.student_name);

      const payload = {
        student: {
          student_name: selected.student_name,
          student_class: selected.student_class,
          div: selected.div,
          admno: selected.admno,
          mobile: selected.mobile,
          photo_url: selected.photo_url,
          institution_id: institutionId,
        },
        school: school,
        details: selected.details || {},
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}id-card/generate-pdf/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status, response.statusText);

      // Check if response is successful
      if (!response.ok) {
        let errorMsg = 'PDF generation failed (Status: ' + response.status + ')';
        try {
          // Read body once and try to parse as JSON
          const responseText = await response.text();
          console.error('Backend response:', responseText);
          try {
            const errorData = JSON.parse(responseText);
            errorMsg = errorData.message || errorMsg;
          } catch (parseError) {
            // Not JSON, use raw text as error
            if (responseText) errorMsg = responseText;
          }
        } catch (e) {
          console.error('Error reading response:', e);
        }
        throw new Error(errorMsg);
      }

      console.log('Response is OK, reading as blob...');
      // Response is successful - should be PDF
      const blob = await response.blob();
      console.log('Blob created, size:', blob.size);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ID_Card_${selected.admno}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      setSaveMsg('✅ ID Card PDF downloaded successfully.');
      console.log('✅ PDF download complete');
    } catch (err) {
      console.error('❌ PDF generation error:', err);
      setSaveMsg('❌ Failed to generate PDF: ' + err.message);
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Bulk PDF download (using backend)
  const handleBulkDownloadPDF = async () => {
    const submittedStudents = students.filter(s => s.parent_submitted);
    if (submittedStudents.length === 0) {
      setSaveMsg('⚠️ No submitted students found to download.');
      return;
    }
    setDownloadingPDF(true);
    setSaveMsg('');
    try {
      console.log('📥 Requesting bulk PDF from backend for', submittedStudents.length, 'students');

      const payload = {
        institution_id: institutionId,
        school: school,
        students: submittedStudents.map(s => ({
          student: {
            student_name: s.student_name,
            student_class: s.student_class,
            div: s.div,
            admno: s.admno,
            mobile: s.mobile,
            photo_url: s.photo_url,
            institution_id: institutionId,
          },
          details: s.details || {},
        })),
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}id-card/generate-bulk-pdf/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status, response.statusText);

      // Check if response is successful
      if (!response.ok) {
        let errorMsg = 'PDF generation failed (Status: ' + response.status + ')';
        try {
          // Read body once and try to parse as JSON
          const responseText = await response.text();
          console.error('Backend response:', responseText);
          try {
            const errorData = JSON.parse(responseText);
            errorMsg = errorData.message || errorMsg;
          } catch (parseError) {
            // Not JSON, use raw text as error
            if (responseText) errorMsg = responseText;
          }
        } catch (e) {
          console.error('Error reading response:', e);
        }
        throw new Error(errorMsg);
      }

      console.log('Response is OK, reading as blob...');
      // Response is successful - should be PDF
      const blob = await response.blob();
      console.log('Blob created, size:', blob.size);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ID_Cards_Bulk_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      setSaveMsg(`✅ ${submittedStudents.length} ID Cards downloaded successfully.`);
      console.log('✅ Bulk PDF download complete');
    } catch (err) {
      console.error('❌ Bulk PDF generation error:', err);
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
                disabled={downloadingPDF || students.filter(s => s.parent_submitted).length === 0}
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
                            : <img src={generateInitialsPhoto(s.student_name)} alt="" />}
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