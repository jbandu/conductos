import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import EmployeeLayout from '../../components/employee/EmployeeLayout';
import { api } from '../../services/api';

// Status badge component
function StatusBadge({ status }) {
  const statusConfig = {
    new: { color: 'bg-blue-100 text-blue-800', label: 'New' },
    under_review: { color: 'bg-yellow-100 text-yellow-800', label: 'Under Review' },
    conciliation: { color: 'bg-purple-100 text-purple-800', label: 'Conciliation' },
    investigating: { color: 'bg-orange-100 text-orange-800', label: 'Investigating' },
    decision_pending: { color: 'bg-indigo-100 text-indigo-800', label: 'Decision Pending' },
    closed: { color: 'bg-green-100 text-green-800', label: 'Closed' }
  };

  const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

// Timeline event component
function TimelineEvent({ event, isLast }) {
  const eventIcons = {
    complaint_filed: { icon: '📝', color: 'bg-green-500' },
    acknowledgment_sent: { icon: '📧', color: 'bg-blue-500' },
    status_changed: { icon: '🔄', color: 'bg-yellow-500' },
    evidence_added: { icon: '📎', color: 'bg-purple-500' },
    message_received: { icon: '💬', color: 'bg-teal-500' },
    assigned: { icon: '👤', color: 'bg-indigo-500' }
  };

  const config = eventIcons[event.event_type] || { icon: '•', color: 'bg-gray-500' };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center text-white text-lg`}>
          {config.icon}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-2" />}
      </div>
      <div className="flex-1 pb-6">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">{event.event_title}</h4>
          <span className="text-sm text-gray-500">
            {new Date(event.created_at).toLocaleString()}
          </span>
        </div>
        {event.event_description && (
          <p className="text-sm text-gray-600 mt-1">{event.event_description}</p>
        )}
      </div>
    </div>
  );
}

// Message component
function Message({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isOwn ? 'order-2' : ''}`}>
        <div className={`rounded-xl px-4 py-3 ${
          isOwn ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-900'
        }`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${isOwn ? 'justify-end' : ''}`}>
          <span>{message.sender_display_name}</span>
          <span>{new Date(message.created_at).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}

export default function CaseDetail() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);

  const [activeTab, setActiveTab] = useState('timeline');
  const [caseData, setCaseData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [messages, setMessages] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  useEffect(() => {
    if (location.state?.justCreated) {
      setShowSuccessBanner(true);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    fetchCaseData();
  }, [caseId]);

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchMessages();
    } else if (activeTab === 'documents') {
      fetchEvidence();
    } else if (activeTab === 'timeline') {
      fetchTimeline();
    }
  }, [activeTab, caseId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchCaseData = async () => {
    try {
      setIsLoading(true);
      const data = await api.getEmployeeCaseDetail(caseId);
      setCaseData(data);
      // Also fetch timeline by default
      await fetchTimeline();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      const data = await api.getCaseTimeline(caseId);
      setTimeline(data.timeline || []);
    } catch (err) {
      console.error('Error fetching timeline:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await api.getCaseMessages(caseId);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const fetchEvidence = async () => {
    try {
      const data = await api.getCaseEvidence(caseId);
      setEvidence(data.evidence || []);
    } catch (err) {
      console.error('Error fetching evidence:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await api.sendCaseMessage(caseId, newMessage);
      setNewMessage('');
      await fetchMessages();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      await api.uploadEvidence(caseId, files, files.map(() => ''));
      await fetchEvidence();
      setActiveTab('documents');
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <EmployeeLayout>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </EmployeeLayout>
    );
  }

  if (error && !caseData) {
    return (
      <EmployeeLayout>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/employee/dashboard')}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  const daysRemaining = parseInt(caseData?.days_remaining || 0);
  const isOverdue = daysRemaining < 0;
  const isUrgent = daysRemaining <= 7 && daysRemaining > 0;
  const progressPercent = Math.min(100, Math.max(0, ((90 - daysRemaining) / 90) * 100));

  return (
    <EmployeeLayout>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        {/* Success Banner */}
        {showSuccessBanner && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-green-800">Complaint Filed Successfully!</p>
                <p className="text-sm text-green-600">
                  Case Code: {location.state?.caseCode || caseData?.case_code}. You will receive updates via email.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSuccessBanner(false)}
              className="text-green-600 hover:text-green-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Back Button */}
        <Link
          to="/employee/cases"
          className="text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1 mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to My Cases
        </Link>

        {/* Case Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{caseData?.case_code}</h1>
                <StatusBadge status={caseData?.status} />
              </div>
              <p className="text-gray-600">
                Filed on {new Date(caseData?.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-semibold ${isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-gray-900'}`}>
                {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`}
              </p>
              <p className="text-sm text-gray-500">
                Deadline: {new Date(caseData?.deadline_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Case Progress</span>
              <span>Day {90 - daysRemaining} of 90</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isOverdue ? 'bg-red-500' : isUrgent ? 'bg-orange-500' : 'bg-teal-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
              <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Add Evidence
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
            </label>
            <button
              onClick={() => setActiveTab('messages')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Send Message
              {caseData?.unread_messages > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {caseData.unread_messages}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {['timeline', 'documents', 'messages', 'details'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'messages' && caseData?.unread_messages > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {caseData.unread_messages}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Case Timeline</h3>
                {timeline.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No timeline events yet.</p>
                ) : (
                  <div className="space-y-0">
                    {timeline.map((event, index) => (
                      <TimelineEvent
                        key={event.id || index}
                        event={event}
                        isLast={index === timeline.length - 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Documents & Evidence</h3>
                  <label className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 cursor-pointer">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Upload File
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx"
                    />
                  </label>
                </div>

                {evidence.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500">No documents uploaded yet.</p>
                    <p className="text-sm text-gray-400 mt-1">Upload evidence to support your case.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {evidence.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-lg border border-gray-200">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{file.original_name}</p>
                            <p className="text-sm text-gray-500">
                              {(file.file_size / 1024 / 1024).toFixed(2)} MB
                              {' '}&bull;{' '}
                              Uploaded {new Date(file.uploaded_at).toLocaleDateString()}
                              {' '}&bull;{' '}
                              By {file.uploaded_by_name}
                            </p>
                            {file.description && (
                              <p className="text-sm text-gray-600 mt-1">{file.description}</p>
                            )}
                          </div>
                        </div>
                        <button className="text-teal-600 hover:text-teal-700 text-sm font-medium">
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div className="flex flex-col h-[500px]">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Secure Messages</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Messages are encrypted and only visible to you and IC members.
                </p>

                <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 rounded-lg p-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-gray-500">No messages yet.</p>
                      <p className="text-sm text-gray-400">Send a message to the IC Committee.</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <Message
                          key={message.id}
                          message={message}
                          isOwn={message.sender_type === 'employee'}
                        />
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message to IC..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? '...' : 'Send'}
                  </button>
                </form>
              </div>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h4 className="font-medium text-gray-900 mb-3">Incident Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-500">Date:</span> {caseData?.incident_date ? new Date(caseData.incident_date).toLocaleDateString() : 'N/A'}</p>
                      <p><span className="text-gray-500">Location:</span> {caseData?.incident_location || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-5">
                    <h4 className="font-medium text-gray-900 mb-3">Respondent Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-500">Name:</span> {caseData?.respondent_name || 'N/A'}</p>
                      <p><span className="text-gray-500">Department:</span> {caseData?.respondent_department || 'N/A'}</p>
                      <p><span className="text-gray-500">Designation:</span> {caseData?.respondent_designation || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-5">
                  <h4 className="font-medium text-gray-900 mb-3">Description</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{caseData?.description}</p>
                </div>

                {caseData?.witnesses && caseData.witnesses.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h4 className="font-medium text-gray-900 mb-3">Witnesses</h4>
                    <ul className="space-y-2">
                      {caseData.witnesses.map((witness, index) => (
                        <li key={index} className="text-sm">
                          <span className="font-medium">{witness.name}</span>
                          {witness.relationship && <span className="text-gray-500"> ({witness.relationship})</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
