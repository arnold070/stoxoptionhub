import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | StoxOptionHub",
  description: "How StoxOptionHub collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="mb-12">
        <p className="text-[11px] text-[#f0b429] uppercase tracking-widest font-semibold mb-3">Legal</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Privacy Policy</h1>
        <p className="text-[14px] text-[#555]">Last updated: June 2026</p>
      </div>

      <div className="space-y-10 text-[14px] text-[#888] leading-relaxed">
        <Section title="1. Information We Collect">
          <p>We collect information you provide directly to us, including:</p>
          <ul className="list-disc ml-5 mt-3 space-y-1">
            <li><strong className="text-white">Account data:</strong> name, email address, and password (hashed).</li>
            <li><strong className="text-white">Financial data:</strong> deposit amounts, cryptocurrency transaction hashes, and withdrawal addresses you submit.</li>
            <li><strong className="text-white">Usage data:</strong> pages visited, features used, and timestamps of platform interactions.</li>
            <li><strong className="text-white">Device data:</strong> IP address, browser type, and operating system for security and fraud prevention.</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul className="list-disc ml-5 mt-3 space-y-1">
            <li>Operate, maintain, and improve the Platform.</li>
            <li>Process deposits, withdrawals, and investment transactions.</li>
            <li>Send transactional notifications (deposit confirmations, investment maturity alerts).</li>
            <li>Detect and prevent fraudulent activity and unauthorised access.</li>
            <li>Comply with applicable legal and regulatory obligations.</li>
            <li>Respond to your enquiries and support requests.</li>
          </ul>
          <p className="mt-3">
            We do not sell, rent, or share your personal data with third parties for marketing purposes.
          </p>
        </Section>

        <Section title="3. Data Retention">
          <p>
            We retain your account and transaction data for as long as your account is active and for a period thereafter
            as required by applicable law. Financial transaction records are retained for a minimum of 5 years in
            accordance with anti-money-laundering regulations.
          </p>
        </Section>

        <Section title="4. Data Security">
          <p>
            We implement industry-standard security measures including encryption in transit (TLS), hashed password
            storage, and access controls limiting administrative access to authorised personnel. However, no method of
            transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </Section>

        <Section title="5. Cookies">
          <p>
            We use session cookies to authenticate your account and remember your preferences. No third-party advertising
            cookies are used. See our{" "}
            <a href="/cookies" className="text-[#f0b429] hover:underline">Cookie Policy</a> for details.
          </p>
        </Section>

        <Section title="6. Third-Party Services">
          <p>
            We may use third-party services for email delivery (e.g., Resend) and infrastructure hosting. These providers
            process data on our behalf under data processing agreements and are prohibited from using your data for their
            own purposes.
          </p>
        </Section>

        <Section title="7. Your Rights">
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc ml-5 mt-3 space-y-1">
            <li>Access a copy of the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your account and associated data (subject to legal retention requirements).</li>
            <li>Object to or restrict certain processing activities.</li>
            <li>Lodge a complaint with your local data protection authority.</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:privacy@stoxoptionhub.com" className="text-[#f0b429] hover:underline">
              privacy@stoxoptionhub.com
            </a>
            .
          </p>
        </Section>

        <Section title="8. International Transfers">
          <p>
            Your data may be processed in countries outside your jurisdiction. We ensure appropriate safeguards are in
            place, including standard contractual clauses where required by applicable law.
          </p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes via email or a
            prominent notice on the Platform before the changes take effect.
          </p>
        </Section>

        <div className="pt-6 border-t border-[#1e1e1e]">
          <p className="text-[13px] text-[#555]">
            Privacy enquiries:{" "}
            <a href="mailto:privacy@stoxoptionhub.com" className="text-[#f0b429] hover:underline">
              privacy@stoxoptionhub.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[16px] font-semibold text-white mb-3">{title}</h2>
      {children}
    </section>
  );
}
