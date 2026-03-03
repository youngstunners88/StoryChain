import React from 'react';
import { ScrollToTop } from '@/components/ui/scroll-to-top';

export default function CommunityGuidelines() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F5F5] to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Community Guidelines
            </h1>
            <p className="text-gray-500">
              Last updated: February 2025
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome to Boober</h2>
              <p className="text-gray-600 leading-relaxed">
                Boober is a community of passengers, drivers, and marshals working together to make taxi travel in South Africa safer, more convenient, and more reliable. These guidelines help us maintain a respectful and safe environment for everyone.
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                By using Boober, you agree to follow these guidelines. Violations may result in warnings, temporary suspension, or permanent removal from the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Respect and Dignity</h2>
              <p className="text-gray-600 leading-relaxed">
                Treat all members of the Boober community with respect and dignity, regardless of:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Race, ethnicity, or national origin</li>
                <li>Gender, gender identity, or sexual orientation</li>
                <li>Religion or belief system</li>
                <li>Disability or health status</li>
                <li>Age, language, or socioeconomic status</li>
              </ul>
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
                <p className="text-red-700 font-medium">Discrimination, harassment, or hate speech will not be tolerated.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Safety First</h2>
              
              <h3 className="text-xl font-medium text-gray-700 mb-3">2.1 For Passengers</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Always wear your seatbelt</li>
                <li>Do not distract the driver while the vehicle is in motion</li>
                <li>Report any safety concerns immediately through the app</li>
                <li>Do not consume alcohol or illegal substances during the ride</li>
                <li>Keep the vehicle clean and tidy</li>
                <li>Respect the driver's instructions and rules</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">2.2 For Drivers</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Drive safely and follow all traffic laws</li>
                <li>Keep your vehicle clean, roadworthy, and well-maintained</li>
                <li>Do not use your phone while driving (except for navigation)</li>
                <li>Do not drive under the influence of alcohol or drugs</li>
                <li>Ensure passengers board and alight safely</li>
                <li>Report any incidents or concerns immediately</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">2.3 For Marshals</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Manage taxi rank operations safely and efficiently</li>
                <li>Assist passengers with boarding and finding the right taxi</li>
                <li>Resolve disputes fairly and professionally</li>
                <li>Report safety hazards or incidents to authorities</li>
                <li>Maintain order at the rank</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Professional Conduct</h2>
              
              <h3 className="text-xl font-medium text-gray-700 mb-3">3.1 Communication</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Communicate clearly and politely</li>
                <li>Use appropriate language - no profanity, insults, or threats</li>
                <li>Respect personal boundaries and privacy</li>
                <li>Do not make unwanted advances or inappropriate comments</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">3.2 Financial Integrity</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Pay the agreed fare</li>
                <li>Do not attempt to evade fares or fees</li>
                <li>Do not use fraudulent payment methods</li>
                <li>Report pricing errors honestly</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">3.3 Honesty and Transparency</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Provide accurate information in your profile</li>
                <li>Report incidents truthfully</li>
                <li>Do not create fake accounts or misrepresent yourself</li>
                <li>Do not manipulate ratings or reviews</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Prohibited Activities</h2>
              <p className="text-gray-600 leading-relaxed">
                The following activities are strictly prohibited and may result in immediate account suspension:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">Violence & Threats</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Physical violence or threats</li>
                    <li>• Harassment or intimidation</li>
                    <li>• Carrying weapons illegally</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">Illegal Activities</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Transporting illegal goods</li>
                    <li>• Drug use or distribution</li>
                    <li>• Money laundering</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">Fraud & Deception</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Fake accounts or reviews</li>
                    <li>• Payment fraud</li>
                    <li>• Identity theft</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">Privacy Violations</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Sharing personal information</li>
                    <li>• Unauthorized photography</li>
                    <li>• Stalking or surveillance</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Ratings and Reviews</h2>
              <p className="text-gray-600 leading-relaxed">
                Our rating system helps maintain quality and trust. Please follow these guidelines:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Rate based on the actual ride experience</li>
                <li>Do not retaliate with negative ratings</li>
                <li>Do not offer or accept incentives for ratings</li>
                <li>Report issues separately from ratings</li>
                <li>Be honest and constructive in reviews</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Reporting Violations</h2>
              <p className="text-gray-600 leading-relaxed">
                If you experience or witness a violation of these guidelines, please report it immediately:
              </p>
              <div className="bg-blue-50 rounded-lg p-4 mt-4">
                <ol className="list-decimal pl-6 text-gray-600 space-y-2">
                  <li>Open the Boober app</li>
                  <li>Go to "Help" or "Safety"</li>
                  <li>Select "Report an Issue"</li>
                  <li>Choose the relevant category</li>
                  <li>Provide details and any evidence</li>
                  <li>Submit your report</li>
                </ol>
              </div>
              <p className="text-gray-600 leading-relaxed mt-4">
                For emergencies, always contact local authorities first:
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
                <p className="text-yellow-800"><strong>Emergency:</strong> 10111 (South African Police)</p>
                <p className="text-yellow-800"><strong>Ambulance:</strong> 10177</p>
                <p className="text-yellow-800"><strong>Boober Safety Line:</strong> +27 11 BOOBER (266237)</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Consequences</h2>
              <p className="text-gray-600 leading-relaxed">
                Violations of these guidelines may result in:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li><strong>Warning:</strong> For first-time or minor violations</li>
                <li><strong>Temporary suspension:</strong> For repeated or moderate violations (1-30 days)</li>
                <li><strong>Permanent ban:</strong> For serious violations or repeated offences</li>
                <li><strong>Legal action:</strong> For criminal activities or serious safety threats</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                We investigate all reports thoroughly and fairly. You may appeal decisions through our support channels.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Working Together</h2>
              <p className="text-gray-600 leading-relaxed">
                Building a strong community requires effort from all of us. Here's how you can help:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Be patient and understanding with fellow community members</li>
                <li>Share feedback to help us improve</li>
                <li>Support new users who may be unfamiliar with the app</li>
                <li>Report bugs and issues promptly</li>
                <li>Spread the word about Boober to help grow our community</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Updates</h2>
              <p className="text-gray-600 leading-relaxed">
                These Community Guidelines may be updated from time to time. We will notify you of significant changes through the app or via email. Continued use of Boober after changes constitutes acceptance of the updated guidelines.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                Questions about these guidelines? Reach out:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p className="text-gray-600"><strong>Community Support:</strong> community@boober.co.za</p>
                <p className="text-gray-600"><strong>Safety Team:</strong> safety@boober.co.za</p>
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
