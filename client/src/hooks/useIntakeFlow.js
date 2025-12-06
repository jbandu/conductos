import { useState } from 'react';
import { api } from '../services/api';

const STEPS = [
  'pre_intake',
  'incident_date',
  'description',
  'conciliation',
  'anonymity',
  'contact_info',
  'confirmation',
  'complete'
];

export function useIntakeFlow() {
  const [step, setStep] = useState('pre_intake');
  const [data, setData] = useState({
    incident_date: new Date().toISOString().split('T')[0], // Default to today
    description: '',
    conciliation_requested: null,
    is_anonymous: null,
    anonymous_alias: '',
    contact_method: '',
    complainant_name: '',
    complainant_email: ''
  });
  const [caseResult, setCaseResult] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (field, value) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCurrentStepIndex = () => {
    return STEPS.indexOf(step);
  };

  const nextStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < STEPS.length - 1) {
      setStep(STEPS[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1]);
    }
  };

  const goToStep = (stepName) => {
    if (STEPS.includes(stepName)) {
      setStep(stepName);
    }
  };

  const validateStep = (stepName) => {
    switch (stepName) {
      case 'incident_date':
        if (!data.incident_date) {
          return 'Please select the incident date';
        }
        const selectedDate = new Date(data.incident_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate > today) {
          return 'Incident date cannot be in the future';
        }
        return null;

      case 'description':
        if (!data.description || data.description.length < 50) {
          return 'Description must be at least 50 characters';
        }
        return null;

      case 'conciliation':
        if (data.conciliation_requested === null) {
          return 'Please select an option';
        }
        return null;

      case 'anonymity':
        if (data.is_anonymous === null) {
          return 'Please select an option';
        }
        return null;

      case 'contact_info':
        if (data.is_anonymous) {
          if (!data.anonymous_alias || !data.contact_method) {
            return 'Please provide both alias and contact method';
          }
        } else {
          if (!data.complainant_name || !data.complainant_email) {
            return 'Please provide both name and email';
          }
          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(data.complainant_email)) {
            return 'Please enter a valid email address';
          }
        }
        return null;

      default:
        return null;
    }
  };

  const submitComplaint = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare the complaint data
      const complaintData = {
        incident_date: data.incident_date,
        description: data.description,
        conciliation_requested: data.conciliation_requested === 'yes',
        is_anonymous: data.is_anonymous,
        anonymous_alias: data.is_anonymous ? data.anonymous_alias : null,
        contact_method: data.is_anonymous ? data.contact_method : null,
        complainant_name: !data.is_anonymous ? data.complainant_name : null,
        complainant_email: !data.is_anonymous ? data.complainant_email : null
      };

      const response = await api.createCase(complaintData);

      if (response.success) {
        setCaseResult(response.case);
        setStep('complete');

        // Refresh sidebar cases list if the function exists
        if (window.refreshCasesSidebar) {
          setTimeout(() => {
            window.refreshCasesSidebar();
          }, 500); // Small delay to ensure database has updated
        }
      } else {
        setError(response.error || 'Failed to submit complaint');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while submitting your complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setStep('pre_intake');
    setData({
      incident_date: '',
      description: '',
      conciliation_requested: null,
      is_anonymous: null,
      anonymous_alias: '',
      contact_method: '',
      complainant_name: '',
      complainant_email: ''
    });
    setCaseResult(null);
    setError(null);
    setIsSubmitting(false);
  };

  return {
    step,
    data,
    caseResult,
    error,
    isSubmitting,
    setField,
    nextStep,
    prevStep,
    goToStep,
    validateStep,
    submitComplaint,
    reset
  };
}
