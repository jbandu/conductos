import React from 'react';

export default function IntakeContactInfo({ isAnonymous, data, onChange, error }) {
  return (
    <div className="px-4 mb-4">
      <div className="flex justify-end">
        <div className="max-w-[80%] md:max-w-[70%] w-full space-y-3">
          {isAnonymous ? (
            <>
              <input
                type="text"
                value={data.anonymous_alias}
                onChange={(e) => onChange('anonymous_alias', e.target.value)}
                placeholder="Enter an alias (e.g., Complainant-A)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-[44px]"
              />
              <input
                type="text"
                value={data.contact_method}
                onChange={(e) => onChange('contact_method', e.target.value)}
                placeholder="Contact method (email or phone)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-[44px]"
              />
            </>
          ) : (
            <>
              <input
                type="text"
                value={data.complainant_name}
                onChange={(e) => onChange('complainant_name', e.target.value)}
                placeholder="Full Name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-[44px]"
              />
              <input
                type="email"
                value={data.complainant_email}
                onChange={(e) => onChange('complainant_email', e.target.value)}
                placeholder="Email Address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-[44px]"
              />
            </>
          )}
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
