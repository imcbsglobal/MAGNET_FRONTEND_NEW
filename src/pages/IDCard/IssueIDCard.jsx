import React, { useEffect, useRef, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import PhotoCropEditor from '../../components/PhotoCropEditor/PhotoCropEditor';
import {
  fetchIDCardStudents, fetchIDCardSchoolInfo,
  updateIDCardSubmission, uploadStudentPhoto, fetchHouseGroups,
} from '../../services/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './IssueIDCard.scss';

// ── Icons ─────────────────────────────────────────────────────────────────────
const IssueCardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2.5" />
    <circle cx="8.5" cy="11" r="2" />
    <path d="M5 16.5c0-1.4 1.4-2.5 3.5-2.5s3.5 1.1 3.5 2.5" />
    <path d="M14 9.5h6" /><path d="M14 13h6" /><path d="M14 16.5h4" />
  </svg>
);

const CameraIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// ── Utility Functions ─────────────────────────────────────────────────────────
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
    ['#dc2626', '#b91c1c'], ['#d97706', '#b45309'], ['#7c2d12', '#92400e'],
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
          {school?.place && <div className="idt-place-badge">{school.place}</div>}
        </div>
      </div>

      <div className="idt-photo-area">
        <div className="idt-purple-curve" />
        <div className="idt-photo-circle">
          <img
            src={photoUrl || generateInitialsPhoto(d.student_name || student?.student_name)}
            alt="student"
            className="idt-photo"
          />
        </div>
      </div>

      <div className="idt-body">
        <div className="idt-student-name">
          {(d.student_name || student?.student_name || '').toUpperCase()}
        </div>
        <div className="idt-class">
          {(student?.student_class || '')} {(student?.div || '')}
        </div>
        {d.house_group && (
          <div className="idt-house-group-badge">
            {d.house_group.toUpperCase()}
          </div>
        )}
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
    <div className="idt-back-header">
      <div className="idt-back-curve-purple" />
      <div className="idt-back-curve-navy" />
    </div>
    <div className="idt-back-logo-container">
      <div className="idt-back-logo-pill">
        {school?.logo_url
          ? <img src={school.logo_url} alt="logo" className="idt-back-logo" />
          : <div className="idt-back-logo-placeholder">🏫</div>}
      </div>
    </div>
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
  { name: 'student_name', label: 'Student Name',  type: 'text'   },
  { name: 'father_name',  label: 'Father Name',   type: 'text'   },
  { name: 'mother_name',  label: 'Mother Name',   type: 'text'   },
  { name: 'dob',          label: 'Date of Birth', type: 'date'   },
  { name: 'phone',        label: 'Phone',         type: 'tel'    },
  { name: 'email',        label: 'Email',         type: 'email'  },
  { name: 'house_name',   label: 'House Name',    type: 'text'   },
  { name: 'house_group',  label: 'House Group',   type: 'select' },
  { name: 'place',        label: 'Place',         type: 'text'   },
  { name: 'city',         label: 'City',          type: 'text'   },
  { name: 'pin',          label: 'PIN Code',      type: 'text'   },
];

// ── Image helpers (PDF generation) ───────────────────────────────────────────
const embedImageDirectly = async (url) => {
  if (!url) return null;
  if (url.startsWith('data:')) return url;

  // Method 1: canvas + crossOrigin
  try {
    const img = new Image();
    const dataUrl = await new Promise((resolve) => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 400;
          canvas.height = img.naturalHeight || 400;
          canvas.getContext('2d').drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png', 1.0));
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.crossOrigin = 'anonymous';
      img.src = url;
      setTimeout(() => resolve(null), 15000);
    });
    if (dataUrl && dataUrl.length > 1000) return dataUrl;
  } catch { /* fall through */ }

  // Method 2: fetch blob
  try {
    const response = await fetch(url, { method: 'GET', mode: 'cors', credentials: 'omit' });
    if (response.ok) {
      const blob = await response.blob();
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
      if (dataUrl) return dataUrl;
    }
  } catch { /* fall through */ }

  // Method 3: proxy
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (response.ok) {
      const blob = await response.blob();
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
      if (dataUrl) return dataUrl;
    }
  } catch { /* fall through */ }

  return null;
};

const captureCardToPdf = async (pdf, student, school, logoB64, isFirst) => {
  let studentPhotoData = null;
  let schoolLogoData = logoB64;

  if (student?.photo_url) {
    studentPhotoData = await embedImageDirectly(student.photo_url);
  }
  if (!schoolLogoData && school?.logo_url) {
    schoolLogoData = await embedImageDirectly(school.logo_url);
  }

  const d = student?.details || {};
  const fullAddress = [d.house_name, d.place, d.city, d.pin].filter(Boolean).join(', ');
  const studentName = (d.student_name || student?.student_name || '').toUpperCase();

  const cardHTML = `
    <div style="display:flex;gap:20px;align-items:flex-start;background:#f5f5f5;padding:30px;width:fit-content;font-family:'Inter','Segoe UI',Arial,sans-serif;">
      <div style="width:320px;height:500px;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.15);background:#ffffff;position:relative;flex-shrink:0;">
        <div style="background:#ffffff;padding:20px;display:flex;justify-content:space-between;align-items:flex-start;min-height:90px;border-bottom:1px solid #f0f0f0;">
          <div style="display:flex;align-items:center;gap:12px;flex:1;">
            <div style="width:48px;height:48px;border-radius:50%;overflow:hidden;background:#4a5568;display:flex;align-items:center;justify-content:center;">
              ${schoolLogoData ? `<img src="${schoolLogoData}" style="width:100%;height:100%;object-fit:contain;" alt="logo" />` : '<div style="width:100%;height:100%;background:#4a5568;border-radius:50%;color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;">LOGO</div>'}
            </div>
            <div style="font-size:13px;font-weight:800;color:#1f2937;text-transform:uppercase;letter-spacing:0.5px;line-height:1.3;max-width:140px;">
              ${(school?.school_name || 'School Name').toUpperCase()}
            </div>
          </div>
          <div style="background:#4a5568;color:#ffffff;font-size:11px;font-weight:600;padding:6px 12px;border-radius:6px;text-align:center;min-width:70px;">
            ${(school?.place || '').toUpperCase()}
          </div>
        </div>
        <div style="position:relative;height:220px;background:linear-gradient(135deg,#7c3aed 0%,#5b21b6 50%,#4a5568 100%);overflow:hidden;">
          <div style="position:absolute;top:-30px;left:-30px;width:260px;height:260px;background:linear-gradient(135deg,rgba(124,58,237,0.9) 0%,rgba(91,33,182,0.8) 50%,rgba(74,85,104,0.9) 100%);border-radius:60% 40% 30% 70%/60% 30% 70% 40%;transform:rotate(-12deg);"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:130px;height:130px;border-radius:50%;border:4px solid #ffffff;background:#ffffff;overflow:hidden;box-shadow:0 8px 25px rgba(0,0,0,0.2);z-index:10;">
            ${studentPhotoData ? `<img src="${studentPhotoData}" style="width:100%;height:100%;object-fit:cover;" alt="photo" />` : '<div style="width:100%;height:100%;background:#f0f0f0;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#666;font-size:40px;">👤</div>'}
          </div>
        </div>
        <div style="padding:24px 20px;text-align:center;background:#ffffff;">
          <div style="font-size:18px;font-weight:900;color:#1f2937;margin-bottom:2px;text-transform:uppercase;">${studentName}</div>
          <div style="font-size:16px;font-weight:700;color:#7c3aed;margin-bottom:8px;">${(student?.student_class || '')}${(student?.div || '')}</div>
          ${d.house_group ? `<div style="display:inline-block;background:#4527a0;color:#fff;font-size:11px;font-weight:800;padding:4px 12px;border-radius:100px;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px;">${d.house_group.toUpperCase()}</div>` : ''}
          <div style="text-align:left;display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;align-items:flex-start;font-size:13px;"><span style="color:#374151;font-weight:700;min-width:65px;">Ad No</span><span style="color:#6b7280;margin:0 8px;">:</span><span style="color:#1f2937;font-weight:600;">${(student?.admno || '').toUpperCase()}</span></div>
            <div style="display:flex;align-items:flex-start;font-size:13px;"><span style="color:#374151;font-weight:700;min-width:65px;">Phone</span><span style="color:#6b7280;margin:0 8px;">:</span><span style="color:#1f2937;font-weight:600;">${(d.phone || student?.mobile || '-').toUpperCase()}</span></div>
            <div style="display:flex;align-items:flex-start;font-size:13px;"><span style="color:#374151;font-weight:700;min-width:65px;">Address</span><span style="color:#6b7280;margin:0 8px;">:</span><span style="color:#1f2937;font-weight:600;line-height:1.4;flex:1;word-wrap:break-word;max-width:170px;">${(fullAddress || '').toUpperCase()}</span></div>
          </div>
          <div style="margin-top:16px;height:8px;background:linear-gradient(90deg,transparent 0%,#7c3aed 20%,#5b21b6 50%,#7c3aed 80%,transparent 100%);border-radius:4px;opacity:0.6;"></div>
        </div>
      </div>

      <div style="width:320px;height:500px;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.15);background:#f8f9fa;position:relative;flex-shrink:0;">
        <div style="position:relative;height:100px;overflow:hidden;">
          <div style="position:absolute;top:0;left:0;width:0;height:0;border-right:160px solid transparent;border-top:100px solid #7c3aed;"></div>
          <div style="position:absolute;top:0;right:0;width:0;height:0;border-left:320px solid transparent;border-top:70px solid #4a5568;"></div>
        </div>
        <div style="display:flex;justify-content:center;margin:-35px 0 20px;position:relative;z-index:2;">
          <div style="background:#ffffff;border-radius:20px;padding:10px 20px;box-shadow:0 4px 15px rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center;min-height:50px;min-width:100px;">
            ${schoolLogoData ? `<img src="${schoolLogoData}" style="height:30px;max-width:100px;object-fit:contain;" alt="logo" />` : '<div style="height:30px;width:80px;background:#4a5568;border-radius:4px;color:white;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:bold;">LOGO</div>'}
          </div>
        </div>
        <div style="padding:0 20px 16px;display:flex;flex-direction:column;gap:8px;">
          ${['This card is issued for the academic year 2025-26','This card is non-transferable.','Always carry your card during school hours.','In case of loss, inform issuing authority.','If found, please post it to given address'].map(r => `<div style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#4b5563;line-height:1.4;"><span style="color:#7c3aed;font-weight:bold;margin-top:2px;font-size:8px;">●</span><span>${r}</span></div>`).join('')}
        </div>
        <div style="position:absolute;bottom:0;left:0;right:0;padding:16px 20px;background:linear-gradient(to top,rgba(255,255,255,0.95),rgba(255,255,255,0.8));border-top:1px solid rgba(107,114,128,0.2);">
          <div style="font-size:14px;font-weight:900;color:#1f2937;text-transform:uppercase;margin-bottom:4px;">${(school?.school_name || '').toUpperCase()}</div>
          <div style="display:flex;flex-direction:column;gap:3px;">
            ${school?.place ? `<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#4b5563;"><span>📍</span><span>${school.place.toUpperCase()}</span></div>` : ''}
            ${school?.phone ? `<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#4b5563;"><span>📞</span><span>${school.phone}</span></div>` : ''}
            ${school?.email ? `<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#4b5563;"><span>✉️</span><span>${school.email}</span></div>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;z-index:-1;pointer-events:none;opacity:1;';
  container.innerHTML = cardHTML;
  document.body.appendChild(container);

  await new Promise(resolve => setTimeout(resolve, 1500));

  const canvas = await html2canvas(container.firstElementChild, {
    scale: 2,
    useCORS: false,
    allowTaint: true,
    backgroundColor: '#e5e7eb',
    logging: false,
    width: container.firstElementChild.scrollWidth,
    height: container.firstElementChild.scrollHeight,
    imageTimeout: 0,
    removeContainer: false,
  });

  document.body.removeChild(container);

  if (!isFirst) pdf.addPage();
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const aspectRatio = canvas.width / canvas.height;
  let imgW = pageW - 40;
  let imgH = imgW / aspectRatio;
  if (imgH > pageH - 60) { imgH = pageH - 60; imgW = imgH * aspectRatio; }
  const imgX = (pageW - imgW) / 2;
  const imgY = (pageH - imgH) / 2;
  pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', imgX, imgY, imgW, imgH);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  const info = `${student?.student_name || ''} • Adm No: ${student?.admno || ''} • Class: ${student?.student_class || ''}-${student?.div || ''}`;
  pdf.text(info, pageW / 2, Math.min(imgY + imgH + 15, pageH - 10), { align: 'center' });
};

// ── Main page ─────────────────────────────────────────────────────────────────
const IssueIDCard = () => {
  const institutionId    = localStorage.getItem('institutionId')    || '';
  const assignedClass    = localStorage.getItem('assignedClass')    || '';
  const assignedDivision = localStorage.getItem('assignedDivision') || '';

  const [students, setStudents]             = useState([]);
  const [school, setSchool]                 = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [search, setSearch]                 = useState('');
  const [selected, setSelected]             = useState(null);
  const [editForm, setEditForm]             = useState({});
  const [saving, setSaving]                 = useState(false);
  const [saveMsg, setSaveMsg]               = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [photoTimestamp, setPhotoTimestamp] = useState(Date.now());
  const [fetchingPhoto,  setFetchingPhoto]  = useState(false);
  const [photoCropData,  setPhotoCropData]  = useState({ show: false, imageData: null, existingPhotoUrl: null });
  // mobile: 'list' shows the student list, 'detail' shows preview+edit
  const [mobilePane, setMobilePane]         = useState('list');
  const [houseGroups, setHouseGroups]       = useState([]);
  const cardFrontRef  = useRef(null);
  const cardBackRef   = useRef(null);

  const loadAll = async () => {
    if (!institutionId) { setError('Institution ID missing.'); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [studRes, schoolRes, hgRes] = await Promise.all([
        fetchIDCardStudents(institutionId, assignedClass, assignedDivision),
        fetchIDCardSchoolInfo(institutionId),
        fetchHouseGroups(institutionId),
      ]);
      const list = Array.isArray(studRes.data) ? studRes.data : [];
      setStudents(list);
      setSchool(schoolRes.data || null);
      setHouseGroups(Array.isArray(hgRes.data) ? hgRes.data : []);
      setPhotoTimestamp(Date.now());
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
    setMobilePane('detail'); // switch to detail view on mobile
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    const noUppercase = ['email', 'house_group'];
    const finalValue = noUppercase.includes(name) ? value : value.toUpperCase();
    setEditForm(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSave = async () => {
    if (!selected?.form_id) return;
    setSaving(true); setSaveMsg('');
    try {
      await updateIDCardSubmission(selected.form_id, {
        student_name: editForm.student_name,
        father_name:  editForm.father_name,
        mother_name:  editForm.mother_name,
        dob:          editForm.dob,
        phone:        editForm.phone,
        email:        editForm.email,
        house_name:   editForm.house_name,
        house_group:  editForm.house_group,
        place:        editForm.place,
        city:         editForm.city,
        pin:          editForm.pin,
      });
      setSaveMsg('✅ Details updated successfully.');
      await loadAll();
    } catch (err) {
      setSaveMsg('❌ ' + (err.response?.data?.message || 'Failed to save.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCameraClick = async () => {
    if (!selected) return;
    if (selected.photo_url) {
      setFetchingPhoto(true);
      try {
        const params = new URLSearchParams({
          institution_id: institutionId,
          admno: selected.admno,
          url: selected.photo_url,
        });
        const res = await fetch(`http://127.0.0.1:8000/api/id-card/proxy-photo/?${params}`);
        if (!res.ok) throw new Error('proxy failed');
        const json = await res.json();
        setFetchingPhoto(false);
        setPhotoCropData({ show: true, imageData: json.data_url, existingPhotoUrl: selected.photo_url });
      } catch {
        setFetchingPhoto(false);
        setPhotoCropData({ show: true, imageData: null, existingPhotoUrl: selected.photo_url });
      }
    } else {
      setPhotoCropData({ show: true, imageData: null, existingPhotoUrl: null });
    }
  };

  const handleCropConfirm = async (croppedBlob, originalBlob) => {
    if (!selected) return;
    setUploadingPhoto(true); setSaveMsg('');
    try {
      const fd = new FormData();
      fd.append('institution_id', institutionId);
      fd.append('admno', selected.admno);
      if (originalBlob) {
        fd.append('full_photo',    originalBlob, 'original.jpg');
        fd.append('display_photo', croppedBlob,  'display.jpg');
        fd.append('photo',         originalBlob, 'original.jpg'); // legacy fallback
      } else {
        fd.append('full_photo', croppedBlob, 'photo.jpg');
        fd.append('photo',      croppedBlob, 'photo.jpg');
      }
      await uploadStudentPhoto(fd);
      setSaveMsg('✅ Photo updated.');
      setPhotoCropData({ show: false, imageData: null, existingPhotoUrl: null });
      setPhotoTimestamp(Date.now());
      await loadAll();
    } catch (err) {
      setSaveMsg('❌ ' + (err.response?.data?.message || 'Upload failed.'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCropCancel = () => {
    setPhotoCropData({ show: false, imageData: null, existingPhotoUrl: null });
  };

  const handleDownloadPDF = async () => {
    if (!selected) return;
    setDownloadingPDF(true); setSaveMsg('');
    try {
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
        school,
        details: selected.details || {},
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}id-card/generate-pdf/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = 'PDF generation failed (Status: ' + response.status + ')';
        try {
          const responseText = await response.text();
          try { errorMsg = JSON.parse(responseText).message || errorMsg; } catch { if (responseText) errorMsg = responseText; }
        } catch { /* ignore */ }
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ID_Card_${selected.admno}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      setSaveMsg('✅ ID Card PDF downloaded successfully.');
    } catch (err) {
      setSaveMsg('❌ Failed to generate PDF: ' + err.message);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleBulkDownloadPDF = async () => {
    const submittedStudents = students.filter(s => s.parent_submitted);
    if (submittedStudents.length === 0) { setSaveMsg('⚠️ No submitted students found.'); return; }
    setDownloadingPDF(true); setSaveMsg('');
    try {
      const payload = {
        institution_id: institutionId,
        school,
        students: submittedStudents.map(s => ({
          student: {
            student_name: s.student_name, student_class: s.student_class,
            div: s.div, admno: s.admno, mobile: s.mobile,
            photo_url: s.photo_url, institution_id: institutionId,
          },
          details: s.details || {},
        })),
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}id-card/generate-bulk-pdf/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = 'PDF generation failed (Status: ' + response.status + ')';
        try {
          const responseText = await response.text();
          try { errorMsg = JSON.parse(responseText).message || errorMsg; } catch { if (responseText) errorMsg = responseText; }
        } catch { /* ignore */ }
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ID_Cards_Bulk_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      setSaveMsg(`✅ ${submittedStudents.length} ID Cards downloaded successfully.`);
    } catch (err) {
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

  const submittedCount = students.filter(s => s.parent_submitted).length;

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

          {/* ── Header ── */}
          <div className="idcard-header">
            <div>
              <div className="idcard-header-main">
                <div className="idcard-header-icon"><IssueCardIcon /></div>
                <div>
                  <h1>Issue ID Card</h1>
                  <p>Select a student to preview their ID card, upload photo, and download PDF.</p>
                </div>
              </div>
              <div className="idcard-pill-row">
                <span className="idcard-pill idcard-pill--info">
                  {students.length} Students · {submittedCount} Submitted
                </span>
              </div>
            </div>
            <div className="idcard-header-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={handleBulkDownloadPDF}
                disabled={downloadingPDF || submittedCount === 0}
              >
                <DownloadIcon />
                {downloadingPDF ? 'Generating...' : 'Download All PDFs'}
              </button>
              <button type="button" className="secondary-btn" onClick={loadAll} disabled={loading}>
                Refresh
              </button>
            </div>
          </div>

          {error && <div className="idcard-error">{error}</div>}
          {saveMsg && (
            <div className={saveMsg.startsWith('✅') ? 'idcard-status' : 'idcard-error'}>
              {saveMsg}
            </div>
          )}

          <div className={`issue-layout${mobilePane === 'detail' ? ' issue-layout--mobile-detail' : ''}`}>
            {/* ── Mobile: back button (only visible on mobile when detail view is shown) ── */}
            {mobilePane === 'detail' && (
              <button
                type="button"
                className="issue-mobile-back-btn"
                onClick={() => { setSelected(null); setMobilePane('list'); }}
              >
                ← Back to List
              </button>
            )}

            {/* ── Left: student list ── */}
            <div className={`issue-list-panel${mobilePane === 'detail' ? ' issue-list-panel--hidden' : ''}`}>
              <div className="idcard-search-bar">
                <input
                  type="text"
                  value={search}
                  placeholder="Search by name or adm no..."
                  onChange={e => setSearch(e.target.value)}
                />
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
                        className={`issue-student-row${selected?.admno === s.admno ? ' issue-student-row--active' : ''}`}
                        onClick={() => handleSelect(s)}
                      >
                        <div className="issue-student-avatar">
                          <img
                            src={s.photo_url ? `${s.photo_url}?v=${photoTimestamp}` : generateInitialsPhoto(s.student_name)}
                            alt=""
                          />
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
                              <DownloadIcon />
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
            <div className={`issue-preview-panel${mobilePane === 'list' ? ' issue-preview-panel--hidden' : ''}`}>
              {!selected ? (
                <div className="issue-no-selection">
                  <div className="issue-no-selection-icon"><IssueCardIcon /></div>
                  <p>Select a student from the list to preview their ID card</p>
                </div>
              ) : (
                <>
                  {/* Student info strip */}
                  <div className="issue-selected-banner">
                    <div className="issue-selected-avatar">
                      <img
                        src={selected.photo_url ? `${selected.photo_url}?v=${photoTimestamp}` : generateInitialsPhoto(selected.student_name)}
                        alt=""
                      />
                    </div>
                    <div className="issue-selected-info">
                      <div className="issue-selected-name">{(selected.student_name || '').toUpperCase()}</div>
                      <div className="issue-selected-meta">
                        {selected.admno} · Class {selected.student_class}-{selected.div}
                        {selected.parent_submitted && (
                          <span className="badge badge--green" style={{ marginLeft: 8 }}>Submitted</span>
                        )}
                      </div>
                    </div>
                    <div className="issue-selected-actions">
                      <button
                        type="button"
                        className="action-btn camera-btn"
                        onClick={handleCameraClick}
                        disabled={uploadingPhoto || fetchingPhoto}
                        title="Adjust photo"
                      >
                        {(uploadingPhoto || fetchingPhoto) ? '...' : <CameraIcon />}
                      </button>
                      <button
                        type="button"
                        className="primary-btn"
                        onClick={handleDownloadPDF}
                        disabled={downloadingPDF || !selected}
                      >
                        <DownloadIcon />
                        {downloadingPDF ? 'Generating...' : 'Download PDF'}
                      </button>
                    </div>
                  </div>

                  {/* Card preview */}
                  <div className="issue-preview-card">
                    <div className="issue-preview-label">Preview</div>
                    <div className="idt-preview-row">
                      <div ref={cardFrontRef}>
                        <IDCardFront student={selected} school={school} photoUrl={selected.photo_url ? `${selected.photo_url}?v=${photoTimestamp}` : null} />
                      </div>
                      <div ref={cardBackRef}>
                        <IDCardBack school={school} />
                      </div>
                    </div>
                  </div>

                  {/* Edit details */}
                  {selected.parent_submitted && (
                    <div className="idcard-edit-panel">
                      <div className="idcard-edit-panel-header">
                        <h2>Edit Details</h2>
                        <span className="idcard-edit-panel-sub">{selected.student_name}</span>
                      </div>
                      <div className="idcard-edit-grid">
                        {EDIT_FIELDS.map(({ name, label, type }) => (
                          <div className="idcard-field" key={name}>
                            <label htmlFor={`ef-${name}`}>{label}</label>
                            {type === 'select' ? (
                              <select
                                id={`ef-${name}`}
                                name={name}
                                value={editForm[name] || ''}
                                onChange={handleEditChange}
                                disabled={saving}
                                className="modal-select"
                              >
                                <option value="">Select {label}</option>
                                {houseGroups.map((g) => (
                                  <option key={g.id || g.name} value={g.name.toUpperCase()}>
                                    {g.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                id={`ef-${name}`}
                                type={type}
                                name={name}
                                value={editForm[name] || ''}
                                onChange={handleEditChange}
                                disabled={saving}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="idcard-edit-actions">
                        <button className="primary-btn" onClick={handleSave} disabled={saving}>
                          {saving ? 'Saving...' : '💾 Save Changes'}
                        </button>
                        <button
                          className="secondary-btn"
                          onClick={() => { setSelected(null); setSaveMsg(''); setMobilePane('list'); }}
                        >
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

      {/* ── Photo Crop Editor ── */}
      <PhotoCropEditor
        isOpen={photoCropData.show}
        imageData={photoCropData.imageData}
        existingPhotoUrl={photoCropData.existingPhotoUrl}
        onCropConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    </div>
  );
};

export default IssueIDCard;