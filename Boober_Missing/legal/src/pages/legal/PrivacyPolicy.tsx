import React from 'react';
import { ScrollToTop } from '@/components/ui/scroll-to-top';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F5F5] to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-500">
              Last updated: February 2025
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
              <p className="text-gray-600 leading-relaxed">
                Boober ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                We comply with the Protection of Personal Information Act (POPIA) of South Africa and other applicable data protection laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-700 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-600 leading-relaxed">We may collect the following personal information:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li><strong>Account Information:</strong> Name, email address, phone number, profile photo</li>
                <li><strong>Identity Verification:</strong> South African ID number, driver's license, PrDP (for drivers)</li>
                <li><strong>Payment Information:</strong> Credit/debit card details, mobile payment accounts</li>
                <li><strong>Vehicle Information:</strong> Registration number, make, model, license disc (for drivers)</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">2.2 Location Information</h3>
              <p className="text-gray-600 leading-relaxed">
                We collect precise location data when you use the App to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Match passengers with nearby drivers</li>
                <li>Navigate to pickup and drop-off locations</li>
                <li>Track rides for safety purposes</li>
                <li>Improve our service and routing</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">2.3 Usage Information</h3>
              <p className="text-gray-600 leading-relaxed">
                We automatically collect information about how you use the App:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Device type, operating system, and unique identifiers</li>
                <li>App features used and interactions</li>
                <li>Ride history and preferences</li>
                <li>Crash reports and performance data</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">2.4 Information from Third Parties</h3>
              <p className="text-gray-600 leading-relaxed">
                We may receive information from:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Social media platforms (if you connect your account)</li>
                <li>Government databases (for driver verification)</li>
                <li>Payment processors</li>
                <li>Other users (ratings, reviews, reports)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed">We use your information to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Provide, maintain, and improve our Services</li>
                <li>Process transactions and send related information</li>
                <li>Verify user identity and prevent fraud</li>
                <li>Personalise your experience and provide recommendations</li>
                <li>Send promotional communications (with your consent)</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Monitor and analyse trends, usage, and activities</li>
                <li>Detect, investigate, and prevent fraudulent transactions</li>
                <li>Ensure platform safety and compliance</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Information Sharing</h2>
              
              <h3 className="text-xl font-medium text-gray-700 mb-3">4.1 With Other Users</h3>
              <p className="text-gray-600 leading-relaxed">
                We share limited information between passengers and drivers to facilitate rides:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Passengers see driver name, photo, vehicle details, and rating</li>
                <li>Drivers see passenger name, pickup location, and destination</li>
                <li>Ratings and reviews are visible to both parties</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">4.2 With Service Providers</h3>
              <p className="text-gray-600 leading-relaxed">
                We share information with third parties who perform services on our behalf:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Payment processors</li>
                <li>Cloud hosting providers</li>
                <li>Analytics services</li>
                <li>Customer support platforms</li>
                <li>Map and navigation providers</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">4.3 For Legal Purposes</h3>
              <p className="text-gray-600 leading-relaxed">
                We may disclose your information if required by law, court order, or government request, or to protect our rights and the safety of users.
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Data Security</h2>
              <p className="text-gray-600 leading-relaxed">
                We implement appropriate technical and organisational measures to protect your personal information, including:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security assessments</li>
                <li>Employee training on data protection</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of your data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Data Retention</h2>
              <p className="text-gray-600 leading-relaxed">
                We retain your personal information for as long as necessary to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Provide the Services you requested</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes and enforce agreements</li>
                <li>Support business operations</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                When your information is no longer needed, we will securely delete or anonymise it.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Your Rights (POPIA)</h2>
              <p className="text-gray-600 leading-relaxed">
                Under the Protection of Personal Information Act, you have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Objection:</strong> Object to processing of your personal information</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                To exercise these rights, contact our Information Officer at privacy@boober.co.za.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Cross-Border Transfers</h2>
              <p className="text-gray-600 leading-relaxed">
                Your information may be transferred to and processed in countries outside South Africa. We ensure appropriate safeguards are in place, such as standard contractual clauses or binding corporate rules.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-600 leading-relaxed">
                Our Services are not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we discover that a child has provided us with personal information, we will delete it immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Marketing Communications</h2>
              <p className="text-gray-600 leading-relaxed">
                With your consent, we may send you promotional emails and SMS messages about our services. You can opt out at any time by:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Clicking "unsubscribe" in marketing emails</li>
                <li>Replying "STOP" to SMS messages</li>
                <li>Updating your preferences in the App settings</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Changes to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy in the App and updating the "Last updated" date. We encourage you to review this policy periodically.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">12. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, please contact:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p className="text-gray-600"><strong>Information Officer:</strong> privacy@boober.co.za</p>
                <p className="text-gray-600"><strong>General Inquiries:</strong> support@boober.co.za</p>
                <p className="text-gray-600"><strong>Address:</strong> Johannesburg, South Africa</p>
              </div>
            </section>
          </div>
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
}
