import React from 'react';
import { Link } from 'react-router-dom';

const ChildSafety = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-emerald-600 text-white py-6">
        <div className="container mx-auto px-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/icons/icon-72x72.png" alt="UYHO" className="w-10 h-10 rounded" />
            <h1 className="text-2xl font-bold">UYHO</h1>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Child Safety Standards</h1>
        <p className="text-gray-600 mb-8">Last updated: February 5, 2026</p>

        <div className="bg-white rounded-lg shadow-md p-6 md:p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Our Commitment</h2>
            <p className="text-gray-600 leading-relaxed">
              United Young Helpers Organization (UYHO) is committed to the safety and protection of children. 
              We have zero tolerance for child sexual abuse material (CSAM) or any form of child exploitation 
              on our platform. We actively work to prevent, detect, and remove any such content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Prevention Measures</h2>
            <p className="text-gray-600 leading-relaxed mb-3">We implement the following measures to protect children:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Age Restrictions:</strong> Our volunteer portal is intended for users aged 13 and above.</li>
              <li><strong>Content Moderation:</strong> All user-generated content is subject to review and moderation.</li>
              <li><strong>Supervised Activities:</strong> Volunteer activities involving minors are supervised by verified adult coordinators.</li>
              <li><strong>Background Checks:</strong> Coordinators and leaders undergo verification processes.</li>
              <li><strong>Reporting Mechanisms:</strong> Easy-to-use reporting tools for inappropriate content or behavior.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Prohibited Content & Behavior</h2>
            <p className="text-gray-600 leading-relaxed mb-3">The following are strictly prohibited on our platform:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Child sexual abuse material (CSAM) of any kind</li>
              <li>Content that sexualizes minors</li>
              <li>Grooming or predatory behavior toward minors</li>
              <li>Solicitation of personal information from minors</li>
              <li>Any content that endangers the safety of children</li>
              <li>Bullying or harassment targeting minors</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Detection & Enforcement</h2>
            <p className="text-gray-600 leading-relaxed mb-3">We employ multiple methods to detect and address violations:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Automated Detection:</strong> Systems to identify and flag potentially harmful content.</li>
              <li><strong>Human Review:</strong> Trained moderators review flagged content and reports.</li>
              <li><strong>User Reports:</strong> Community members can report concerns through our reporting system.</li>
              <li><strong>Swift Action:</strong> Immediate removal of violating content and account suspension.</li>
              <li><strong>Law Enforcement:</strong> We report CSAM and exploitation to relevant authorities including NCMEC.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Reporting Child Safety Concerns</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              If you encounter any content or behavior that violates our child safety standards, please report it immediately:
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">🚨 Report Child Safety Issues</h3>
              <ul className="text-red-700 space-y-2">
                <li><strong>In-App:</strong> Use the "Report" button on any content or profile</li>
                <li><strong>Email:</strong> <a href="mailto:safety@uyho.org" className="underline">safety@uyho.org</a></li>
                <li><strong>Emergency Contact:</strong> <a href="mailto:contact@uyho.org" className="underline">contact@uyho.org</a></li>
              </ul>
              <p className="text-red-700 mt-3 text-sm">
                For immediate danger, please contact your local law enforcement.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Consequences of Violations</h2>
            <p className="text-gray-600 leading-relaxed mb-3">Violations of our child safety standards result in:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Immediate content removal</li>
              <li>Account suspension or permanent ban</li>
              <li>Reporting to law enforcement authorities</li>
              <li>Reporting to the National Center for Missing & Exploited Children (NCMEC)</li>
              <li>Cooperation with investigations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Training & Awareness</h2>
            <p className="text-gray-600 leading-relaxed">
              Our team members and volunteer coordinators receive training on child safety, including 
              recognizing signs of abuse, proper reporting procedures, and maintaining safe environments 
              for all participants in our programs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Contact Information</h2>
            <p className="text-gray-600 leading-relaxed">
              For questions about our child safety standards or to report concerns:
            </p>
            <div className="mt-3 text-gray-600">
              <p><strong>United Young Helpers Organization (UYHO)</strong></p>
              <p>Child Safety Team: <a href="mailto:safety@uyho.org" className="text-emerald-600 hover:underline">safety@uyho.org</a></p>
              <p>General Contact: <a href="mailto:contact@uyho.org" className="text-emerald-600 hover:underline">contact@uyho.org</a></p>
              <p>Website: <a href="https://uyho.org" className="text-emerald-600 hover:underline">https://uyho.org</a></p>
            </div>
          </section>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link to="/" className="text-emerald-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2026 United Young Helpers Organization. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default ChildSafety;
