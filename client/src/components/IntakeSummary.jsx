import React from 'react';

export default function IntakeSummary({ data, onEdit, onSubmit, isSubmitting }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getConciliationText = (value) => {
    if (value === 'yes') return 'Yes, open to conciliation';
    if (value === 'no') return 'No, proceed with inquiry';
    return 'Not sure yet';
  };

  const truncateDescription = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="px-4 mb-4">
      <div className="flex justify-end">
        <div className="max-w-[80%] md:max-w-[70%] w-full">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div>
              <span className="text-sm font-semibold text-gray-700">Incident Date:</span>
              <p className="text-gray-900">{formatDate(data.incident_date)}</p>
            </div>

            <div>
              <span className="text-sm font-semibold text-gray-700">Description:</span>
              <p className="text-gray-900">{truncateDescription(data.description)}</p>
              {data.description.length > 150 && (
                <button
                  onClick={() => onEdit('description')}
                  className="text-blue-600 text-sm mt-1 hover:underline"
                >
                  View full description
                </button>
              )}
            </div>

            <div>
              <span className="text-sm font-semibold text-gray-700">Conciliation:</span>
              <p className="text-gray-900">{getConciliationText(data.conciliation_requested)}</p>
            </div>

            <div>
              <span className="text-sm font-semibold text-gray-700">Identity:</span>
              <p className="text-gray-900">
                {data.is_anonymous ? (
                  <>Anonymous (Alias: {data.anonymous_alias})</>
                ) : (
                  <>Named Complaint ({data.complainant_name})</>
                )}
              </p>
            </div>

            <div>
              <span className="text-sm font-semibold text-gray-700">Contact:</span>
              <p className="text-gray-900">
                {data.is_anonymous ? data.contact_method : data.complainant_email}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={onEdit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors min-h-[44px] font-medium"
            >
              Edit Details
            </button>
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors min-h-[44px] font-medium"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
