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

  // DIRECT IMAGE EMBEDDING - Enhanced with better error handling
  const embedImageDirectly = async (url) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    
    console.log('Directly embedding image:', url);
    
    try {
      // Method 1: Try fetch with blob
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'image/*'
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            console.log('Image successfully converted to base64:', url);
            resolve(reader.result);
          };
          reader.onerror = () => {
            console.warn('FileReader failed for:', url);
            resolve(null);
          };
          reader.readAsDataURL(blob);
        });
      }
    } catch (error) {
      console.log('Fetch method failed, trying canvas method...', error);
    }
    
    // Method 2: Create image element and draw to canvas
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.naturalWidth || img.width || 200;
          canvas.height = img.naturalHeight || img.height || 200;
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png', 0.9);
          console.log('Canvas conversion successful:', url);
          resolve(dataURL);
        } catch (error) {
          console.warn('Canvas drawing failed:', error);
          resolve(null);
        }
      };
      
      img.onerror = () => {
        console.warn('Image load failed:', url);
        resolve(null);
      };
      
      // Set crossOrigin and src
      img.crossOrigin = 'anonymous';
      img.src = url;
      
      // Fallback timeout
      setTimeout(() => {
        console.warn('Image loading timeout:', url);
        resolve(null);
      }, 10000);
    });
  };

  // Perfect fallback images matching the ID card design
  const getDefaultLogoB64 = () => {
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
    
    return canvas.toDataURL('image/png', 1.0);
  };

  const getDefaultPhotoB64 = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    // Draw gradient background matching the ID card purple theme
    const gradient = ctx.createRadialGradient(100, 100, 0, 100, 100, 100);
    gradient.addColorStop(0, '#a855f7');
    gradient.addColorStop(0.7, '#7c3aed');
    gradient.addColorStop(1, '#5b21b6');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(100, 100, 95, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add subtle inner glow
    const innerGlow = ctx.createRadialGradient(100, 100, 0, 100, 100, 80);
    innerGlow.addColorStop(0, 'rgba(255,255,255,0.3)');
    innerGlow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(100, 100, 80, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw professional person silhouette
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    
    // Head (circle)
    ctx.beginPath();
    ctx.arc(100, 75, 28, 0, 2 * Math.PI);
    ctx.fill();
    
    // Neck
    ctx.fillRect(92, 100, 16, 12);
    
    // Shoulders/Body (ellipse shape)
    ctx.beginPath();
    ctx.ellipse(100, 145, 45, 35, 0, 0, Math.PI);
    ctx.fill();
    
    // Add subtle shadow for depth
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(95, 70, 25, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add a subtle highlight
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(90, 65, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    return canvas.toDataURL('image/png', 1.0);
  };
  // Generate personalized profile picture with student initials
  const getPersonalizedPhotoB64 = (studentName) => {
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
    
    return canvas.toDataURL('image/png', 1.0);
  };

  // Fetch logo once and store as data URL so html2canvas never hits CORS
  const fetchLogoAsDataUrl = async (url) => {
    console.log('Fetching logo as data URL:', url);
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    try {
      const dataUrl = await embedImageDirectly(url);
      console.log('Logo conversion result:', dataUrl ? 'SUCCESS' : 'FAILED');
      return dataUrl;
    } catch (error) {
      console.error('Logo fetch error:', error);
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
    console.log('=== Starting PDF generation for:', student?.student_name);
    
    // 1. Pre-load ALL images before creating HTML
    let studentPhotoData = null;
    let schoolLogoData = logoB64;
    
    // Load student photo
    if (student?.photo_url) {
      console.log('Loading student photo:', student.photo_url);
      studentPhotoData = await embedImageDirectly(student.photo_url);
      if (!studentPhotoData) {
        console.log('Student photo failed, using personalized fallback');
        studentPhotoData = getPersonalizedPhotoB64(student?.student_name || student?.details?.student_name);
      }
    } else {
      console.log('No photo URL, generating personalized photo');
      studentPhotoData = getPersonalizedPhotoB64(student?.student_name || student?.details?.student_name);
    }
    
    // Load school logo if not provided
    if (!schoolLogoData && school?.logo_url) {
      console.log('Loading school logo:', school.logo_url);
      schoolLogoData = await embedImageDirectly(school.logo_url);
      if (!schoolLogoData) {
        console.log('School logo failed, using fallback');
        schoolLogoData = getDefaultLogoB64();
      }
    } else if (!schoolLogoData) {
      schoolLogoData = getDefaultLogoB64();
    }
    
    console.log('Images loaded - Photo:', studentPhotoData ? 'SUCCESS' : 'FAILED');
    console.log('Images loaded - Logo:', schoolLogoData ? 'SUCCESS' : 'FAILED');

    // 2. Build student data
    const d = student?.details || {};
    const fullAddress = [d.place, d.district, d.city, d.state, d.pin].filter(Boolean).join(', ');
    const studentName = (d.student_name || student?.student_name || '').toUpperCase();
    
    console.log('Student data - Name:', studentName);
    console.log('Student data - Address:', fullAddress);

    // 3. Create HTML with embedded images (NO external URLs)
    const cardHTML = `
      <div style="display:flex;gap:24px;align-items:flex-start;background:#e5e7eb;padding:32px;width:fit-content;font-family:'Inter','Segoe UI',Arial,sans-serif;">

        <!-- FRONT CARD -->
        <div style="width:320px;height:500px;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.15);background:#ffffff;position:relative;flex-shrink:0;">
          
          <!-- Top section with logo and school name -->
          <div style="background:#ffffff;padding:16px 20px;display:flex;justify-content:space-between;align-items:flex-start;min-height:80px;">
            <div style="display:flex;align-items:center;gap:12px;flex:1;">
              <img src="${schoolLogoData}" style="width:48px;height:48px;object-fit:contain;border-radius:8px;" />
              <div style="font-size:14px;font-weight:800;color:#1f2937;text-transform:uppercase;letter-spacing:0.5px;line-height:1.2;max-width:140px;">
                ${school?.school_name || 'IMCB SOLUTIONS LLP'}
              </div>
            </div>
            <div style="background:#3b4d7a;color:#ffffff;font-size:12px;font-weight:600;padding:8px 12px;border-radius:8px;text-align:center;min-width:80px;">
              ${school?.place || 'WAYANAD'}
            </div>
          </div>

          <!-- Purple blob section with photo -->
          <div style="position:relative;height:240px;background:linear-gradient(135deg, #7c3aed 0%, #5b21b6 50%, #3b4d7a 100%);overflow:hidden;">
            <div style="position:absolute;top:-40px;left:-40px;width:280px;height:280px;background:linear-gradient(135deg, #7c3aed 0%, #5b21b6 50%, #3b4d7a 100%);border-radius:60% 40% 30% 70% / 60% 30% 70% 40%;transform:rotate(-15deg);"></div>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);width:140px;height:140px;border-radius:50%;border:4px solid #ffffff;background:#ffffff;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.2);z-index:10;">
              <img src="${studentPhotoData}" style="width:100%;height:100%;object-fit:cover;" />
            </div>
          </div>

          <!-- Student info section -->
          <div style="padding:20px;text-align:center;background:#ffffff;">
            <div style="font-size:20px;font-weight:900;color:#1f2937;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">${studentName}</div>
            <div style="font-size:18px;font-weight:700;color:#7c3aed;margin-bottom:16px;">${student?.student_class || '1'}${student?.div || 'A'}</div>
            
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
                <span style="color:#1f2937;font-weight:600;line-height:1.4;flex:1;word-wrap:break-word;overflow-wrap:break-word;max-width:180px;">${fullAddress || 'Wayanad, Wayanad, Kunhome, Kerala, 670731'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- BACK CARD -->
        <div style="width:320px;height:500px;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.15);background:linear-gradient(135deg, #e5e7eb 0%, #f3f4f6 100%);position:relative;flex-shrink:0;">
          
          <!-- Top triangular design -->
          <div style="position:relative;height:120px;overflow:hidden;">
            <div style="position:absolute;top:0;left:0;width:0;height:0;border-right:160px solid transparent;border-top:120px solid #7c3aed;"></div>
            <div style="position:absolute;top:0;right:0;width:0;height:0;border-left:320px solid transparent;border-top:80px solid #3b4d7a;"></div>
          </div>

          <!-- Logo in white pill -->
          <div style="display:flex;justify-content:center;margin:-40px 0 24px;position:relative;z-index:2;">
            <div style="background:#ffffff;border-radius:24px;padding:12px 24px;box-shadow:0 4px 20px rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center;min-height:60px;">
              <img src="${schoolLogoData}" style="height:36px;max-width:120px;object-fit:contain;" />
            </div>
          </div>

          <!-- Rules section -->
          <div style="padding:0 24px 16px;display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#4b5563;line-height:1.4;"><span style="color:#7c3aed;font-weight:bold;margin-top:2px;">•</span><span>This card is issued for the academic year 2025-26</span></div>
            <div style="display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#4b5563;line-height:1.4;"><span style="color:#7c3aed;font-weight:bold;margin-top:2px;">•</span><span>This card is non-transferable.</span></div>
            <div style="display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#4b5563;line-height:1.4;"><span style="color:#7c3aed;font-weight:bold;margin-top:2px;">•</span><span>Always carry your card during school hours.</span></div>
            <div style="display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#4b5563;line-height:1.4;"><span style="color:#7c3aed;font-weight:bold;margin-top:2px;">•</span><span>In case of loss, inform issuing authority.</span></div>
            <div style="display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#4b5563;line-height:1.4;"><span style="color:#7c3aed;font-weight:bold;margin-top:2px;">•</span><span>If found, please post it to given address</span></div>
          </div>

          <!-- School info footer -->
          <div style="padding:16px 24px;margin-top:auto;border-top:1px solid rgba(107,114,128,0.2);">
            <div style="font-size:16px;font-weight:900;color:#1f2937;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${school?.school_name || 'IMCB SOLUTIONS LLP'}</div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:12px;">${school?.address || 'IMCB SOLUTIONS LLP'}</div>
            <div style="display:flex;flex-direction:column;gap:4px;">
              <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#4b5563;"><span style="color:#ef4444;">📍</span><span>${school?.place || 'WAYANAD'}</span></div>
              <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#4b5563;"><span style="color:#ef4444;">📞</span><span>${school?.phone || '9061947005'}</span></div>
              <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#4b5563;"><span style="color:#d1d5db;">✉️</span><span>${school?.email || 'sajiththomas231@gmail.com'}</span></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // 3. Create container and mount HTML
    const container = document.createElement('div');
    container.style.cssText = `
      position:fixed;top:-9999px;left:-9999px;
      z-index:-1;pointer-events:none;opacity:1;
    `;
    container.innerHTML = cardHTML;
    document.body.appendChild(container);

    console.log('HTML template created with embedded images');

    // 4. Wait for rendering and image loading
    console.log('Waiting for DOM rendering and image loading...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Verify images are loaded
    const images = container.querySelectorAll('img');
    console.log(`Found ${images.length} images in container`);
    images.forEach((img, index) => {
      console.log(`Image ${index + 1}: ${img.src.substring(0, 50)}... (${img.complete ? 'loaded' : 'loading'})`);
    });

    // 6. Capture with html2canvas
    console.log('Starting html2canvas capture...');
    const canvas = await html2canvas(container.firstElementChild, {
      scale: 2,
      useCORS: false,
      allowTaint: true,
      backgroundColor: '#e5e7eb',
      logging: true,
      width: container.firstElementChild.scrollWidth,
      height: container.firstElementChild.scrollHeight,
      imageTimeout: 30000,
      removeContainer: false,
      onclone: (clonedDoc) => {
        console.log('html2canvas cloned document');
        const clonedImages = clonedDoc.querySelectorAll('img');
        console.log(`Cloned document has ${clonedImages.length} images`);
      }
    });

    console.log('Canvas captured:', canvas.width, 'x', canvas.height);

    // 7. Cleanup
    document.body.removeChild(container);

    // 8. Add to PDF
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

    // Student info
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(75, 85, 99);
    const info = `${student?.student_name || ''} • Adm No: ${student?.admno || ''} • Class: ${student?.student_class || ''}-${student?.div || ''}`;
    const textY = Math.min(imgY + imgH + 15, pageH - 10);
    pdf.text(info, pageW / 2, textY, { align: 'center' });
    
    console.log('=== PDF generation completed for:', student?.student_name);
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