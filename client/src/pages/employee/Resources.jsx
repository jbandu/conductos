import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EmployeeLayout from '../../components/employee/EmployeeLayout';
import { api } from '../../services/api';

export default function Resources() {
  const [resources, setResources] = useState({ faq: [], helplines: [], documents: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('faq');

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      const data = await api.getEmployeeResources();
      setResources(data);
    } catch (err) {
      console.error('Error fetching resources:', err);
    } finally {
      setIsLoading(false);
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

  return (
    <EmployeeLayout>
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Resources & Support</h1>
          <p className="text-gray-600 mt-1">Information and help about workplace harassment and the PoSH Act</p>
        </div>

        {/* Confidentiality Banner */}
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-teal-100 rounded-xl">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-teal-800 mb-2">Your Confidentiality is Protected</h3>
              <p className="text-sm text-teal-700">
                Under Section 16 of the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013,
                your identity and all details of your complaint are strictly confidential. Breach of confidentiality is punishable
                under the Act.
              </p>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'faq', label: 'FAQ', icon: '?' },
            { id: 'helplines', label: 'Helplines', icon: '1' },
            { id: 'documents', label: 'Documents', icon: '1' },
            { id: 'posh', label: 'About PoSH Act', icon: '1' }
          ].map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-5 py-2.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeSection === section.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* FAQ Section */}
        {activeSection === 'faq' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {resources.faq.map((item, index) => (
                <details key={index} className="group bg-gray-50 rounded-lg">
                  <summary className="cursor-pointer p-4 font-medium text-gray-900 flex items-center justify-between list-none">
                    {item.question}
                    <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-4 pb-4 text-gray-600">
                    {item.answer}
                  </div>
                </details>
              ))}

              {/* Additional static FAQs */}
              <details className="group bg-gray-50 rounded-lg">
                <summary className="cursor-pointer p-4 font-medium text-gray-900 flex items-center justify-between list-none">
                  What constitutes sexual harassment at workplace?
                  <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-4 pb-4 text-gray-600">
                  <p className="mb-2">Under the PoSH Act, sexual harassment includes:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Physical contact and advances</li>
                    <li>A demand or request for sexual favours</li>
                    <li>Making sexually coloured remarks</li>
                    <li>Showing pornography</li>
                    <li>Any other unwelcome physical, verbal, or non-verbal conduct of sexual nature</li>
                  </ul>
                </div>
              </details>

              <details className="group bg-gray-50 rounded-lg">
                <summary className="cursor-pointer p-4 font-medium text-gray-900 flex items-center justify-between list-none">
                  What are my rights as a complainant?
                  <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-4 pb-4 text-gray-600">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Right to file a written complaint</li>
                    <li>Right to request conciliation before inquiry</li>
                    <li>Right to present evidence and witnesses</li>
                    <li>Right to have your identity protected</li>
                    <li>Right to receive copy of the inquiry report</li>
                    <li>Right to interim relief during inquiry</li>
                    <li>Right to appeal the IC's decision</li>
                  </ul>
                </div>
              </details>
            </div>
          </div>
        )}

        {/* Helplines Section */}
        {activeSection === 'helplines' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">External Helplines</h2>
            <div className="space-y-4">
              {resources.helplines.map((helpline, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-teal-100 rounded-lg">
                      <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{helpline.name}</h3>
                      <p className="text-sm text-gray-500">Available: {helpline.available}</p>
                    </div>
                  </div>
                  <a
                    href={`tel:${helpline.number}`}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold"
                  >
                    {helpline.number}
                  </a>
                </div>
              ))}

              {/* Additional helplines */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Police (Women Cell)</h3>
                    <p className="text-sm text-gray-500">Available: 24/7</p>
                  </div>
                </div>
                <a
                  href="tel:1091"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                >
                  1091
                </a>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> These are national helplines. Your organization may have additional internal support channels.
              </p>
            </div>
          </div>
        )}

        {/* Documents Section */}
        {activeSection === 'documents' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Useful Documents</h2>
            <div className="space-y-3">
              <a
                href="https://wcd.nic.in/sites/default/files/Sexual-Harassment-at-Workplace-Act.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">PoSH Act 2013 (Full Text)</h3>
                    <p className="text-sm text-gray-500">Official legislation document</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              <a
                href="/learn"
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-teal-100 rounded-lg">
                    <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Understanding PoSH Act</h3>
                    <p className="text-sm text-gray-500">Simple explanation of your rights and the complaint process</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        )}

        {/* About PoSH Section */}
        {activeSection === 'posh' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">About the PoSH Act</h2>
            <div className="prose prose-sm max-w-none text-gray-600">
              <p className="mb-4">
                The <strong>Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013</strong>
                is a legislative act in India that seeks to protect women from sexual harassment at their place of work.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Key Provisions</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Every employer must constitute an <strong>Internal Complaints Committee (IC)</strong></li>
                <li>Complaints must be resolved within <strong>90 days</strong></li>
                <li>Complete <strong>confidentiality</strong> of the complainant's identity</li>
                <li>Protection against <strong>retaliation</strong></li>
                <li>Right to <strong>interim relief</strong> during inquiry</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">The Complaint Process</h3>
              <ol className="list-decimal list-inside space-y-2 mb-4">
                <li><strong>Filing:</strong> Submit a written complaint within 3 months of the incident</li>
                <li><strong>Acknowledgment:</strong> IC acknowledges within 7 working days</li>
                <li><strong>Conciliation:</strong> Option offered if requested by complainant</li>
                <li><strong>Inquiry:</strong> If no conciliation, formal inquiry is conducted</li>
                <li><strong>Report:</strong> IC submits report within 90 days</li>
                <li><strong>Action:</strong> Employer acts on recommendations within 60 days</li>
              </ol>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Penalties</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Breach of confidentiality: Fine up to Rs. 5,000</li>
                <li>Non-compliance by employer: Fine up to Rs. 50,000</li>
                <li>Repeated non-compliance: Double penalty and/or license cancellation</li>
              </ul>
            </div>

            <div className="mt-6">
              <Link
                to="/learn"
                className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Learn More About PoSH Act
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* Need Help Banner */}
        <div className="mt-8 bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-1">Ready to Report?</h3>
              <p className="text-teal-100">File a complaint confidentially. We're here to help.</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/employee/file-complaint"
                className="px-5 py-2.5 bg-white text-teal-700 rounded-lg font-semibold hover:bg-teal-50"
              >
                File a Report
              </Link>
              <Link
                to="/employee/anonymous-report"
                className="px-5 py-2.5 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10"
              >
                Report Anonymously
              </Link>
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
