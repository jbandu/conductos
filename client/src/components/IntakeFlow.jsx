import React, { useState } from 'react';
import { useIntakeFlow } from '../hooks/useIntakeFlow';
import ChatMessage from './ChatMessage';
import IntakeDatePicker from './IntakeDatePicker';
import IntakeTextarea from './IntakeTextarea';
import IntakeOptions from './IntakeOptions';
import IntakeContactInfo from './IntakeContactInfo';
import IntakeSummary from './IntakeSummary';
import IntakeComplete from './IntakeComplete';

const STEP_MESSAGES = {
  pre_intake: {
    content: "I'll help you file a complaint. This will take about 3 minutes. Everything you share is confidential and protected under the PoSH Act.",
    showContinue: true
  },
  incident_date: {
    content: "When did this incident occur?"
  },
  description: {
    content: "Please describe what happened. Include relevant details like location, people involved, and any witnesses."
  },
  conciliation: {
    content: "Would you be open to conciliation (mediation) before a formal inquiry? This is an option under Section 10 of the PoSH Act."
  },
  anonymity: {
    content: "Would you like limited-disclosure anonymity? This means only the Presiding Officer will know your contact details. Other IC members will see an alias."
  },
  contact_info: {
    anonymous: "Please provide an alias and a way for the Presiding Officer to contact you.",
    named: "Please provide your name and email for case updates."
  },
  confirmation: {
    content: "Please review your complaint details:"
  }
};

const CONCILIATION_OPTIONS = [
  { value: 'yes', label: 'Yes, I\'m open to conciliation', description: 'Attempt to resolve through mediation' },
  { value: 'no', label: 'No, proceed with inquiry', description: 'Skip mediation and start formal inquiry' },
  { value: 'unsure', label: 'I\'m not sure yet', description: 'I can decide later' }
];

const ANONYMITY_OPTIONS = [
  { value: true, label: 'Yes, limited anonymity', description: 'Only Presiding Officer knows my identity' },
  { value: false, label: 'No, share my identity', description: 'All IC members can see my name' }
];

export default function IntakeFlow({ onComplete }) {
  const {
    step,
    data,
    caseResult,
    error: submitError,
    isSubmitting,
    setField,
    nextStep,
    prevStep,
    goToStep,
    validateStep,
    submitComplaint,
    reset
  } = useIntakeFlow();

  const [validationError, setValidationError] = useState(null);
  const [showAnonymityWarning, setShowAnonymityWarning] = useState(false);

  const handleNext = () => {
    const error = validateStep(step);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    nextStep();
  };

  const handleContinue = () => {
    nextStep();
  };

  const handleSubmit = async () => {
    await submitComplaint();
  };

  const handleNewComplaint = () => {
    reset();
    if (onComplete) onComplete();
  };

  const renderStepContent = () => {
    switch (step) {
      case 'pre_intake':
        return (
          <>
            <ChatMessage
              type="system"
              content={STEP_MESSAGES.pre_intake.content}
              timestamp={new Date()}
            />
            <div className="px-4 mb-4">
              <div className="flex justify-end">
                <button
                  onClick={handleContinue}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] font-medium"
                >
                  Continue
                </button>
              </div>
            </div>
          </>
        );

      case 'incident_date':
        return (
          <>
            <ChatMessage
              type="system"
              content={STEP_MESSAGES.incident_date.content}
              timestamp={new Date()}
            />
            <IntakeDatePicker
              value={data.incident_date}
              onChange={(value) => setField('incident_date', value)}
              error={validationError}
            />
            <div className="px-4 mb-4">
              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        );

      case 'description':
        return (
          <>
            <ChatMessage
              type="system"
              content={STEP_MESSAGES.description.content}
              timestamp={new Date()}
            />
            <IntakeTextarea
              value={data.description}
              onChange={(value) => setField('description', value)}
              minLength={50}
              error={validationError}
            />
            <div className="px-4 mb-4">
              <div className="flex justify-end gap-2">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors min-h-[44px] font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        );

      case 'conciliation':
        return (
          <>
            <ChatMessage
              type="system"
              content={STEP_MESSAGES.conciliation.content}
              timestamp={new Date()}
            />
            <IntakeOptions
              options={CONCILIATION_OPTIONS}
              selected={data.conciliation_requested}
              onSelect={(value) => setField('conciliation_requested', value)}
              error={validationError}
            />
            <div className="px-4 mb-4">
              <div className="flex justify-end gap-2">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors min-h-[44px] font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        );

      case 'anonymity':
        return (
          <>
            <ChatMessage
              type="system"
              content={STEP_MESSAGES.anonymity.content}
              timestamp={new Date()}
            />
            <IntakeOptions
              options={ANONYMITY_OPTIONS}
              selected={data.is_anonymous}
              onSelect={(value) => {
                setField('is_anonymous', value);
                setShowAnonymityWarning(value === false);
              }}
              error={validationError}
            />
            {showAnonymityWarning && data.is_anonymous === false && (
              <div className="px-4 mb-4">
                <div className="flex justify-end">
                  <div className="max-w-[80%] md:max-w-[70%] w-full">
                    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 flex items-start gap-2">
                      <span className="text-yellow-600 text-lg">⚠️</span>
                      <p className="text-sm text-yellow-800">
                        Note: Without anonymity, your identity will be known to all IC members during the investigation process.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="px-4 mb-4">
              <div className="flex justify-end gap-2">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors min-h-[44px] font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        );

      case 'contact_info':
        return (
          <>
            <ChatMessage
              type="system"
              content={data.is_anonymous ? STEP_MESSAGES.contact_info.anonymous : STEP_MESSAGES.contact_info.named}
              timestamp={new Date()}
            />
            <IntakeContactInfo
              isAnonymous={data.is_anonymous}
              data={data}
              onChange={setField}
              error={validationError}
            />
            <div className="px-4 mb-4">
              <div className="flex justify-end gap-2">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors min-h-[44px] font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        );

      case 'confirmation':
        return (
          <>
            <ChatMessage
              type="system"
              content={STEP_MESSAGES.confirmation.content}
              timestamp={new Date()}
            />
            {submitError && (
              <div className="px-4 mb-4">
                <div className="flex justify-end">
                  <div className="max-w-[80%] md:max-w-[70%] w-full">
                    <div className="bg-red-50 border border-red-300 rounded-lg p-3">
                      <p className="text-sm text-red-800">{submitError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <IntakeSummary
              data={data}
              onEdit={() => goToStep('incident_date')}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </>
        );

      case 'complete':
        return (
          <IntakeComplete
            caseCode={caseResult?.case_code}
            createdAt={caseResult?.created_at}
            deadlineDate={caseResult?.deadline_date}
            onNewComplaint={handleNewComplaint}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {renderStepContent()}
    </div>
  );
}
