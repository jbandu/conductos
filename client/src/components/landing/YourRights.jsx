import React from 'react';

export default function YourRights() {
  const rights = [
    'You have the right to file a complaint within 3 months of an incident',
    'You can choose conciliation before formal inquiry',
    'Your identity can be protected throughout the process',
    'The inquiry must complete within 90 days',
    'You are protected from retaliation',
    'You have the right to be heard throughout the process',
  ];

  return (
    <section className="py-20 bg-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-warm-900 mb-3">
            Know Your Rights
          </h2>
          <p className="text-lg text-warm-600">Under the PoSH Act, 2013</p>
        </div>

        {/* Rights Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rights.map((right, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg border-l-4 border-primary-500 shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-warm-700 leading-relaxed">{right}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
