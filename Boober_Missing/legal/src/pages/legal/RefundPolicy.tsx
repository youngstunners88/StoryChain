import React from 'react';
import { ScrollToTop } from '@/components/ui/scroll-to-top';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F5F5] to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Refund Policy
            </h1>
            <p className="text-gray-500">
              Last updated: February 2025
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Overview</h2>
              <p className="text-gray-600 leading-relaxed">
                At Boober, we want you to have a great experience with every ride. If something goes wrong, we're here to help. This Refund Policy outlines when and how you may be eligible for a refund.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Eligible Refund Situations</h2>
              
              <h3 className="text-xl font-medium text-gray-700 mb-3">2.1 Ride Quality Issues</h3>
              <p className="text-gray-600 leading-relaxed">You may be eligible for a full or partial refund if:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>The driver cancelled the ride after you were already picked up</li>
                <li>The driver took a significantly longer route without justification</li>
                <li>The vehicle did not meet our safety or cleanliness standards</li>
                <li>The driver was unprofessional or rude</li>
                <li>You were charged for a ride you did not take</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">2.2 Technical Issues</h3>
              <p className="text-gray-600 leading-relaxed">Refunds may be issued for:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Duplicate charges for the same ride</li>
                <li>App crashes during payment processing resulting in incorrect charges</li>
                <li>Promo codes or discounts not applied correctly</li>
                <li>System errors causing overcharging</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">2.3 Safety Concerns</h3>
              <p className="text-gray-600 leading-relaxed">
                Full refunds are automatically issued when:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>You report a serious safety incident during your ride</li>
                <li>Your ride is cancelled due to a safety emergency</li>
                <li>The vehicle is involved in an accident (no charge for incomplete ride)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Non-Refundable Situations</h2>
              <p className="text-gray-600 leading-relaxed">Refunds are generally not available for:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Cancellations made after the driver has arrived (cancellation fee applies)</li>
                <li>Changing your mind about the destination after booking</li>
                <li>Delays caused by traffic, weather, or road conditions</li>
                <li>No-show fees when you fail to meet the driver at the pickup location</li>
                <li>Rides completed more than 48 hours ago (for quality complaints)</li>
                <li>Wallet credits that have been used or expired</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. How to Request a Refund</h2>
              
              <h3 className="text-xl font-medium text-gray-700 mb-3">4.1 In-App</h3>
              <p className="text-gray-600 leading-relaxed">The fastest way to request a refund is through the Boober app:</p>
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <ol className="list-decimal pl-6 text-gray-600 space-y-2">
                  <li>Open the Boober app</li>
                  <li>Go to "Your Rides" in the menu</li>
                  <li>Select the ride in question</li>
                  <li>Tap "Report an Issue"</li>
                  <li>Choose the relevant issue category</li>
                  <li>Provide details and submit</li>
                </ol>
              </div>
              <p className="text-gray-600 leading-relaxed mt-4">
                Our team will review your request within 48 hours and respond via email or in-app notification.
              </p>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">4.2 By Email</h3>
              <p className="text-gray-600 leading-relaxed">
                Send your refund request to <strong>refunds@boober.co.za</strong> with:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Your registered phone number or email</li>
                <li>The ride ID or date/time of the ride</li>
                <li>Reason for the refund request</li>
                <li>Any supporting evidence (photos, screenshots)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Refund Processing</h2>
              
              <h3 className="text-xl font-medium text-gray-700 mb-3">5.1 Refund Methods</h3>
              <p className="text-gray-600 leading-relaxed">
                Approved refunds are typically issued as:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li><strong>Boober Wallet Credits:</strong> Instant - can be used for future rides</li>
                <li><strong>Original Payment Method:</strong> 5-14 business days depending on your bank</li>
                <li><strong>Voucher Code:</strong> For promotional compensation</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">5.2 Partial Refunds</h3>
              <p className="text-gray-600 leading-relaxed">
                In some cases, we may issue a partial refund based on:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>The portion of the ride completed</li>
                <li>The severity of the issue reported</li>
                <li>Our investigation findings</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Refund Timeframes</h2>
              <p className="text-gray-600 leading-relaxed">
                Time limits for refund requests:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li><strong>Ride quality issues:</strong> 48 hours of ride completion</li>
                <li><strong>Billing errors:</strong> 30 days of the transaction</li>
                <li><strong>Fraud or unauthorised charges:</strong> 60 days of the transaction</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Dispute Resolution</h2>
              <p className="text-gray-600 leading-relaxed">
                If your refund request is denied and you believe it should be approved, you may:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Reply to the denial email with additional information</li>
                <li>Request escalation to a senior support agent</li>
                <li>Contact the Motor Industry Ombudsman of South Africa</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Driver-Related Refunds</h2>
              <p className="text-gray-600 leading-relaxed">
                When refunds are issued due to driver misconduct or errors, the cost may be deducted from the driver's earnings. Drivers have the right to dispute these deductions through the Driver Support portal.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Cancellation Fees</h2>
              <p className="text-gray-600 leading-relaxed">
                Cancellation fees may apply when you cancel a ride:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li><strong>After driver arrival:</strong> R15 - R25 fee</li>
                <li><strong>No-show:</strong> Full fare charged</li>
                <li><strong>Within 2 minutes of booking:</strong> No fee</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                Cancellation fees are generally non-refundable unless the driver was significantly delayed or unresponsive.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Policy Updates</h2>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to modify this Refund Policy at any time. Changes will be posted in the app and on our website. Continued use of our services after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                For refund inquiries:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p className="text-gray-600"><strong>Refund Support:</strong> refunds@boober.co.za</p>
                <p className="text-gray-600"><strong>Hours:</strong> Monday - Sunday, 6:00 AM - 10:00 PM SAST</p>
                <p className="text-gray-600"><strong>Phone:</strong> +27 11 BOOBER (266237)</p>
              </div>
            </section>
          </div>
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
}
