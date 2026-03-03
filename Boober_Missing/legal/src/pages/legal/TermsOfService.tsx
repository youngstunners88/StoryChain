import React from 'react';
import { ScrollToTop } from '@/components/ui/scroll-to-top';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F5F5] to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-500">
              Last updated: February 2025
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                By downloading, accessing, or using the Boober mobile application ("App") and related services ("Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the App or Services.
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                Boober is a taxi-hailing and ride-sharing platform operating in South Africa, connecting passengers with taxi drivers and marshals for minibus taxi transportation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. User Accounts</h2>
              
              <h3 className="text-xl font-medium text-gray-700 mb-3">2.1 Registration</h3>
              <p className="text-gray-600 leading-relaxed">
                To use certain features of the App, you must register and create an account. You agree to provide accurate, current, and complete information during registration and to update such information as necessary.
              </p>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">2.2 Account Security</h3>
              <p className="text-gray-600 leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
              </p>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">2.3 Account Types</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Passenger Account:</strong> For individuals seeking taxi transportation services</li>
                <li><strong>Driver Account:</strong> For licensed taxi drivers operating registered minibus taxis</li>
                <li><strong>Marshal Account:</strong> For authorised taxi rank coordinators and managers</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Use of Services</h2>
              
              <h3 className="text-xl font-medium text-gray-700 mb-3">3.1 Permitted Use</h3>
              <p className="text-gray-600 leading-relaxed">
                You may use the App and Services only for lawful purposes and in accordance with these Terms. You agree not to use the App:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>In any way that violates any applicable law or regulation</li>
                <li>To impersonate any person or entity</li>
                <li>To engage in any activity that interferes with or disrupts the Services</li>
                <li>To attempt to gain unauthorized access to any portion of the App</li>
                <li>To use automated systems or software to extract data from the App</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">3.2 Driver Requirements</h3>
              <p className="text-gray-600 leading-relaxed">
                Drivers using the App must:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Hold a valid Professional Driving Permit (PrDP)</li>
                <li>Operate a registered and roadworthy minibus taxi</li>
                <li>Comply with all South African traffic laws and regulations</li>
                <li>Have valid insurance coverage as required by law</li>
                <li>Complete Boober's driver verification process</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Rides and Payments</h2>
              
              <h3 className="text-xl font-medium text-gray-700 mb-3">4.1 Ride Requests</h3>
              <p className="text-gray-600 leading-relaxed">
                Passengers may request rides through the App. By requesting a ride, you agree to pay the applicable fare displayed in the App. Fares are calculated based on distance, time, and current market rates.
              </p>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">4.2 Payment Methods</h3>
              <p className="text-gray-600 leading-relaxed">
                Boober supports multiple payment methods including:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Cash payments directly to the driver</li>
                <li>Credit and debit cards</li>
                <li>Mobile payment solutions (e.g., SnapScan, Zapper)</li>
                <li>Boober wallet credits</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">4.3 Fares and Fees</h3>
              <p className="text-gray-600 leading-relaxed">
                Fares displayed in the App are estimates. The final fare may vary based on actual route taken, traffic conditions, and other factors. Boober may charge service fees which will be clearly disclosed before you confirm your ride.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Ratings and Reviews</h2>
              <p className="text-gray-600 leading-relaxed">
                Both passengers and drivers may rate each other after completed rides. Ratings affect user reputation and continued access to the platform. We reserve the right to suspend or terminate accounts with consistently low ratings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Safety</h2>
              
              <h3 className="text-xl font-medium text-gray-700 mb-3">6.1 Safety Features</h3>
              <p className="text-gray-600 leading-relaxed">
                Boober provides safety features including:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Real-time ride tracking and sharing</li>
                <li>In-app emergency assistance</li>
                <li>Driver and vehicle verification</li>
                <li>Community safety reporting</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">6.2 User Responsibilities</h3>
              <p className="text-gray-600 leading-relaxed">
                Users are expected to behave safely and respectfully. This includes wearing seatbelts, following driver instructions, and reporting any safety concerns immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed">
                The App, including all content, features, and functionality, is owned by Boober and is protected by international copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed">
                To the maximum extent permitted by law, Boober shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Services. Boober acts solely as a technology platform connecting passengers with independent taxi operators.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Termination</h2>
              <p className="text-gray-600 leading-relaxed">
                We may terminate or suspend your account at any time for any reason, including violation of these Terms. Upon termination, your right to use the App will immediately cease.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Dispute Resolution</h2>
              <p className="text-gray-600 leading-relaxed">
                Any disputes arising from these Terms or your use of the Services shall be resolved through binding arbitration in Johannesburg, South Africa, in accordance with the rules of the Arbitration Foundation of Southern Africa (AFSA).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Changes to Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                We may modify these Terms at any time. We will notify you of any material changes by posting the updated Terms in the App or by other means. Your continued use of the App after such changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">12. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p className="text-gray-600"><strong>Email:</strong> legal@boober.co.za</p>
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
