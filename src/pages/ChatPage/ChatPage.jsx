import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchChatContacts, fetchChatHistory, uploadChatFile, getOrCreateChatRoom, sendBulkMessage } from '../../services/api';
import './ChatPage.scss';

const ChatPage = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [downloadingUrl, setDownloadingUrl] = useState(null);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [bulkMessage, setBulkMessage] = useState('');
  const [socketReady, setSocketReady] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const socketRef = useRef(null);
  const notificationSocketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingMessageRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const activeContactRef = useRef(null);

  const userType = localStorage.getItem('userType');
  const userId = localStorage.getItem('userId');
  const institutionId = localStorage.getItem('institutionId');

  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keep activeContactRef in sync
  useEffect(() => {
    activeContactRef.current = activeContact;
  }, [activeContact]);

  useEffect(() => {
    if (userType === 'staff' || userType === 'parent') {
      loadContacts();
      connectNotificationSocket();
    } else {
      navigate('/');
    }
    return () => {
      if (notificationSocketRef.current) {
        notificationSocketRef.current.close();
      }
    };
  }, [userType]);

  const connectNotificationSocket = () => {
    if (notificationSocketRef.current) return;

    const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const role = userType === 'staff' ? 'teacher' : 'student';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const wsUrl = isLocalhost
      ? `${wsScheme}://${window.location.hostname}:8000/ws/notifications/${role}/${userId}/`
      : `${wsScheme}://${window.location.hostname}/ws/notifications/${role}/${userId}/`;

    notificationSocketRef.current = new WebSocket(wsUrl);

    notificationSocketRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'new_message') {
        setContacts(prev => {
          const updatedContacts = prev.map(contact => {
            const isSender = contact.id === data.sender_id && contact.role === data.sender_role;
            if (isSender) {
              const isRoomActive = activeContactRef.current?.room_id === data.room_id;
              return {
                ...contact,
                last_message: data.message,
                unread_count: isRoomActive ? contact.unread_count : (contact.unread_count || 0) + 1,
                room_id: data.room_id,
                last_message_time: data.created_at
              };
            }
            return contact;
          });
          return [...updatedContacts].sort((a, b) =>
            new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0)
          );
        });
      }
    };

    notificationSocketRef.current.onclose = () => {
      notificationSocketRef.current = null;
      setTimeout(connectNotificationSocket, 5000);
    };
  };

  useEffect(() => {
    if (activeContact) {
      setSocketReady(false);
      loadHistory(activeContact.room_id);
      connectWebSocket(activeContact.room_id);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [activeContact]);

  const loadContacts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const role = userType === 'staff' ? 'teacher' : 'parent';
      const response = await fetchChatContacts({
        role,
        user_id: userId,
        institution_id: institutionId
      });
      if (response.data.status) {
        setContacts(response.data.contacts);
      } else {
        setError(response.data.message || 'Failed to load contacts');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async (roomId) => {
    try {
      const role = userType === 'staff' ? 'teacher' : 'student';
      const response = await fetchChatHistory(roomId, role);
      if (response.data.status) {
        setMessages(response.data.messages);
      }
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  const connectWebSocket = (roomId) => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const wsUrl = isLocalhost
      ? `${wsScheme}://${window.location.hostname}:8000/ws/chat/${roomId}/`
      : `${wsScheme}://${window.location.hostname}/ws/chat/${roomId}/`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected to room:", roomId);
      const role = userType === 'staff' ? 'teacher' : 'student';
      ws.send(JSON.stringify({
        type: 'init',
        user_id: parseInt(userId),
        role: role
      }));
      setSocketReady(true);

      // Send any pending message that was queued before socket opened
      if (pendingMessageRef.current) {
        const { text, sId, role: pendingRole } = pendingMessageRef.current;
        pendingMessageRef.current = null;
        try {
          ws.send(JSON.stringify({
            type: 'chat_message',
            message: text,
            sender_id: sId,
            sender_role: pendingRole
          }));
        } catch (err) {
          console.error("Failed to send pending message:", err);
        }
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket Error:", err);
      setSocketReady(false);
    };

    ws.onclose = (e) => {
      console.log("WebSocket closed:", e.code, e.reason);
      setSocketReady(false);
      if (socketRef.current === ws) {
        socketRef.current = null;
      }
      // Reconnect only if this room is still active
      if (activeContactRef.current?.room_id === roomId) {
        console.log("Attempting to reconnect...");
        setTimeout(() => connectWebSocket(roomId), 3000);
      }
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'chat_message') {
        setMessages(prev => {
          const filtered = prev.filter(m => !m.isTemp || m.content !== data.message);
          if (filtered.find(m => m.id === data.id)) return filtered;
          return [...filtered, {
            id: data.id,
            sender_id: data.sender_id,
            sender_role: data.sender_role,
            content: data.message,
            created_at: data.created_at,
            attachments: data.attachments || []
          }];
        });

        setContacts(prev => {
          const updatedContacts = prev.map(contact => {
            if (contact.room_id === roomId) {
              return {
                ...contact,
                last_message: data.message,
                last_message_time: data.created_at
              };
            }
            return contact;
          });
          return [...updatedContacts].sort((a, b) =>
            new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0)
          );
        });
      } else if (data.type === 'typing') {
        const myRole = userType === 'staff' ? 'teacher' : 'student';
        if (data.sender_id !== parseInt(userId) || data.sender_role !== myRole) {
          setOtherUserTyping(data.is_typing);
        }
      }
    };
  };

  const sendTypingStatus = (typing) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    if (isTypingRef.current === typing) return;
    isTypingRef.current = typing;
    const role = userType === 'staff' ? 'teacher' : 'student';
    try {
      socketRef.current.send(JSON.stringify({
        type: 'typing',
        is_typing: typing,
        sender_id: parseInt(userId),
        sender_role: role
      }));
    } catch (err) {
      console.error("Failed to send typing status:", err);
    }
  };

  const sendMessage = useCallback(() => {
    const text = newMessage.trim();
    if (!text) return;

    const role = userType === 'staff' ? 'teacher' : 'student';
    const sId = parseInt(userId);

    // Optimistic UI update
    const tempId = 'temp-' + Date.now();
    const tempMsg = {
      id: tempId,
      sender_id: sId,
      sender_role: role,
      content: text,
      created_at: new Date().toISOString(),
      attachments: [],
      isTemp: true
    };

    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
    sendTypingStatus(false);

    const doSend = (ws) => {
      try {
        ws.send(JSON.stringify({
          type: 'chat_message',
          message: text,
          sender_id: sId,
          sender_role: role
        }));
      } catch (err) {
        console.error("Failed to send message:", err);
        setMessages(prev => prev.map(m =>
          m.id === tempId ? { ...m, isTemp: false, isFailed: true } : m
        ));
      }
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      doSend(socketRef.current);
    } else {
      // Socket not ready — queue it and reconnect
      console.warn("WebSocket not open, queuing message and reconnecting...");
      pendingMessageRef.current = { text, sId, role };
      if (activeContact) {
        connectWebSocket(activeContact.room_id);
      } else {
        setMessages(prev => prev.map(m =>
          m.id === tempId ? { ...m, isTemp: false, isFailed: true } : m
        ));
      }
    }
  }, [newMessage, userType, userId, activeContact]);

  const handleFileUpload = async (fileToUpload = null) => {
    const file = fileToUpload || (fileInputRef.current?.files ? fileInputRef.current.files[0] : null);
    if (!file || !activeContact) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('room_id', activeContact.room_id);
    formData.append('sender_id', userId);
    formData.append('sender_role', userType === 'staff' ? 'teacher' : 'student');

    try {
      const response = await uploadChatFile(formData);
      if (response.data.status) {
        loadHistory(activeContact.room_id);
      }
    } catch (err) {
      console.error('File upload failed', err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_message_${Date.now()}.webm`, { type: 'audio/webm' });
        handleFileUpload(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleContactSelect = async (contact) => {
    if (contact.room_id) {
      setActiveContact(contact);
    } else {
      setIsLoading(true);
      try {
        const teacher_id = userType === 'staff' ? userId : contact.id;
        const student_id = userType === 'parent' ? userId : contact.id;
        const response = await getOrCreateChatRoom({ teacher_id, student_id });
        if (response.data.status) {
          setActiveContact({ ...contact, room_id: response.data.room_id });
        }
      } catch (err) {
        console.error('Failed to create room', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredContacts.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredContacts.map(c => c.id));
    }
  };

  const onSendBulkMessage = async () => {
    if (!bulkMessage.trim() || selectedStudents.length === 0) return;

    setIsLoading(true);
    try {
      const response = await sendBulkMessage({
        student_ids: selectedStudents,
        teacher_id: parseInt(userId),
        content: bulkMessage
      });

      if (response.data.status) {
        setBulkMessage('');
        setSelectedStudents([]);
        setIsBulkMode(false);
        loadContacts();
        alert(response.data.message);
      }
    } catch (err) {
      console.error('Bulk message failed', err);
      alert('Failed to send bulk message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (url, fileName) => {
    if (downloadingUrl) return;
    setDownloadingUrl(url);

    try {
      const response = await fetch(url, { method: 'GET', mode: 'cors' });
      if (!response.ok) throw new Error('Network response was not ok');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        setDownloadingUrl(null);
      }, 100);
    } catch (err) {
      console.error('Blob download failed, falling back to direct link:', err);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'download');
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadingUrl(null);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    sendTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTypingStatus(false), 3000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType={userType === 'staff' ? 'teacher' : 'parent'} />
      <main className="dashboard-main chat-layout-override">
        <Navbar placeholder="Search messages..." />

        <div className="chat-page-container">
          <div className={`chat-sidebar ${activeContact ? 'hidden' : ''}`}>
            <div className="sidebar-header">
              <div className="header-top">
                <h3>Messages</h3>
                {userType === 'staff' && (
                  <button
                    className={`bulk-toggle-btn ${isBulkMode ? 'active' : ''}`}
                    onClick={() => {
                      setIsBulkMode(!isBulkMode);
                      setSelectedStudents([]);
                      setActiveContact(null);
                    }}
                    title={isBulkMode ? "Exit Bulk Mode" : "Send message to multiple students"}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </button>
                )}
              </div>
              <div className="search-box">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {isBulkMode && filteredContacts.length > 0 && (
                <div className="select-all-container">
                  <button className="select-all-btn" onClick={handleSelectAll}>
                    <div className={`checkbox-box ${selectedStudents.length === filteredContacts.length ? 'checked' : ''}`}>
                      {selectedStudents.length === filteredContacts.length && (
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                    <span>{selectedStudents.length === filteredContacts.length ? 'Deselect All' : 'Select All Students'}</span>
                  </button>
                </div>
              )}
            </div>
            <div className="contact-list">
              {isLoading && !contacts.length ? (
                <div className="chat-state-msg">Loading...</div>
              ) : error ? (
                <div className="chat-state-msg error">{error}</div>
              ) : filteredContacts.length > 0 ? (
                filteredContacts.map(contact => (
                  <div
                    key={contact.id}
                    className={`contact-item ${activeContact?.id === contact.id ? 'active' : ''} ${isBulkMode && selectedStudents.includes(contact.id) ? 'selected' : ''}`}
                    onClick={() => isBulkMode ? handleStudentSelect(contact.id) : handleContactSelect(contact)}
                  >
                    {isBulkMode && (
                      <div className="bulk-checkbox">
                        <div className={`checkbox-box ${selectedStudents.includes(contact.id) ? 'checked' : ''}`}>
                          {selectedStudents.includes(contact.id) && (
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="contact-avatar">
                      {contact.name[0]}
                      {contact.is_online && <div className="online-indicator"></div>}
                    </div>
                    <div className="contact-info">
                      <div className="contact-name">
                        {contact.name}
                        {contact.unread_count > 0 && <span className="unread-badge">{contact.unread_count}</span>}
                      </div>
                      {contact.role === 'student' && <div className="contact-class">Class: {contact.class} {contact.div}</div>}
                      <div className="contact-last-msg">{contact.last_message || 'No messages'}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="chat-state-msg">No contacts found</div>
              )}
            </div>
          </div>

          <div className={`chat-main ${activeContact || isBulkMode ? 'active' : ''}`}>
            {isBulkMode ? (
              <div className="bulk-message-container">
                <div className="bulk-header">
                  <h3>Send Message to {selectedStudents.length} Students</h3>
                  <p>All selected students will receive this message individually.</p>
                </div>
                <div className="bulk-content">
                  <div className="selected-count-badge">
                    {selectedStudents.length} students selected
                  </div>
                  <textarea
                    placeholder="Type your bulk message here..."
                    value={bulkMessage}
                    onChange={(e) => setBulkMessage(e.target.value)}
                  />
                  <div className="bulk-actions">
                    <button
                      className="cancel-btn"
                      onClick={() => {
                        setIsBulkMode(false);
                        setSelectedStudents([]);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="send-bulk-btn"
                      disabled={!bulkMessage.trim() || selectedStudents.length === 0 || isLoading}
                      onClick={onSendBulkMessage}
                    >
                      {isLoading ? 'Sending...' : `Send to ${selectedStudents.length} Students`}
                    </button>
                  </div>
                </div>
              </div>
            ) : activeContact ? (
              <>
                <div className="chat-header">
                  <div className="active-user-info">
                    <button className="mobile-back-btn" onClick={() => setActiveContact(null)}>
                      <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    <div className="avatar">{activeContact.name[0]}</div>
                    <div className="details">
                      <h4>{activeContact.name}</h4>
                      <p className={activeContact.is_online ? 'online' : 'offline'}>
                        {otherUserTyping ? 'typing...' : activeContact.is_online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  {downloadingUrl && (
                    <div className="download-status">
                      <div className="spinner"></div>
                      <span>Downloading file...</span>
                    </div>
                  )}
                </div>

                <div className="message-area">
                  {messages.map((msg, idx) => {
                    const msgDate = new Date(msg.created_at);
                    const prevMsgDate = idx > 0 ? new Date(messages[idx - 1].created_at) : null;
                    const showDateSeparator = !prevMsgDate || msgDate.toDateString() !== prevMsgDate.toDateString();

                    const isToday = msgDate.toDateString() === new Date().toDateString();
                    const isYesterday = msgDate.toDateString() === new Date(Date.now() - 86400000).toDateString();

                    let dateStr = msgDate.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
                    if (isToday) dateStr = 'Today';
                    else if (isYesterday) dateStr = 'Yesterday';

                    const isSentByMe = msg.sender_id === parseInt(userId) && msg.sender_role === (userType === 'staff' ? 'teacher' : 'student');

                    return (
                      <React.Fragment key={msg.id || idx}>
                        {showDateSeparator && (
                          <div className="date-separator">
                            <span>{dateStr}</span>
                          </div>
                        )}
                        <div className={`message-row ${isSentByMe ? 'sent' : 'received'}`}>
                          <div className={`message-bubble ${msg.isTemp ? 'temp' : ''} ${msg.isFailed ? 'failed' : ''}`}>
                            {msg.content && <div className="content">{msg.content}</div>}
                            {msg.isFailed && <div className="error-icon" title="Failed to send">!</div>}
                            {msg.attachments?.map((att, i) => (
                              <div key={i} className="attachment-wrapper">
                                {att.file_type.startsWith('audio/') ? (
                                  <div className="audio-message-container">
                                    <audio controls className="audio-player" preload="metadata">
                                      <source src={att.file_url} type={att.file_type} />
                                      Your browser does not support the audio element.
                                    </audio>
                                    <button
                                      onClick={() => handleDownload(att.file_url, att.file_name)}
                                      className={`audio-download-link ${downloadingUrl === att.file_url ? 'downloading' : ''}`}
                                      title="Download Audio"
                                      disabled={downloadingUrl === att.file_url}
                                    >
                                      {downloadingUrl === att.file_url ? (
                                        <div className="button-spinner"></div>
                                      ) : (
                                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                          <polyline points="7 10 12 15 17 10"></polyline>
                                          <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                      )}
                                    </button>
                                  </div>
                                ) : att.file_type.startsWith('image/') ? (
                                  <div className="image-message-container">
                                    <img src={att.file_url} alt={att.file_name} className="chat-image" onClick={() => window.open(att.file_url, '_blank')} />
                                    <button
                                      onClick={() => handleDownload(att.file_url, att.file_name)}
                                      className={`image-download-btn ${downloadingUrl === att.file_url ? 'downloading' : ''}`}
                                      title="Download Image"
                                      disabled={downloadingUrl === att.file_url}
                                    >
                                      {downloadingUrl === att.file_url ? (
                                        <div className="button-spinner"></div>
                                      ) : (
                                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                          <polyline points="7 10 12 15 17 10"></polyline>
                                          <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="file-attachment-container">
                                    <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="file-attachment">
                                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                        <polyline points="13 2 13 9 20 9"></polyline>
                                      </svg>
                                      <span className="file-name">{att.file_name}</span>
                                    </a>
                                    <button
                                      onClick={() => handleDownload(att.file_url, att.file_name)}
                                      className={`file-download-icon ${downloadingUrl === att.file_url ? 'downloading' : ''}`}
                                      title="Download File"
                                      disabled={downloadingUrl === att.file_url}
                                    >
                                      {downloadingUrl === att.file_url ? (
                                        <div className="button-spinner"></div>
                                      ) : (
                                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                          <polyline points="7 10 12 15 17 10"></polyline>
                                          <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                            <div className="msg-meta">
                              <span className="time">{msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isSentByMe && (
                                <span className={`status ${msg.is_read ? 'read' : 'sent'}`}>
                                  {msg.is_read ? (
                                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                      <polyline points="20 12 9 23 4 18" style={{ transform: 'translateY(-6px)' }}></polyline>
                                    </svg>
                                  ) : (
                                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-area">
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={() => handleFileUpload()} />
                  <button className="icon-btn" onClick={() => fileInputRef.current.click()} title="Attach file">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                    </svg>
                  </button>

                  {isRecording ? (
                    <div className="recording-ui">
                      <div className="recording-dot"></div>
                      <span className="recording-time">{formatTime(recordingTime)}</span>
                      <button className="stop-btn" onClick={stopRecording}>
                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                          <rect x="6" y="6" width="12" height="12"></rect>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button className="icon-btn mic-btn" onClick={startRecording} title="Record voice message">
                      <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                      </svg>
                    </button>
                  )}

                  <div className="input-wrapper">
                    <input
                      type="text"
                      placeholder={isRecording ? "Recording audio..." : "Type your message..."}
                      disabled={isRecording}
                      value={newMessage}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                    />
                  </div>

                  <button className="send-btn" onClick={sendMessage} disabled={!newMessage.trim()}>
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div className="no-chat-selected">
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" width="64" height="64" stroke="#e0e0e0" strokeWidth="1" fill="none">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <p>Select a contact to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;