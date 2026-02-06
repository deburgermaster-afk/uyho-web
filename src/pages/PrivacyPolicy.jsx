import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
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
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: February 5, 2026</p>

        <div className="bg-white rounded-lg shadow-md p-6 md:p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              United Young Helpers Organization (UYHO) ("we," "our," or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use 
              our website (uyho.org) and mobile application ("UYHO Volunteer Portal").
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Information We Collect</h2>
            <p className="text-gray-600 leading-relaxed mb-3">We may collect the following types of information:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Personal Information:</strong> Name, email address, phone number, and profile picture when you register as a volunteer.</li>
              <li><strong>Account Information:</strong> Username, password (encrypted), and volunteer ID.</li>
              <li><strong>Activity Data:</strong> Volunteer hours, campaigns participated, courses completed, and badges earned.</li>
              <li><strong>Device Information:</strong> Device type, operating system, and app version for troubleshooting purposes.</li>
              <li><strong>Usage Data:</strong> How you interact with our app and website to improve our services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. How We Use Your Information</h2>
            <p className="text-gray-600 leading-relaxed mb-3">We use the collected information to:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Create and manage your volunteer account</li>
              <li>Track and display your volunteer activities and achievements</li>
              <li>Send notifications about campaigns, events, and announcements</li>
              <li>Generate certificates for completed courses and volunteer work</li>
              <li>Improve our services and user experience</li>
              <li>Communicate with you regarding your volunteer activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Information Sharing</h2>
            <p className="text-gray-600 leading-relaxed mb-3">We do not sell your personal information. We may share your information only in the following cases:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Within UYHO:</strong> With wing coordinators and administrators for volunteer management.</li>
              <li><strong>Public Profiles:</strong> Your volunteer profile may be visible to other UYHO members based on your privacy settings.</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Data Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information. 
              This includes encryption, secure servers, and access controls. However, no method of transmission over the 
              Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide you 
              services. You may request deletion of your account and associated data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed mb-3">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Access and review your personal information</li>
              <li>Update or correct your information</li>
              <li>Delete your account and data</li>
              <li>Opt-out of non-essential communications</li>
              <li>Export your data in a portable format</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Children's Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              Our services are intended for users who are at least 13 years old. We do not knowingly collect personal 
              information from children under 13. If you believe we have collected information from a child under 13, 
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Third-Party Services</h2>
            <p className="text-gray-600 leading-relaxed">
              Our app may contain links to third-party websites or services. We are not responsible for the privacy 
              practices of these external sites. We encourage you to review their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the 
              new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">11. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="mt-3 text-gray-600">
              <p><strong>United Young Helpers Organization (UYHO)</strong></p>
              <p>Email: contact@uyho.org</p>
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

export default PrivacyPolicy;
