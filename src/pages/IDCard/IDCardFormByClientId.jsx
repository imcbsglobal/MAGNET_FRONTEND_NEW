import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchIDCardFormStatus } from '../../services/api';
import IDCardParentForm from './IDCardParentForm';
import './IDCard.scss';

const IDCardFormByClientId = () => {
  const { clientId } = useParams();
  const [isValidClient, setIsValidClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [schoolName, setSchoolName] = useState('');

  useEffect(() => {
    const checkFormStatus = async () => {
      if (clientId && clientId.length > 0) {
        try {
          const res = await fetchIDCardFormStatus(clientId);
          if (res.data.enabled) {
            setIsValidClient(true);
            setSchoolName(res.data.school_name || clientId);
          } else {
            setError('ID card form is currently disabled for this institution.');
          }
        } catch (err) {
          if (err.response?.status === 404) {
            setError('Institution not found.');
          } else {
            setError('Unable to verify form status. Please try again later.');
          }
        }
      } else {
        setError('Invalid client ID in URL');
      }
      setLoading(false);
    };

    checkFormStatus();
  }, [clientId]);

  if (loading) {
    return (
      <div className="form-container">
        <div className="form-card">
          <div className="form-header">
            <h1>Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error || !isValidClient) {
    return (
      <div className="form-container">
        <div className="form-card">
          <div className="form-header">
            <h1>Invalid Link</h1>
            <p style={{ color: '#e74c3c', marginTop: '10px' }}>
              {error || 'This ID card form link is not valid.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="form-card">
        <div className="form-header">
          <h1>ID Card Form</h1>
          <p>Fill out the form below to submit your student's ID card details.</p>
          <div className="client-info" style={{ 
            marginTop: '15px', 
            padding: '12px', 
            background: '#e7f3ff', 
            borderRadius: '8px',
            fontSize: '14px',
            color: '#0066cc',
            border: '1px solid #b3d9ff'
          }}>
            <strong>🏫 {schoolName}</strong>
            <br />
            <small style={{ color: '#0052cc' }}>Institution ID: {clientId}</small>
          </div>
        </div>
        
        {/* Use the existing IDCardParentForm component but pass clientId */}
        <IDCardParentForm 
          institutionId={clientId} 
          isClientIdForm={true}
        />
      </div>
    </div>
  );
};

export default IDCardFormByClientId;