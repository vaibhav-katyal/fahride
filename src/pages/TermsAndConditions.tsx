import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsAndConditions = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-4 max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Terms & Conditions</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8 space-y-6">
          {/* Last Updated */}
          <div className="text-sm text-slate-500 border-l-4 border-blue-500 pl-4">
            Last updated: April 5, 2026
          </div>

          {/* Introduction */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900">Welcome to FAH Ride(Find-and-Hop)</h2>
            <p className="text-slate-700 leading-relaxed">
              FAH Ride is an exclusive carpooling platform designed for Chitkara University students to safely share rides, reduce commuting costs, and build community. By accessing or using FAH Ride, you agree to be bound by these Terms. If you do not agree to these Terms, you may not use our Service.
            </p>
          </section>

          {/* Section 1 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">1. Eligibility and Account Access</h3>
            <p className="text-slate-700 leading-relaxed">
              FAH Ride is exclusively available to active Chitkara University students. To access the platform, you must:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-2">
              <li>Be enrolled as a current student at Chitkara University</li>
              <li>Register using your official Chitkara University email address (@chitkara.edu.in)</li>
              <li>Provide accurate personal information including your name, phone, branch, and academic year</li>
              <li>Verify your OTP through email during registration</li>
              <li>Maintain an active, verified account in good standing</li>
              <li>Agree to provide truthful information throughout your membership</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">2. Ride Posting and Booking</h3>
            <p className="text-slate-700 leading-relaxed">
              When posting a ride as a driver or requesting seats as a passenger, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-2">
              <li><strong>Drivers:</strong> Provide accurate departure location, destination, date, time, seat availability, vehicle details (model, color, license plate), and price per seat</li>
              <li><strong>Drivers:</strong> Ensure your vehicle is roadworthy, properly insured, and complies with all traffic regulations</li>
              <li><strong>Drivers:</strong> Update ride status and communicate promptly with passengers through the app</li>
              <li><strong>Passengers:</strong> Request only the number of seats you actually need</li>
              <li><strong>Passengers:</strong> Show up on time or cancel well in advance if plans change</li>
              <li><strong>Both:</strong> Confirm payment method and complete transactions fairly (cash, digital payment as agreed)</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">3. Safety and Conduct Standards</h3>
            <p className="text-slate-700 leading-relaxed">
              To maintain a safe and respectful community, all users agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-2">
              <li>Drive defensively and follow all traffic laws, speed limits, and safety regulations</li>
              <li>Treat all other users with respect, professionalism, and courtesy</li>
              <li>Not engage in harassment, discrimination, or any form of abusive behavior</li>
              <li>Not use the platform while under the influence of drugs, alcohol, or impaired judgment</li>
              <li>Not share explicit, offensive, or inappropriate content through in-app chat</li>
              <li>Respect passenger/driver privacy and personal space during rides</li>
              <li>Report safety concerns or policy violations through the feedback system immediately</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">4. Ratings, Reviews, and Feedback</h3>
            <p className="text-slate-700 leading-relaxed">
              FAH Ride maintains a community trust system through user ratings and feedback:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-2">
              <li>Leave honest 5-star ratings and written feedback after each completed ride</li>
              <li>Rate based on driver behavior, vehicle condition, punctuality, and passenger courtesy</li>
              <li>Users with consistently low ratings may face account suspension or termination</li>
              <li>Report safety concerns, abuse, or policy violations through the report function</li>
              <li>All reports are reviewed by our support team and handled confidentially</li>
              <li>False reports or malicious reviews constitute account violation and may result in suspension</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">5. Rides and Routes</h3>
            <p className="text-slate-700 leading-relaxed">
              FAH Ride facilitates connections between drivers and passengers. Users understand that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-2">
              <li>FAH Ride does not operate rides directly - all rides are user-organized</li>
              <li>Drivers are solely responsible for vehicle maintenance, insurance, and regulatory compliance</li>
              <li>Passengers are advised to verify driver identity and ratings before confirming rides</li>
              <li>Real-time location tracking is available during active rides for safety purposes only</li>
              <li>FAH Ride is not responsible for accidents, damages, or incidents during rides</li>
              <li>Users assume all risks associated with carpooling and shared transportation</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">6. Communication and Contact Information</h3>
            <p className="text-slate-700 leading-relaxed">
              The in-app chat feature is designed for ride coordination only. Users agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-2">
              <li>Use the chat feature only for ride-related communication</li>
              <li>Not solicit personal information, social media accounts, or phone numbers before rides</li>
              <li>Report inappropriate or harassing messages to our support team</li>
              <li>Understand that all communications are logged and may be reviewed for safety</li>
              <li>Agree that FAH Ride can share ride details and chat summaries with support for dispute resolution</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">7. Prohibited Activities</h3>
            <p className="text-slate-700 leading-relaxed">
              The following activities are strictly prohibited:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-2">
              <li>Creating fake accounts or impersonating other users</li>
              <li>Posting rides or making requests for non-carpooling purposes</li>
              <li>Using FAH Ride for commercial taxi or transport services</li>
              <li>Discriminating against users based on religion, caste, gender, or other protected characteristics</li>
              <li>Posting false or misleading ride information</li>
              <li>Attempting to bypass payment or conduct unrelated transactions through the platform</li>
              <li>Sharing rider personal details without consent</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">8. Account Suspension and Termination</h3>
            <p className="text-slate-700 leading-relaxed">
              FAH Ride may suspend or permanently terminate your account if:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-2">
              <li>You engage in unsafe, harassing, or discriminatory behavior</li>
              <li>You violate these Terms or post false information</li>
              <li>Your rating drops below 3.0 stars consistently</li>
              <li>You attend a different institution or are no longer a Chitkara University student</li>
              <li>You receive multiple safety/abuse reports confirmed by our team</li>
              <li>You engage in illegal activities or violate local transportation laws</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-3">
              Upon termination, your access to all rides, messages, and account data will be permanently removed.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">9. Limitation of Liability</h3>
            <p className="text-slate-700 leading-relaxed">
              TO THE FULLEST EXTENT PERMITTED BY LAW, FAH RIDE IS PROVIDED "AS IS" WITHOUT WARRANTIES. FAH RIDE SHALL NOT BE LIABLE FOR ACCIDENTS, INJURIES, PROPERTY DAMAGE, OR LOSSES DURING RIDES. USERS ASSUME ALL RISKS ASSOCIATED WITH CARPOOLING. FAH RIDE IS NOT RESPONSIBLE FOR SERVICE INTERRUPTIONS, DELAYED NOTIFICATIONS, OR TECHNICAL ERRORS THAT PREVENT RIDE COORDINATION.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">10. Dispute Resolution</h3>
            <p className="text-slate-700 leading-relaxed">
              For disputes between users (driver-passenger disagreements, payment issues, cancellations), FAH Ride support will:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-2">
              <li>Review ride details, chat history, and both user accounts</li>
              <li>Make fair, impartial decisions based on available evidence</li>
              <li>Attempt to resolve within 48 hours for active disputes</li>
              <li>Assign financial compensation or account remedies if warranted</li>
              <li>Maintain confidentiality of all dispute information</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-3">
              Decisions made by FAH Ride support are final and binding on the platform.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">11. Changes to Terms</h3>
            <p className="text-slate-700 leading-relaxed">
              FAH Ride may update these Terms at any time to reflect platform improvements, legal changes, or policy updates. Significant changes will be communicated via email and in-app notifications. Your continued use of FAH Ride following any changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          {/* Section 12 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">12. Acknowledgment</h3>
            <p className="text-slate-700 leading-relaxed">
              By registering and using FAH Ride, you acknowledge that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-2">
              <li>You have read, understood, and agree to these Terms and Conditions</li>
              <li>You accept all risks associated with carpooling and shared transportation</li>
              <li>You will comply with all local, state, and national transportation laws</li>
              <li>You are responsible for your own safety and the safety of those around you</li>
              <li>You understand FAH Ride is a peer-to-peer community platform, not a transportation company</li>
            </ul>
          </section>

          {/* Section 13 */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">13. Contact and Support</h3>
            <p className="text-slate-700 leading-relaxed">
              For questions about these Terms, policy violations, or to report safety concerns, contact our support team:
            </p>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-slate-700">
                <span className="font-semibold">FAH Ride Support</span><br />
                Email: <br />
                Response Time: Within 6 hours for urgent safety matters
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 text-center text-sm text-slate-500">
            <p>© 2026 FAH Ride. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
