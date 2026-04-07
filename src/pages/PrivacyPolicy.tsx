import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-4 max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Privacy Policy</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-20">
        <div className="bg-card/60 rounded-2xl backdrop-blur-sm border border-border/50 p-6 md:p-8 space-y-6">
          {/* Last Updated */}
          <div className="text-sm text-muted-foreground border-l-4 border-primary pl-4">
            Last updated: April 7, 2026
          </div>

          {/* Introduction */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Privacy at FAH Ride</h2>
            <p className="text-muted-foreground leading-relaxed">
              FAH Ride (Find-and-Hop) is committed to protecting your privacy while making carpooling safe and trustworthy. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our Service, including our website and mobile applications. We are designed exclusively for Chitkara University students and prioritize your data security.
            </p>
          </section>

          {/* Section 1 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">1. Information We Collect</h3>
            <p className="text-muted-foreground leading-relaxed font-medium mb-3">Account and Identity Information:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li>Chitkara University email address (@chitkara.edu.in) for verification</li>
              <li>Full name, phone number, branch, and academic year</li>
              <li>Profile picture (optional) for community trust and identification</li>
              <li>Password hash (never stored in plain text, encrypted with bcryptjs)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed font-medium mt-4 mb-3">Ride and Transportation Information:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li>Real-time GPS coordinates during active rides for safety tracking</li>
              <li>Pickup and drop-off locations you enter or select</li>
              <li>Ride dates, times, and departure/arrival information</li>
              <li>Vehicle details: make, model, color, and license plate number</li>
              <li>Seats available/requested and pricing information</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed font-medium mt-4 mb-3">Communication Data:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li>In-app chat messages between drivers and passengers during ride coordination</li>
              <li>Notification preferences and communication history</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed font-medium mt-4 mb-3">Technical Information:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li>Device type, OS, and browser information for app compatibility</li>
              <li>IP address and device identifiers for security and fraud prevention</li>
              <li>App usage patterns and feature interactions</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h3>
            <p className="text-muted-foreground leading-relaxed">
              FAH Ride uses collected information specifically for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li><strong>Core Functionality:</strong> Matching drivers with passengers, displaying ride availability, and coordinating transportation</li>
              <li><strong>Real-time Features:</strong> GPS tracking during rides, live notifications of ride status, and instant messaging</li>
              <li><strong>Community Safety:</strong> Verifying university affiliation, preventing fraud, and maintaining the ratings/review system</li>
              <li><strong>Account Management:</strong> OTP-based authentication, profile updates, and ride history</li>
              <li><strong>Communication:</strong> Ride confirmations, cancellations, and urgent notifications about rides</li>
              <li><strong>Analytics:</strong> Understanding ride patterns, popular routes, and peak usage times for platform improvement</li>
              <li><strong>Dispute Resolution:</strong> Reviewing ride details and chat history when conflicts arise between users</li>
              <li><strong>Legal Compliance:</strong> Complying with legal requests and investigating policy violations</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">3. Information Sharing and Disclosure</h3>
            <p className="text-muted-foreground leading-relaxed font-medium mb-3">Who We Share Your Information With:</p>
            <p className="text-muted-foreground leading-relaxed">
              FAH Ride limits data sharing to maintain privacy while enabling the carpooling service:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li><strong>Other Users:</strong> When you post a ride, your name, profile picture, rating, and branch/year are visible to passengers. When you book a ride, the driver sees your name and rating.</li>
              <li><strong>In-App Chat:</strong> Messages between drivers and passengers are stored encrypted and visible only to those involved in the ride</li>
              <li><strong>Technical Providers:</strong> Cloudinary (for image hosting), Socket.io (for real-time features), MongoDB (for secure data storage)</li>
              <li><strong>Support Team:</strong> Ride details and chat history are reviewed by our team only when resolving disputes</li>
              <li><strong>Law Enforcement:</strong> Only if legally required by court order or government authority</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We <strong>never sell</strong> your personal data to third parties. We do not share your email, phone, or location with anyone outside the platform except as required above.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">4. Data Security</h3>
            <p className="text-muted-foreground leading-relaxed">
              FAH Ride implements industry-standard security practices to protect your data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li>Passwords are hashed using bcryptjs before storage (never stored in plain text)</li>
              <li>Sensitive data is encrypted in transit using HTTPS/TLS protocols</li>
              <li>JWT tokens are used for secure, stateless authentication</li>
              <li>MongoDB databases include access restrictions and role-based permissions</li>
              <li>Regular security monitoring and vulnerability scanning</li>
              <li>Rate limiting on API endpoints to prevent brute force attacks</li>
              <li>All communications are logged and monitored for security threats</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              While we employ strong security measures, no system is 100% secure. Users are responsible for keeping their passwords confidential.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">5. Data Retention</h3>
            <p className="text-muted-foreground leading-relaxed">
              FAH Ride retains your data as follows:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li><strong>Active Accounts:</strong> Your profile, ride history, and ratings are retained while your account is active</li>
              <li><strong>Ride History:</strong> Stored for 2 years for dispute resolution and analytics purposes</li>
              <li><strong>Chat Messages:</strong> Retained for 1 year after ride completion</li>
              <li><strong>Upon Deletion:</strong> All personal data is permanently deleted within 30 days of account deletion</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">6. Location Data and GPS Tracking</h3>
            <p className="text-muted-foreground leading-relaxed">
              FAH Ride uses precise GPS location for ride functionality:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li><strong>During Ride Request:</strong> Your location is sent to available drivers for matching purposes</li>
              <li><strong>During Active Rides:</strong> Real-time GPS coordinates enable live tracking, distance calculation, and safety monitoring</li>
              <li><strong>Accuracy:</strong> Location is approximate within a few meters to protect privacy</li>
              <li><strong>Post-Ride Storage:</strong> Route data is deleted after ride completion unless needed for disputes</li>
              <li><strong>User Control:</strong> You can disable GPS through your device settings (though some features may not work)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Location data is never shared publicly and is visible only to your current ride participant.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">7. Cookies and Local Storage</h3>
            <p className="text-muted-foreground leading-relaxed">
              FAH Ride uses cookies and local storage for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li><strong>Session Management:</strong> Keeping you logged in across page refreshes</li>
              <li><strong>Authentication:</strong> Storing JWT tokens securely for API requests</li>
              <li><strong>Preferences:</strong> Saving your app settings (language, notifications, etc.)</li>
              <li><strong>Analytics:</strong> Measuring feature usage and page visits after you opt in</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You can delete cookies through your browser settings, but this may affect app functionality.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">8. Your Privacy Rights</h3>
            <p className="text-muted-foreground leading-relaxed">
              You have the following privacy rights on FAH Ride:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li><strong>Access:</strong> View all your personal information through your profile</li>
              <li><strong>Correction:</strong> Update your name, phone, branch, year, and profile picture anytime</li>
              <li><strong>Deletion:</strong> Request complete account deletion including all personal data</li>
              <li><strong>Data Export:</strong> Request a copy of your data in portable format (ride history, ratings, messages)</li>
              <li><strong>Opt-Out:</strong> Disable notifications or adjust communication preferences</li>
              <li><strong>Complaints:</strong> Report privacy concerns to our support team</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We typically respond to privacy requests within 7 business days.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">9. Students Only and Age Requirements</h3>
            <p className="text-muted-foreground leading-relaxed">
              FAH Ride is exclusively for Chitkara University students. We verify eligibility through @chitkara.edu.in email addresses. We do not knowingly collect data from non-students or individuals under 18 years old. If we discover a violation, the account will be immediately deactivated.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">10. Third-Party Links</h3>
            <p className="text-muted-foreground leading-relaxed">
              Our Service may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">11. Policy Updates</h3>
            <p className="text-muted-foreground leading-relaxed">
              FAH Ride may update this Privacy Policy to reflect platform improvements or legal changes. We will notify users of significant updates via email and in-app notification. Your continued use of FAH Ride following changes means you accept the updated policy.
            </p>
          </section>

          {/* Section 12 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">12. Contact Us for Privacy Concerns</h3>
            <p className="text-muted-foreground leading-relaxed">
              If you have privacy questions, data requests, or want to report a privacy breach, please contact our team:
            </p>
            <div className="bg-secondary/50 p-4 rounded-lg border border-border/50">
              <p className="text-muted-foreground">
                <span className="font-semibold">FAH Ride Privacy Team</span><br />
                Email: <br />
                Response Time: Within 6 hours
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-4 border-t border-border/50 text-center text-sm text-muted-foreground">
            <p>© 2026 FAH Ride. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
