import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const DeleteAccount = () => {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, this would send a request to your backend
    setSubmitted(true);
  };

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
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Delete Your Account</h1>

        {!submitted ? (
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Account Deletion Request</h2>
              <p className="text-gray-600 leading-relaxed">
                We're sorry to see you go. If you would like to delete your UYHO Volunteer Portal account, 
                please fill out the form below. Your request will be processed within 7 business days.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-amber-800 mb-2">⚠️ Important Information</h3>
              <p className="text-amber-700 text-sm mb-2">When you delete your account, the following data will be permanently removed:</p>
              <ul className="list-disc list-inside text-amber-700 text-sm space-y-1 ml-2">
                <li>Your profile information (name, email, phone number, profile picture)</li>
                <li>Your volunteer activity history and hours logged</li>
                <li>Your badges and achievements</li>
                <li>Your course completion records</li>
                <li>Your chat messages and communications</li>
                <li>Your campaign participation history</li>
              </ul>
              <p className="text-amber-700 text-sm mt-2">
                <strong>Note:</strong> Certificates you have earned will remain valid and verifiable, 
                but will no longer be linked to your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for leaving (optional)
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder="Help us improve by sharing why you're leaving..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Request Account Deletion
                </button>
              </div>
            </form>

            <p className="text-gray-500 text-sm mt-4 text-center">
              Changed your mind? You can continue using your account normally until the deletion is processed.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Request Submitted</h2>
            <p className="text-gray-600 mb-4">
              Your account deletion request has been received. We will process your request within 7 business days.
            </p>
            <p className="text-gray-600 mb-6">
              You will receive a confirmation email at <strong>{email}</strong> once your account has been deleted.
            </p>
            <Link
              to="/"
              className="inline-block bg-emerald-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-800 mb-2">Need Help?</h3>
          <p className="text-gray-600 text-sm">
            If you have any questions about the account deletion process or would like to request data export 
            before deletion, please contact us at{' '}
            <a href="mailto:contact@uyho.org" className="text-emerald-600 hover:underline">
              contact@uyho.org
            </a>
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
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

export default DeleteAccount;
