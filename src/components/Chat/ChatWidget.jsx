import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchChatContacts, fetchChatHistory, uploadChatFile, getOrCreateChatRoom } from '../../services/api';
import './ChatWidget.scss';

const ChatWidget = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  
  const socketRef = useRef(null);
  const notificationSocketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const userType = localStorage.getItem('userType');
  const userId = localStorage.getItem('userId');
  const institutionId = localStorage.getItem('institutionId');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('openChat', handleOpenChat);
    return () => window.removeEventListener('openChat', handleOpenChat);
  }, []);

  useEffect(() => {
    if (isOpen && (userType === 'staff' || userType === 'parent')) {
      loadContacts();
      connectNotificationSocket();
    }
    return () => {
      if (notificationSocketRef.current) {
        notificationSocketRef.current.close();
      }
    };
  }, [isOpen, userType, userId, institutionId]);

  const connectNotificationSocket = () => {
    if (notificationSocketRef.current) return;

    const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const role = userType === 'staff' ? 'teacher' : 'parent';
    const wsUrl = `${wsScheme}://${window.location.hostname}:8000/ws/notifications/${role}/${userId}/`;
    
    notificationSocketRef.current = new WebSocket(wsUrl);

    notificationSocketRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'new_message') {
        // Update contact list unread count and last message
        setContacts(prev => prev.map(contact => {
          // Check if this message belongs to this contact
          // If sender is a student, we check student id. If sender is teacher, we check teacher id.
          const isSender = contact.id === data.sender_id && contact.role === data.sender_role;
          
          if (isSender) {
            // Only increment unread if this room is NOT currently active
            const isRoomActive = activeContact?.room_id === data.room_id;
            return {
              ...contact,
              last_message: data.message,
              unread_count: isRoomActive ? contact.unread_count : (contact.unread_count || 0) + 1,
              room_id: data.room_id // Update room_id if it was null
            };
          }
          return contact;
        }));
      }
    };

    notificationSocketRef.current.onclose = () => {
      notificationSocketRef.current = null;
      // Attempt to reconnect after 5 seconds
      setTimeout(connectNotificationSocket, 5000);
    };
  };

  useEffect(() => {
    if (activeContact) {
      loadHistory(activeContact.room_id);
      connectWebSocket(activeContact.room_id);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [activeContact]);

  const loadContacts = async () => {
    setIsLoading(true);
    setError('');
    
    // Get fresh values from localStorage
    const currentUserId = localStorage.getItem('userId');
    const currentInstId = localStorage.getItem('institutionId');
    const currentUserType = localStorage.getItem('userType');

    if (!currentUserId || !currentUserType) {
      setError('Session expired. Please log in again.');
      setIsLoading(false);
      return;
    }

    try {
      const role = currentUserType === 'staff' ? 'teacher' : 'parent';
      const response = await fetchChatContacts({
        role,
        user_id: currentUserId,
        institution_id: currentInstId
      });
      
      if (response.data.status) {
        setContacts(response.data.contacts);
      } else {
        setError(response.data.message || 'Failed to load contacts');
      }
    } catch (err) {
      console.error('Failed to load contacts', err);
      const msg = err.response?.data?.message || err.message || 'Connection error. Please try again.';
      setError(msg);
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
    }

    const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
    // Using current hostname and port 8000 for backend
    const wsUrl = `${wsScheme}://${window.location.hostname}:8000/ws/chat/${roomId}/`;
    
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      const role = userType === 'staff' ? 'teacher' : 'student';
      socketRef.current.send(JSON.stringify({
        type: 'init',
        user_id: parseInt(userId),
        role: role
      }));
    };

    socketRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'chat_message') {
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          if (prev.find(m => m.id === data.id)) return prev;
          return [...prev, {
            id: data.id,
            sender_id: data.sender_id,
            sender_role: data.sender_role,
            content: data.message,
            created_at: data.created_at,
            attachments: data.attachments || []
          }];
        });
      } else if (data.type === 'typing') {
        if (data.sender_id !== parseInt(userId) || data.sender_role !== (userType === 'staff' ? 'teacher' : 'student')) {
          setOtherUserTyping(data.is_typing);
        }
      }
    };

    socketRef.current.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    socketRef.current.onclose = () => {
      console.log('WebSocket disconnected');
    };
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) return;

    const role = userType === 'staff' ? 'teacher' : 'student';
    socketRef.current.send(JSON.stringify({
      type: 'chat_message',
      message: newMessage,
      sender_id: parseInt(userId),
      sender_role: role
    }));

    setNewMessage('');
    sendTypingStatus(false);
  };

  const sendTypingStatus = (typing) => {
    if (socketRef.current && isTyping !== typing) {
      setIsTyping(typing);
      const role = userType === 'staff' ? 'teacher' : 'student';
      socketRef.current.send(JSON.stringify({
        type: 'typing',
        is_typing: typing,
        sender_id: parseInt(userId),
        sender_role: role
      }));
    }
  };

  const handleFileUpload = async (fileToUpload = null) => {
    const file = fileToUpload || fileInputRef.current.files[0];
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
    // Reset unread count for this contact
    setContacts(prev => prev.map(c => 
      c.id === contact.id ? { ...c, unread_count: 0 } : c
    ));

    if (contact.room_id) {
      setActiveContact(contact);
    } else {
      // Create room on the fly
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

  if (userType !== 'staff' && userType !== 'parent') return null;
  if (location.pathname === '/chat') return null;

  return (
    <div className={`chat-widget ${isOpen ? 'open' : ''} ${isFullScreen ? 'full-screen' : ''}`}>
      <div className="chat-trigger" onClick={() => {
        setIsOpen(!isOpen);
        if (isOpen) setIsFullScreen(false);
      }} title="Chat with Students/Teachers">
        {isOpen ? (
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        )}
      </div>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            {activeContact ? (
              <div className="active-contact-info">
                <button className="back-btn" onClick={() => setActiveContact(null)}>
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <div className="header-text">
                  <span className="contact-name">{activeContact.name}</span>
                  {otherUserTyping && <span className="typing-indicator">typing...</span>}
                </div>
              </div>
            ) : (
              <span className="header-title">Messages</span>
            )}
            <div className="header-actions">
              <button className="fullscreen-btn" onClick={() => navigate('/chat')} title="Open Full Screen">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path></svg>
              </button>
            </div>
          </div>

          <div className="chat-body">
            {!activeContact ? (
              <div className="contact-list">
                {isLoading ? (
                  <div className="chat-loading">Loading contacts...</div>
                ) : error ? (
                  <div className="chat-error">
                    <p>{error}</p>
                    <button onClick={loadContacts}>Retry</button>
                  </div>
                ) : contacts.length > 0 ? contacts.map(contact => (
                  <div key={contact.id} className="contact-item" onClick={() => handleContactSelect(contact)}>
                    <div className="contact-avatar">
                      {contact.name[0]}
                      {contact.is_online && <div className="online-indicator"></div>}
                    </div>
                    <div className="contact-details">
                      <div className="contact-name">{contact.name}</div>
                      {contact.role === 'student' && (
                        <div className="contact-class">Class: {contact.class} {contact.div}</div>
                      )}
                      <div className="contact-last-msg">{contact.last_message || 'Start a conversation'}</div>
                    </div>
                    {contact.unread_count > 0 && <div className="unread-badge">{contact.unread_count}</div>}
                  </div>
                )) : (
                  <div className="no-contacts">
                    <p>No {userType === 'staff' ? 'students' : 'teachers'} assigned to your class.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="message-list">
                {messages.length === 0 && <div className="no-messages">No messages yet. Say hi!</div>}
                {messages.map((msg, idx) => (
                  <div key={msg.id || idx} className={`message-item ${msg.sender_id === parseInt(userId) && msg.sender_role === (userType === 'staff' ? 'teacher' : 'student') ? 'sent' : 'received'}`}>
                    <div className="message-content">
                      {msg.content && <div className="text-content">{msg.content}</div>}
                      {msg.attachments && msg.attachments.map((att, i) => (
                        <div key={i} className="attachment-preview">
                          {att.file_type.startsWith('audio/') ? (
                            <div className="audio-wrapper">
                              <audio controls className="message-audio" preload="metadata">
                                <source src={att.file_url} type={att.file_type} />
                                Your browser does not support the audio element.
                              </audio>
                              <a href={att.file_url} download={att.file_name} className="audio-download">
                                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                              </a>
                            </div>
                          ) : att.file_type.startsWith('image/') ? (
                            <div className="image-wrapper">
                              <img src={att.file_url} alt={att.file_name} className="message-image" onClick={() => window.open(att.file_url, '_blank')} />
                            </div>
                          ) : (
                            <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="file-link">
                              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" style={{marginRight: '5px'}}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                              {att.file_name}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="message-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {activeContact && (
            <div className="chat-footer">
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={() => handleFileUpload()}
              />
              <button className="attach-btn" onClick={() => fileInputRef.current.click()} title="Attach file">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              </button>
              
              {isRecording ? (
                <div className="recording-ui">
                  <div className="recording-dot"></div>
                  <span className="recording-time">{formatTime(recordingTime)}</span>
                  <button className="stop-recording-btn" onClick={stopRecording}>
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><rect x="6" y="6" width="12" height="12"></rect></svg>
                  </button>
                </div>
              ) : (
                <button className="mic-btn" onClick={startRecording} title="Record voice message">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                </button>
              )}

              <input 
                type="text" 
                placeholder={isRecording ? "Recording..." : "Type a message..."}
                disabled={isRecording}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  sendTypingStatus(true);
                  // Reset typing status after 3 seconds of inactivity
                  if (window.typingTimeout) clearTimeout(window.typingTimeout);
                  window.typingTimeout = setTimeout(() => sendTypingStatus(false), 3000);
                }}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button className="send-btn" onClick={sendMessage} disabled={!newMessage.trim()} title="Send message">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
