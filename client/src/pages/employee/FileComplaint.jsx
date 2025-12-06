import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import EmployeeLayout from '../../components/employee/EmployeeLayout';
import { api } from '../../services/api';

// Step indicator component
function StepIndicator({ currentStep, steps }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                ${isCompleted ? 'bg-teal-600 text-white' : isActive ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'}
              `}>
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span className={`mt-2 text-xs font-medium hidden sm:block ${isActive ? 'text-teal-600' : 'text-gray-500'}`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 rounded ${stepNum < currentStep ? 'bg-teal-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// File upload component
function FileUploader({ files, onFilesChange, descriptions, onDescriptionsChange }) {
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    onFilesChange([...files, ...droppedFiles]);
    onDescriptionsChange([...descriptions, ...droppedFiles.map(() => '')]);
  }, [files, descriptions, onFilesChange, onDescriptionsChange]);

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    onFilesChange([...files, ...selectedFiles]);
    onDescriptionsChange([...descriptions, ...selectedFiles.map(() => '')]);
  };

  const removeFile = (index) => {
    onFilesChange(files.filter((_, i) => i !== index));
    onDescriptionsChange(descriptions.filter((_, i) => i !== index));
  };

  const updateDescription = (index, value) => {
    const newDescriptions = [...descriptions];
    newDescriptions[index] = value;
    onDescriptionsChange(newDescriptions);
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-teal-500 transition-colors"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-gray-600 mb-2">Drag & drop files here</p>
        <p className="text-gray-400 text-sm mb-4">or</p>
        <label className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 cursor-pointer">
          <input
            type="file"
            multiple
            onChange={handleFileInput}
            accept="image/*,.pdf,.doc,.docx,.mp3,.mp4,.wav"
            className="hidden"
          />
          Browse Files
        </label>
        <p className="text-xs text-gray-500 mt-4">
          Accepted: Images, PDFs, Documents, Audio, Video (Max 25MB per file)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Uploaded Files:</h4>
          {files.map((file, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <input
                type="text"
                value={descriptions[index] || ''}
                onChange={(e) => updateDescription(index, e.target.value)}
                placeholder="Add description (optional)"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Witness input component
function WitnessInput({ witnesses, onChange }) {
  const addWitness = () => {
    onChange([...witnesses, { name: '', contact: '', relationship: '' }]);
  };

  const updateWitness = (index, field, value) => {
    const newWitnesses = [...witnesses];
    newWitnesses[index][field] = value;
    onChange(newWitnesses);
  };

  const removeWitness = (index) => {
    onChange(witnesses.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {witnesses.map((witness, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">Witness {index + 1}</span>
            <button
              type="button"
              onClick={() => removeWitness(index)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={witness.name}
              onChange={(e) => updateWitness(index, 'name', e.target.value)}
              placeholder="Name"
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <input
              type="text"
              value={witness.contact}
              onChange={(e) => updateWitness(index, 'contact', e.target.value)}
              placeholder="Contact (optional)"
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <select
              value={witness.relationship}
              onChange={(e) => updateWitness(index, 'relationship', e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Relationship</option>
              <option value="colleague">Colleague</option>
              <option value="supervisor">Supervisor</option>
              <option value="subordinate">Subordinate</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addWitness}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-teal-500 hover:text-teal-600 transition-colors"
      >
        + Add Witness
      </button>
    </div>
  );
}

export default function FileComplaint() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [error, setError] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Incident
    incidentDate: '',
    incidentLocation: '',
    incidentLocationOther: '',
    description: '',
    // Step 2: Respondent
    respondentName: '',
    respondentDepartment: '',
    respondentDesignation: '',
    respondentRelationship: '',
    hasWitnesses: '',
    witnesses: [],
    // Step 3: Evidence
    files: [],
    fileDescriptions: [],
    // Step 4: Contact
    preferredContactMethod: 'email',
    phone: '',
    // Step 5: Review
    confirmed: false
  });

  const steps = [
    { id: 1, label: 'Incident' },
    { id: 2, label: 'Details' },
    { id: 3, label: 'Evidence' },
    { id: 4, label: 'Contact' },
    { id: 5, label: 'Review' }
  ];

  // Load draft if available
  useEffect(() => {
    if (location.state?.draft) {
      try {
        const draftData = typeof location.state.draft.draft_data === 'string'
          ? JSON.parse(location.state.draft.draft_data)
          : location.state.draft.draft_data;
        setFormData(prev => ({ ...prev, ...draftData }));
        setCurrentStep(location.state.draft.current_step || 1);
      } catch (err) {
        console.error('Error loading draft:', err);
      }
    }
  }, [location.state]);

  // Auto-save draft
  useEffect(() => {
    const saveDraft = async () => {
      if (formData.description || formData.incidentDate) {
        try {
          setAutoSaveStatus('Saving...');
          await api.saveDraft({
            ...formData,
            currentStep,
            completedSteps: Array.from({ length: currentStep - 1 }, (_, i) => i + 1)
          });
          setAutoSaveStatus('Saved');
          setTimeout(() => setAutoSaveStatus(''), 2000);
        } catch (err) {
          console.error('Error saving draft:', err);
          setAutoSaveStatus('Save failed');
        }
      }
    };

    const timeoutId = setTimeout(saveDraft, 3000);
    return () => clearTimeout(timeoutId);
  }, [formData, currentStep]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.incidentDate) return 'Incident date is required';
        if (!formData.incidentLocation) return 'Incident location is required';
        if (!formData.description || formData.description.length < 50) return 'Description must be at least 50 characters';
        return null;
      case 2:
        if (!formData.respondentName) return 'Respondent name is required';
        return null;
      case 3:
        return null; // Evidence is optional
      case 4:
        return null; // Contact uses profile defaults
      case 5:
        if (!formData.confirmed) return 'Please confirm the declaration';
        return null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const handlePrev = () => {
    setError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Submit complaint
      const result = await api.submitComplaint({
        incidentDate: formData.incidentDate,
        incidentLocation: formData.incidentLocation === 'other' ? formData.incidentLocationOther : formData.incidentLocation,
        description: formData.description,
        respondentName: formData.respondentName,
        respondentDepartment: formData.respondentDepartment,
        respondentDesignation: formData.respondentDesignation,
        respondentRelationship: formData.respondentRelationship,
        witnesses: formData.witnesses.filter(w => w.name),
        complainantPhone: formData.phone
      });

      // Upload evidence if any
      if (formData.files.length > 0) {
        await api.uploadEvidence(result.caseId, formData.files, formData.fileDescriptions);
      }

      // Navigate to success/case detail
      navigate(`/employee/cases/${result.caseId}`, {
        state: { justCreated: true, caseCode: result.caseCode }
      });
    } catch (err) {
      setError(err.message || 'Failed to submit complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Step 1: Incident Information</h2>
            <p className="text-gray-600">Tell us about what happened.</p>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Where did this occur? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                {['Office premises', 'Virtual/Online', 'Off-site work event', 'Client location', 'Other'].map((loc) => (
                  <label key={loc} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="incidentLocation"
                      value={loc.toLowerCase().replace(/[^a-z]/g, '_')}
                      checked={formData.incidentLocation === loc.toLowerCase().replace(/[^a-z]/g, '_')}
                      onChange={(e) => updateField('incidentLocation', e.target.value)}
                      className="mr-2"
                    />
                    {loc}
                  </label>
                ))}
              </div>
              {formData.incidentLocation === 'other' && (
                <input
                  type="text"
                  value={formData.incidentLocationOther}
                  onChange={(e) => updateField('incidentLocationOther', e.target.value)}
                  placeholder="Please specify location"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What happened? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={6}
                placeholder="Please describe the incident in your own words. Include specific behaviors, statements, or actions. Be as detailed as possible - dates, times, and exact words help the investigation."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <div className="mt-2 flex justify-between text-sm">
                <p className="text-gray-500">
                  Tip: Be as specific as possible.
                </p>
                <p className={`${formData.description.length < 50 ? 'text-red-500' : 'text-green-600'}`}>
                  {formData.description.length}/50 min characters
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Step 2: Person Details</h2>
            <p className="text-gray-600">Information about the person you're reporting.</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name of the person <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.respondentName}
                onChange={(e) => updateField('respondentName', e.target.value)}
                placeholder="Enter full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department (if known)
                </label>
                <input
                  type="text"
                  value={formData.respondentDepartment}
                  onChange={(e) => updateField('respondentDepartment', e.target.value)}
                  placeholder="e.g., Marketing, Engineering"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Designation (if known)
                </label>
                <input
                  type="text"
                  value={formData.respondentDesignation}
                  onChange={(e) => updateField('respondentDesignation', e.target.value)}
                  placeholder="e.g., Manager, Director"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationship to you
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Supervisor/Manager', 'Colleague', 'Subordinate', 'Client/Vendor', 'Other'].map((rel) => (
                  <label key={rel} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="relationship"
                      value={rel.toLowerCase().replace(/[^a-z]/g, '_')}
                      checked={formData.respondentRelationship === rel.toLowerCase().replace(/[^a-z]/g, '_')}
                      onChange={(e) => updateField('respondentRelationship', e.target.value)}
                      className="mr-2"
                    />
                    {rel}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Were there witnesses?
              </label>
              <div className="flex gap-4 mb-4">
                {['Yes', 'No', "I'm not sure"].map((option) => (
                  <label key={option} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="hasWitnesses"
                      value={option.toLowerCase()}
                      checked={formData.hasWitnesses === option.toLowerCase()}
                      onChange={(e) => updateField('hasWitnesses', e.target.value)}
                      className="mr-2"
                    />
                    {option}
                  </label>
                ))}
              </div>
              {formData.hasWitnesses === 'yes' && (
                <WitnessInput
                  witnesses={formData.witnesses}
                  onChange={(witnesses) => updateField('witnesses', witnesses)}
                />
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Step 3: Supporting Evidence</h2>
            <p className="text-gray-600">Upload any evidence you have (optional but helpful).</p>

            <FileUploader
              files={formData.files}
              onFilesChange={(files) => updateField('files', files)}
              descriptions={formData.fileDescriptions}
              onDescriptionsChange={(descriptions) => updateField('fileDescriptions', descriptions)}
            />

            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-teal-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-sm text-teal-700">
                All files are encrypted end-to-end. Only IC members assigned to your case can view them.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Step 4: Contact Information</h2>
            <p className="text-gray-600">How would you like to be contacted?</p>

            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900">Filing with your identity (Recommended)</h3>
                  <p className="text-sm text-gray-600">The IC will know who you are but will keep it confidential.</p>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Your profile information will be used for this complaint. You can add an optional phone number.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="text-center pt-4">
              <p className="text-gray-600 mb-2">Want to report anonymously instead?</p>
              <Link
                to="/employee/anonymous-report"
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Switch to Anonymous Reporting
              </Link>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Step 5: Review Your Complaint</h2>
            <p className="text-gray-600">Please review the information before submitting.</p>

            {/* Incident Details */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">Incident Details</h3>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-teal-600 hover:text-teal-700 text-sm"
                >
                  Edit
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Date:</span> {formData.incidentDate}</p>
                <p><span className="text-gray-500">Location:</span> {formData.incidentLocation === 'other' ? formData.incidentLocationOther : formData.incidentLocation}</p>
                <p><span className="text-gray-500">Description:</span></p>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{formData.description}</p>
              </div>
            </div>

            {/* Respondent Details */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">Respondent Information</h3>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-teal-600 hover:text-teal-700 text-sm"
                >
                  Edit
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Name:</span> {formData.respondentName}</p>
                {formData.respondentDepartment && (
                  <p><span className="text-gray-500">Department:</span> {formData.respondentDepartment}</p>
                )}
                {formData.respondentRelationship && (
                  <p><span className="text-gray-500">Relationship:</span> {formData.respondentRelationship}</p>
                )}
                {formData.witnesses.length > 0 && (
                  <p><span className="text-gray-500">Witnesses:</span> {formData.witnesses.filter(w => w.name).length} identified</p>
                )}
              </div>
            </div>

            {/* Evidence */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">Evidence Attached</h3>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="text-teal-600 hover:text-teal-700 text-sm"
                >
                  Edit
                </button>
              </div>
              {formData.files.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {formData.files.map((file, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No evidence attached</p>
              )}
            </div>

            {/* Confirmation */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.confirmed}
                  onChange={(e) => updateField('confirmed', e.target.checked)}
                  className="mt-1 h-5 w-5 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  I confirm this complaint is made in good faith and the information provided is true to the best of my knowledge. I understand that filing a false complaint may result in action under Section 14 of the PoSH Act.
                </span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <EmployeeLayout>
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link to="/employee/dashboard" className="text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">File a Complaint</h1>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} steps={steps} />

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {renderStep()}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between border-t pt-6">
            <div className="text-sm text-gray-500">
              {autoSaveStatus && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {autoSaveStatus}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Previous
                </button>
              )}
              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit Complaint'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
