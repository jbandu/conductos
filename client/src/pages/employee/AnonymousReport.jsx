import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';

export default function AnonymousReport() {
  const navigate = useNavigate();
  const [step, setStep] = useState('form'); // 'form', 'success', 'lookup'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    incidentDate: '',
    incidentLocation: '',
    description: '',
    respondentName: '',
    respondentDepartment: '',
    passphrase: '',
    confirmPassphrase: ''
  });

  // Success state
  const [result, setResult] = useState(null);

  // Lookup state
  const [lookupCode, setLookupCode] = useState('');
  const [lookupPassphrase, setLookupPassphrase] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.incidentDate) {
      setError('Incident date is required');
      return;
    }
    if (!formData.description || formData.description.length < 50) {
      setError('Description must be at least 50 characters');
      return;
    }
    if (!formData.passphrase || formData.passphrase.length < 6) {
      setError('Passphrase must be at least 6 characters');
      return;
    }
    if (formData.passphrase !== formData.confirmPassphrase) {
      setError('Passphrases do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.submitAnonymousComplaint({
        incidentDate: formData.incidentDate,
        incidentLocation: formData.incidentLocation,
        description: formData.description,
        respondentName: formData.respondentName,
        respondentDepartment: formData.respondentDepartment,
        passphrase: formData.passphrase
      });

      setResult(response);
      setStep('success');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    setError(null);

    if (!lookupCode || !lookupPassphrase) {
      setError('Both code and passphrase are required');
      return;
    }

    setIsLookingUp(true);
    try {
      const data = await api.lookupAnonymousCase(lookupCode, lookupPassphrase);
      setLookupResult(data);
    } catch (err) {
      setError('Invalid code or passphrase');
    } finally {
      setIsLookingUp(false);
    }
  };

  // Success page
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Anonymous Complaint Filed</h1>
            <p className="text-gray-600">Your complaint has been submitted successfully.</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="font-semibold text-amber-800">Important - Save These Details!</h3>
            </div>
            <p className="text-sm text-amber-700 mb-4">
              You'll need both your anonymous code and passphrase to check the status of your case.
            </p>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3 border border-amber-200">
                <p className="text-xs text-gray-500 mb-1">Anonymous Code</p>
                <p className="font-mono font-bold text-xl text-gray-900">{result?.anonymousCode}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-amber-200">
                <p className="text-xs text-gray-500 mb-1">Case Code</p>
                <p className="font-mono font-semibold text-gray-900">{result?.caseCode}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-amber-200">
                <p className="text-xs text-gray-500 mb-1">Deadline</p>
                <p className="font-semibold text-gray-900">
                  {result?.deadlineDate ? new Date(result.deadlineDate).toLocaleDateString() : '90 days from now'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setStep('lookup');
                setLookupCode(result?.anonymousCode || '');
              }}
              className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
            >
              Check Case Status
            </button>
            <Link
              to="/"
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Lookup page
  if (step === 'lookup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Anonymous Case</h1>
            <p className="text-gray-600">Enter your anonymous code and passphrase to view your case status.</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {lookupResult ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{lookupResult.caseCode}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    lookupResult.status === 'closed' ? 'bg-green-100 text-green-800' :
                    lookupResult.status === 'new' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {lookupResult.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Filed:</span> {new Date(lookupResult.filedAt).toLocaleDateString()}</p>
                  <p><span className="text-gray-500">Deadline:</span> {new Date(lookupResult.deadlineDate).toLocaleDateString()}</p>
                  <p className={lookupResult.daysRemaining < 0 ? 'text-red-600' : ''}>
                    <span className="text-gray-500">Days Remaining:</span> {lookupResult.daysRemaining}
                  </p>
                  {lookupResult.unreadMessages > 0 && (
                    <p className="text-teal-600 font-medium">
                      {lookupResult.unreadMessages} new message(s) from IC
                    </p>
                  )}
                </div>
              </div>

              {lookupResult.timeline && lookupResult.timeline.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-5">
                  <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
                  <div className="space-y-3">
                    {lookupResult.timeline.slice(0, 5).map((event, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-teal-500 rounded-full mt-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{event.event_title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setLookupResult(null);
                  setLookupPassphrase('');
                }}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Check Another Case
              </button>
            </div>
          ) : (
            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Anonymous Code</label>
                <input
                  type="text"
                  value={lookupCode}
                  onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                  placeholder="ANON-2025-001"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passphrase</label>
                <input
                  type="password"
                  value={lookupPassphrase}
                  onChange={(e) => setLookupPassphrase(e.target.value)}
                  placeholder="Enter your passphrase"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={isLookingUp}
                className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50"
              >
                {isLookingUp ? 'Looking up...' : 'View Case Status'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <button
              onClick={() => setStep('form')}
              className="text-teal-600 hover:text-teal-700 text-sm font-medium"
            >
              File a New Anonymous Complaint
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 to-teal-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Anonymous Reporting</h1>
          <p className="text-teal-100">Your identity will be completely protected</p>
        </div>

        {/* Info Box */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 mb-6 text-white">
          <h3 className="font-semibold mb-3">When you report anonymously:</h3>
          <ul className="space-y-2 text-sm text-teal-100">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-teal-300 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              You'll receive a tracking code (e.g., ANON-2025-001)
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-teal-300 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              The IC cannot see your name, email, or any identifying information
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-teal-300 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              You can check your case status anytime using your code
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-sm text-amber-200 flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Note: Anonymous complaints may have limitations. The IC may not be able to take full action without your identity.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Incident Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                When did this happen? <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.incidentDate}
                onChange={(e) => updateField('incidentDate', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Where did this occur?
              </label>
              <input
                type="text"
                value={formData.incidentLocation}
                onChange={(e) => updateField('incidentLocation', e.target.value)}
                placeholder="e.g., Office premises, Virtual meeting"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What happened? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={6}
                placeholder="Please describe the incident in detail. Include specific behaviors, statements, or actions."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <p className={`text-sm mt-1 ${formData.description.length < 50 ? 'text-red-500' : 'text-green-600'}`}>
                {formData.description.length}/50 minimum characters
              </p>
            </div>

            {/* Respondent Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Person's Name (if known)
                </label>
                <input
                  type="text"
                  value={formData.respondentName}
                  onChange={(e) => updateField('respondentName', e.target.value)}
                  placeholder="Name of the person"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department (if known)
                </label>
                <input
                  type="text"
                  value={formData.respondentDepartment}
                  onChange={(e) => updateField('respondentDepartment', e.target.value)}
                  placeholder="Department"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Passphrase */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-5">
              <h3 className="font-semibold text-teal-800 mb-3">Create a Secure Passphrase</h3>
              <p className="text-sm text-teal-700 mb-4">
                You'll use this passphrase along with your anonymous code to check your case status later.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passphrase <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.passphrase}
                    onChange={(e) => updateField('passphrase', e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Passphrase <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassphrase}
                    onChange={(e) => updateField('confirmPassphrase', e.target.value)}
                    placeholder="Confirm your passphrase"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/employee/file-complaint"
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-center"
              >
                File with Identity Instead
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Anonymously'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <button
              onClick={() => setStep('lookup')}
              className="text-teal-600 hover:text-teal-700 text-sm font-medium"
            >
              Already filed? Check your case status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
