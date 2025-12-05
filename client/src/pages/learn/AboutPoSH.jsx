import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/landing/Navbar';
import Footer from '../../components/landing/Footer';
import ExpandableCard from '../../components/learn/ExpandableCard';

export default function AboutPoSH() {
  const [activeSection, setActiveSection] = useState('');

  const sections = [
    { id: 'what-is-posh', label: 'What is PoSH?' },
    { id: 'what-is-harassment', label: 'What is Harassment?' },
    { id: 'your-rights', label: 'Your Rights' },
    { id: 'the-process', label: 'The Process' },
    { id: 'faqs', label: 'FAQs' },
  ];

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      question: "Can I file an anonymous complaint?",
      answer:
        "You can request limited-disclosure anonymity where only the Presiding Officer knows your contact details. However, fully anonymous complaints may limit investigation. The IC needs some way to contact you for follow-up questions.",
    },
    {
      question: "What if the harasser is my boss?",
      answer:
        "The PoSH Act covers harassment by anyone — colleagues, supervisors, even clients. Having a senior position doesn't provide immunity. The IC will handle your complaint with extra care to prevent retaliation.",
    },
    {
      question: "What if I don't have evidence?",
      answer:
        "Many harassment cases don't have direct evidence. Your testimony is evidence. The IC will evaluate all circumstances, patterns, and witness accounts. Don't let lack of \"proof\" stop you from reporting.",
    },
    {
      question: "Can I be fired for filing a complaint?",
      answer:
        "No. Terminating or victimizing someone for filing a complaint is illegal under Section 14 of the Act. If this happens, it strengthens your case.",
    },
    {
      question: "What if my complaint is found to be false?",
      answer:
        "The Act has provisions against malicious complaints. However, a complaint that cannot be proven is NOT the same as a false complaint. You won't be penalized simply because the IC couldn't establish the facts.",
    },
    {
      question: "Can men file complaints under PoSH?",
      answer:
        "The PoSH Act specifically covers women. However, most organizations have separate policies for harassment complaints by any gender. Check your company's policy or speak to HR.",
    },
    {
      question: "What happens to the harasser if found guilty?",
      answer:
        "The IC recommends action to the employer. This can range from written warning to termination, depending on severity. The IC may also recommend compensation to you.",
    },
    {
      question: "How long does the process take?",
      answer:
        "The inquiry must be completed within 90 days by law. Most cases are resolved within this timeframe.",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-primary-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-warm-900 mb-4">
              Understanding Your Rights
            </h1>
            <p className="text-xl text-warm-600">
              A clear guide to the PoSH Act and how it protects you
            </p>
            <p className="text-sm text-warm-500 mt-2">~12 minutes to read</p>
          </div>

          {/* Quick Navigation */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="px-4 py-2 bg-white hover:bg-primary-100 text-primary-700 rounded-full text-sm font-medium transition-colors shadow-sm"
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* What is PoSH */}
      <section id="what-is-posh" className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-warm-900 mb-6">
            What is the PoSH Act?
          </h2>

          <p className="text-lg text-warm-700 leading-relaxed mb-8">
            The Sexual Harassment of Women at Workplace (Prevention, Prohibition
            and Redressal) Act, 2013 — commonly called the PoSH Act — is an
            Indian law that protects women from sexual harassment at work.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-primary-50 rounded-lg">
              <h3 className="font-semibold text-warm-900 mb-3">
                Who it covers
              </h3>
              <ul className="text-sm text-warm-700 space-y-2">
                <li>• All women employees</li>
                <li>• All workplaces with 10+ employees</li>
                <li>• Contractual, temporary, and interns</li>
                <li>• Incidents by colleagues, supervisors, clients, or vendors</li>
              </ul>
            </div>

            <div className="p-6 bg-primary-50 rounded-lg">
              <h3 className="font-semibold text-warm-900 mb-3">
                What it requires
              </h3>
              <ul className="text-sm text-warm-700 space-y-2">
                <li>• Internal Committee (IC) at every workplace</li>
                <li>• Senior woman as Presiding Officer</li>
                <li>• External member from NGO/legal background</li>
                <li>• Annual reports to District Officer</li>
              </ul>
            </div>

            <div className="p-6 bg-primary-50 rounded-lg">
              <h3 className="font-semibold text-warm-900 mb-3">Why it matters</h3>
              <ul className="text-sm text-warm-700 space-y-2">
                <li>• Safe reporting mechanism</li>
                <li>• Time-bound resolution (90 days)</li>
                <li>• Protection from retaliation</li>
                <li>• Holds organizations accountable</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 text-sm text-warm-500">
            Full text available at{' '}
            <a
              href="https://indiacode.nic.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              indiacode.nic.in
            </a>
          </div>
        </div>
      </section>

      {/* What Constitutes Harassment */}
      <section id="what-is-harassment" className="py-16 bg-warm-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-warm-900 mb-6">
            What is considered sexual harassment?
          </h2>

          <p className="text-lg text-warm-700 leading-relaxed mb-8">
            Sexual harassment includes any unwelcome behavior of a sexual nature.
            It's not about intent — it's about impact.
          </p>

          <div className="bg-primary-100 border-l-4 border-primary-500 p-6 rounded-lg mb-8">
            <p className="text-warm-800 leading-relaxed italic mb-4">
              "Any unwelcome sexually determined behavior (whether directly or by
              implication) including:"
            </p>
            <ul className="text-warm-700 space-y-2 mb-4">
              <li>• Physical contact and advances</li>
              <li>• A demand or request for sexual favors</li>
              <li>• Sexually colored remarks</li>
              <li>• Showing pornography</li>
              <li>
                • Any other unwelcome physical, verbal, or non-verbal conduct of a
                sexual nature
              </li>
            </ul>
            <p className="text-sm text-warm-600">— Section 2(n), PoSH Act 2013</p>
          </div>

          <h3 className="text-2xl font-bold text-warm-900 mb-4">
            Examples of sexual harassment
          </h3>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg border border-warm-200">
              <h4 className="font-semibold text-warm-900 mb-3">Verbal</h4>
              <ul className="text-sm text-warm-700 space-y-2">
                <li>• Sexual comments or jokes</li>
                <li>• Requests for sexual favors</li>
                <li>• Spreading rumors about personal life</li>
                <li>• Repeated unwanted requests for dates</li>
                <li>• Comments about appearance or body</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg border border-warm-200">
              <h4 className="font-semibold text-warm-900 mb-3">
                Non-verbal/Physical
              </h4>
              <ul className="text-sm text-warm-700 space-y-2">
                <li>• Unwelcome touching</li>
                <li>• Blocking someone's path</li>
                <li>• Displaying offensive images</li>
                <li>• Sending inappropriate messages</li>
                <li>• Staring or leering</li>
                <li>• Stalking (including online)</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-warm-800 font-medium">
              ⚠️ A single incident can constitute harassment. You don't need to
              prove a "pattern" to file a complaint.
            </p>
          </div>
        </div>
      </section>

      {/* Your Rights */}
      <section id="your-rights" className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-warm-900 mb-8">Your Rights</h2>

          <div className="space-y-6">
            {[
              {
                number: 1,
                title: "Right to File a Complaint",
                description:
                  "You can file a written complaint with your Internal Committee within 3 months of the incident. This period can be extended by another 3 months if there were valid reasons for delay.",
              },
              {
                number: 2,
                title: "Right to Conciliation",
                description:
                  "Before formal inquiry, you can request conciliation — a mediated settlement. This is your choice. You cannot be pressured into it.",
              },
              {
                number: 3,
                title: "Right to Confidentiality",
                description:
                  "Your identity must be protected. Section 16 prohibits disclosure of your name, address, identity, or any information that could identify you.",
              },
              {
                number: 4,
                title: "Right to Fair Inquiry",
                description:
                  "The inquiry must follow principles of natural justice. You have the right to present evidence, call witnesses, and be heard fairly.",
              },
              {
                number: 5,
                title: "Right to Interim Relief",
                description:
                  "During inquiry, you can request: Transfer (yours or the respondent's), Leave (up to 3 months paid leave), Restraining the respondent from contact.",
              },
              {
                number: 6,
                title: "Right to Protection from Retaliation",
                description:
                  "You are protected from victimization. Any retaliation against you for filing a complaint is itself a violation.",
              },
              {
                number: 7,
                title: "Right to Time-Bound Resolution",
                description:
                  "The inquiry must be completed within 90 days. You have the right to a speedy resolution.",
              },
              {
                number: 8,
                title: "Right to Appeal",
                description:
                  "If you're not satisfied with the IC's decision, you can appeal within 90 days.",
              },
            ].map((right) => (
              <div
                key={right.number}
                className="flex gap-4 p-6 bg-primary-50 rounded-lg border-l-4 border-primary-500"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  {right.number}
                </div>
                <div>
                  <h3 className="font-semibold text-warm-900 mb-2">
                    {right.title}
                  </h3>
                  <p className="text-warm-700 leading-relaxed">
                    {right.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Process */}
      <section id="the-process" className="py-16 bg-warm-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-warm-900 mb-8">
            How the Process Works
          </h2>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-primary-200 hidden md:block"></div>

            <div className="space-y-8">
              {[
                {
                  step: 1,
                  title: 'Incident Occurs',
                  days: '',
                  description:
                    'You experience or witness harassment. Document details (date, time, witnesses). You have 3 months to file.',
                },
                {
                  step: 2,
                  title: 'File Complaint',
                  days: 'Day 1',
                  description:
                    'Submit written complaint to IC. IC acknowledges within 7 days.',
                },
                {
                  step: 3,
                  title: 'IC Review',
                  days: 'Day 1-7',
                  description:
                    'IC reviews complaint, decides if it falls under PoSH Act, may ask clarifying questions.',
                },
                {
                  step: 4,
                  title: 'Conciliation (Optional)',
                  days: 'Day 7-21',
                  description:
                    'If you request, IC attempts settlement. You can withdraw conciliation request anytime.',
                },
                {
                  step: 5,
                  title: 'Formal Inquiry',
                  days: 'Day 7-60',
                  description:
                    'If no conciliation, inquiry begins. Both parties present their case, witnesses may be called.',
                },
                {
                  step: 6,
                  title: 'Report Submitted',
                  days: 'Day 60-90',
                  description:
                    'IC completes inquiry report with findings and recommendations. You are informed of outcome.',
                },
                {
                  step: 7,
                  title: 'Action Taken',
                  days: 'After 90 days',
                  description:
                    'Employer acts on IC recommendations. Can include warning, transfer, termination, or compensation.',
                },
                {
                  step: 8,
                  title: 'Appeal (if needed)',
                  days: 'Within 90 days',
                  description:
                    'You can appeal to Appellate Authority (usually Labor Court) within 90 days of decision.',
                },
              ].map((item) => (
                <div key={item.step} className="relative flex gap-4 md:gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg z-10">
                    {item.step}
                  </div>
                  <div className="flex-1 bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-warm-900 text-lg">
                        {item.title}
                      </h3>
                      {item.days && (
                        <span className="text-sm text-primary-600 font-medium">
                          {item.days}
                        </span>
                      )}
                    </div>
                    <p className="text-warm-700 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faqs" className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-warm-900 mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <ExpandableCard
                key={index}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16 bg-warm-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-warm-900 mb-8">
            Additional Resources
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-warm-200">
              <h3 className="font-semibold text-warm-900 mb-4">
                Official Documents
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://indiacode.nic.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline text-sm"
                  >
                    PoSH Act, 2013 (Full Text) →
                  </a>
                </li>
                <li>
                  <a
                    href="https://indiacode.nic.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline text-sm"
                  >
                    PoSH Rules, 2013 →
                  </a>
                </li>
                <li>
                  <a
                    href="https://wcd.nic.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline text-sm"
                  >
                    Ministry of WCD Handbook →
                  </a>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg border border-warm-200">
              <h3 className="font-semibold text-warm-900 mb-4">Helplines</h3>
              <ul className="space-y-3">
                <li>
                  <div className="text-sm text-warm-600">Women Helpline</div>
                  <div className="text-2xl font-bold text-primary-600">181</div>
                </li>
                <li>
                  <div className="text-sm text-warm-600">
                    National Commission for Women
                  </div>
                  <div className="text-lg font-semibold text-primary-600">
                    7827-170-170
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to take action?</h2>
          <p className="text-xl text-primary-100 mb-8">
            We're here to help you through the process
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/chat"
              className="px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-all hover:scale-105"
            >
              File a Complaint
            </Link>
            <Link
              to="/chat"
              className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-primary-700 transition-all"
            >
              Check Case Status
            </Link>
          </div>

          <p className="mt-6 text-primary-100">
            Everything you share is confidential and protected by law.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
