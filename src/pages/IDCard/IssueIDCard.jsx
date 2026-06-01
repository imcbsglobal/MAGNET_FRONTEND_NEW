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

  // Convert image URL to base64 data URL
  const imageToDataURL = async (url) => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Failed to convert image to data URL:', url, error);
      return null;
    }
  };

  // Preprocess images in the element to convert external URLs to data URLs
  const preprocessImages = async (element) => {
    const images = element.querySelectorAll('img');
    const promises = Array.from(images).map(async (img) => {
      if (img.src && !img.src.startsWith('data:') && !img.src.startsWith(window.location.origin)) {
        try {
          const dataUrl = await imageToDataURL(img.src);
          if (dataUrl) {
            img.src = dataUrl;
          }
        } catch (error) {
          console.warn('Failed to preprocess image:', img.src, error);
        }
      }
    });
    await Promise.all(promises);
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

  const handleDownloadPDF = async () => {
    if (!selected || !cardFrontRef.current || !cardBackRef.current) return;
    
    setDownloadingPDF(true);
    setSaveMsg('');
    
    try {
      // Preprocess images to convert external URLs to data URLs
      await preprocessImages(cardFrontRef.current);
      await preprocessImages(cardBackRef.current);
      
      // Wait for preprocessing to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Enhanced html2canvas options for better image handling
      const canvasOptions = {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true,
        imageTimeout: 30000,
        height: cardFrontRef.current.offsetHeight,
        width: cardFrontRef.current.offsetWidth,
        onclone: (clonedDoc) => {
          // Ensure all images have proper attributes
          const images = clonedDoc.querySelectorAll('img');
          images.forEach(img => {
            img.crossOrigin = 'anonymous';
            // Force image to be visible
            img.style.opacity = '1';
            img.style.visibility = 'visible';
          });
        }
      };

      console.log('Capturing front card...');
      const frontCanvas = await html2canvas(cardFrontRef.current, canvasOptions);
      console.log('Front canvas created:', frontCanvas.width, 'x', frontCanvas.height);

      console.log('Capturing back card...');
      const backCanvas = await html2canvas(cardBackRef.current, {
        ...canvasOptions,
        height: cardBackRef.current.offsetHeight,
        width: cardBackRef.current.offsetWidth
      });
      console.log('Back canvas created:', backCanvas.width, 'x', backCanvas.height);

      // Calculate dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const cardWidth = 70;
      const cardHeight = (frontCanvas.height / frontCanvas.width) * cardWidth;
      
      const margin = 15;
      const frontX = margin;
      const backX = pageWidth - cardWidth - margin;
      const cardY = (pageHeight - cardHeight) / 2;

      // Convert canvas to blob first, then to data URL to avoid taint issues
      const frontBlob = await new Promise(resolve => frontCanvas.toBlob(resolve, 'image/png', 1.0));
      const frontDataUrl = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(frontBlob);
      });

      const backBlob = await new Promise(resolve => backCanvas.toBlob(resolve, 'image/png', 1.0));
      const backDataUrl = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(backBlob);
      });

      console.log('Front data URL length:', frontDataUrl.length);
      console.log('Back data URL length:', backDataUrl.length);

      // Add front card
      pdf.addImage(frontDataUrl, 'PNG', frontX, cardY, cardWidth, cardHeight);

      // Add back card
      pdf.addImage(backDataUrl, 'PNG', backX, cardY, cardWidth, cardHeight);

      // Add labels
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FRONT', frontX + cardWidth/2 - 10, cardY - 8);
      pdf.text('BACK', backX + cardWidth/2 - 8, cardY - 8);

      // Add student info
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const studentInfo = `${selected.student_name || 'N/A'} - Adm No: ${selected.admno || 'N/A'} - Class: ${selected.student_class || 'N/A'}-${selected.div || 'N/A'}`;
      pdf.text(studentInfo, pageWidth/2 - (studentInfo.length * 1.2), cardY + cardHeight + 15);

      // Download PDF
      const fileName = `ID_Card_${selected.student_name?.replace(/[^a-zA-Z0-9]/g, '_') || selected.admno}.pdf`;
      pdf.save(fileName);
      
      setSaveMsg('✅ ID Card PDF downloaded successfully.');
    } catch (err) {
      console.error('PDF generation error:', err);
      setSaveMsg('❌ Failed to generate PDF: ' + err.message);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleBulkDownloadPDF = async () => {
    const submittedStudents = filtered.filter(s => s.parent_submitted);
    if (submittedStudents.length === 0) return;

    setDownloadingPDF(true);
    setSaveMsg('');

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const canvasOptions = {
        scale: 2,
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
      };

      let isFirstPage = true;

      for (let i = 0; i < submittedStudents.length; i++) {
        const student = submittedStudents[i];
        
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;

        // Select student to render cards
        setSelected(student);
        setEditForm({ ...(student.details || {}) });
        
        // Wait for state update
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (cardFrontRef.current && cardBackRef.current) {
          console.log(`Processing student ${i + 1}/${submittedStudents.length}: ${student.student_name}`);
          
          // Preprocess images for this student
          await preprocessImages(cardFrontRef.current);
          await preprocessImages(cardBackRef.current);
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Capture cards
          const frontCanvas = await html2canvas(cardFrontRef.current, {
            ...canvasOptions,
            height: cardFrontRef.current.offsetHeight,
            width: cardFrontRef.current.offsetWidth
          });

          const backCanvas = await html2canvas(cardBackRef.current, {
            ...canvasOptions,
            height: cardBackRef.current.offsetHeight,
            width: cardBackRef.current.offsetWidth
          });

          // Convert to blobs to avoid taint issues
          const frontBlob = await new Promise(resolve => frontCanvas.toBlob(resolve, 'image/png', 1.0));
          const frontDataUrl = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(frontBlob);
          });

          const backBlob = await new Promise(resolve => backCanvas.toBlob(resolve, 'image/png', 1.0));
          const backDataUrl = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(backBlob);
          });

          // Calculate dimensions
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          
          const cardWidth = 70;
          const cardHeight = (frontCanvas.height / frontCanvas.width) * cardWidth;
          
          const margin = 15;
          const frontX = margin;
          const backX = pageWidth - cardWidth - margin;
          const cardY = (pageHeight - cardHeight) / 2;

          // Add cards to PDF
          pdf.addImage(frontDataUrl, 'PNG', frontX, cardY, cardWidth, cardHeight);
          pdf.addImage(backDataUrl, 'PNG', backX, cardY, cardWidth, cardHeight);

          // Add labels and student info
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('FRONT', frontX + cardWidth/2 - 10, cardY - 8);
          pdf.text('BACK', backX + cardWidth/2 - 8, cardY - 8);
          
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const studentInfo = `${student.student_name || 'N/A'} - Adm No: ${student.admno || 'N/A'} - Class: ${student.student_class || 'N/A'}-${student.div || 'N/A'}`;
          pdf.text(studentInfo, pageWidth/2 - (studentInfo.length * 1.2), cardY + cardHeight + 15);
          
          // Add page number
          pdf.setFontSize(8);
          pdf.text(`Page ${i + 1} of ${submittedStudents.length}`, pageWidth - 30, pageHeight - 10);
        }
      }

      // Download bulk PDF
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
