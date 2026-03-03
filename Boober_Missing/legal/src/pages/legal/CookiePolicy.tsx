import React from 'react';
import { ScrollToTop } from '@/components/ui/scroll-to-top';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F5F5] to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Cookie Policy
            </h1>
            <p className="text-gray-500">
              Last updated: February 2025
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. What Are Cookies?</h2>
              <p className="text-gray-600 leading-relaxed">
                Cookies are small text files that are placed on your device when you visit our website or use our mobile application. They are widely used to make websites and apps work more efficiently and to provide information to the website/app owners.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. How We Use Cookies</h2>
              <p className="text-gray-600 leading-relaxed">
                Boober uses cookies and similar technologies for the following purposes:
              </p>
              
              <div className="overflow-x-auto mt-4">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Purpose</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">Essential</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Enable core functionality like authentication and security</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Session</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">Functional</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Remember your preferences and settings</td>
                      <td className="px-4 py-3 text-sm text-gray-600">1 year</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">Analytics</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Understand how you use our app</td>
                      <td className="px-4 py-3 text-sm text-gray-600">2 years</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">Marketing</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Show relevant advertisements</td>
                      <td className="px-4 py-3 text-sm text-gray-600">90 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-medium text-gray-700 mb-3">3.1 Essential Cookies</h3>
              <p className="text-gray-600 leading-relaxed">
                These cookies are necessary for the app to function and cannot be switched off. They include:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Authentication tokens</li>
                <li>Security and fraud prevention</li>
                <li>Session management</li>
                <li>Language and region settings</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">3.2 Functional Cookies</h3>
              <p className="text-gray-600 leading-relaxed">
                These cookies enable enhanced functionality and personalisation:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Remember your favourite routes</li>
                <li>Save your preferred taxi rank</li>
                <li>Keep you logged in</li>
                <li>Customise your app experience</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">3.3 Analytics Cookies</h3>
              <p className="text-gray-600 leading-relaxed">
                We use analytics cookies to understand how users interact with our app:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Google Analytics</li>
                <li>Firebase Analytics</li>
                <li>Mixpanel</li>
                <li>Custom event tracking</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">3.4 Marketing Cookies</h3>
              <p className="text-gray-600 leading-relaxed">
                These cookies are used to deliver relevant advertisements:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Facebook Pixel</li>
                <li>Google Ads</li>
                <li>Third-party advertising networks</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Similar Technologies</h2>
              <p className="text-gray-600 leading-relaxed">
                In addition to cookies, we may use the following technologies:
              </p>
              
              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">4.1 Local Storage</h3>
              <p className="text-gray-600 leading-relaxed">
                We use HTML5 local storage to store data on your device, such as your session state and cached ride information.
              </p>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">4.2 Device Identifiers</h3>
              <p className="text-gray-600 leading-relaxed">
                We collect device identifiers (IDFA/AAID) to track app installations and usage for analytics and advertising purposes.
              </p>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">4.3 Pixels and Web Beacons</h3>
              <p className="text-gray-600 leading-relaxed">
                We may use small transparent images (pixels or web beacons) in emails and web pages to track user engagement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Third-Party Cookies</h2>
              <p className="text-gray-600 leading-relaxed">
                Some cookies are placed by third-party services that appear on our pages. We do not control these cookies. Third-party cookies may be set by:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Payment processors (Stripe, PayFast)</li>
                <li>Map providers (Google Maps, Mapbox)</li>
                <li>Social media platforms (Facebook, Twitter, Instagram)</li>
                <li>Analytics providers</li>
                <li>Advertising networks</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Managing Cookies</h2>
              
              <h3 className="text-xl font-medium text-gray-700 mb-3">6.1 In-App Settings</h3>
              <p className="text-gray-600 leading-relaxed">
                You can manage your cookie preferences within the Boober app:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <ol className="list-decimal pl-6 text-gray-600 space-y-2">
                  <li>Open the Boober app</li>
                  <li>Go to Settings</li>
                  <li>Select Privacy</li>
                  <li>Tap on Cookie Preferences</li>
                  <li>Enable or disable cookie categories</li>
                </ol>
              </div>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">6.2 Browser Settings</h3>
              <p className="text-gray-600 leading-relaxed">
                You can also manage cookies through your browser settings. Please note that blocking all cookies may affect the functionality of our services:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li><a href="https://support.google.com/chrome/answer/95647" className="text-blue-600 hover:underline">Chrome</a></li>
                <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" className="text-blue-600 hover:underline">Firefox</a></li>
                <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" className="text-blue-600 hover:underline">Safari</a></li>
                <li><a href="https://support.microsoft.com/en-us/windows/delete-and-manage-cookies-168dab11-0753-043d-7c16-ede5947fc64d" className="text-blue-600 hover:underline">Edge</a></li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">6.3 Opt-Out Tools</h3>
              <p className="text-gray-600 leading-relaxed">
                You can opt out of certain third-party cookies using:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li><a href="https://www.youronlinechoices.com/" className="text-blue-600 hover:underline">Your Online Choices (Europe)</a></li>
                <li><a href="https://www.aboutads.info/choices/" className="text-blue-600 hover:underline">Digital Advertising Alliance</a></li>
                <li><a href="https://www.networkadvertising.org/choices/" className="text-blue-600 hover:underline">Network Advertising Initiative</a></li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Impact of Disabling Cookies</h2>
              <p className="text-gray-600 leading-relaxed">
                If you disable certain cookies, you may experience:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
                <li>Inability to log in or stay logged in</li>
                <li>Loss of saved preferences</li>
                <li>Reduced app functionality</li>
                <li>Less relevant advertisements</li>
                <li>Difficulty using certain features</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Updates to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have questions about our use of cookies, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p className="text-gray-600"><strong>Email:</strong> privacy@boober.co.za</p>
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
