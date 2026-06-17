import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | StoxOptionHub",
  description: "How StoxOptionHub uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="mb-12">
        <p className="text-[11px] text-[#f0b429] uppercase tracking-widest font-semibold mb-3">Legal</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Cookie Policy</h1>
        <p className="text-[14px] text-[#555]">Last updated: June 2026</p>
      </div>

      <div className="space-y-10 text-[14px] text-[#888] leading-relaxed">
        <Section title="1. What Are Cookies">
          <p>
            Cookies are small text files stored on your device when you visit a website. They help the website remember
            information about your session and preferences so you don&rsquo;t need to re-enter them on each visit.
          </p>
        </Section>

        <Section title="2. Cookies We Use">
          <p>We use the following cookies:</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-[13px] border-collapse min-w-[480px]">
              <thead>
                <tr className="border-b border-[#1e1e1e]">
                  <th className="text-left pb-3 text-[#555] font-medium uppercase text-[10px] tracking-wider pr-4">Name</th>
                  <th className="text-left pb-3 text-[#555] font-medium uppercase text-[10px] tracking-wider pr-4">Type</th>
                  <th className="text-left pb-3 text-[#555] font-medium uppercase text-[10px] tracking-wider pr-4">Duration</th>
                  <th className="text-left pb-3 text-[#555] font-medium uppercase text-[10px] tracking-wider">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                <CookieRow
                  name="stoxoptionhub_session"
                  type="Essential"
                  duration="7 days"
                  purpose="Authenticates your session and keeps you logged in securely."
                />
                <CookieRow
                  name="__Host-next-auth.csrf-token"
                  type="Essential"
                  duration="Session"
                  purpose="Protects against cross-site request forgery (CSRF) attacks."
                />
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="3. Essential Cookies">
          <p>
            All cookies used on this Platform are <strong className="text-white">strictly necessary</strong> for
            Platform operation. Without them, you cannot log in or use any authenticated features. These cookies do not
            collect personal data for marketing or analytics purposes.
          </p>
          <p className="mt-3">
            We do <strong className="text-white">not</strong> use:
          </p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Advertising or targeting cookies</li>
            <li>Third-party analytics cookies (e.g., Google Analytics)</li>
            <li>Social media tracking pixels</li>
            <li>Cross-site tracking technologies</li>
          </ul>
        </Section>

        <Section title="4. Managing Cookies">
          <p>
            Because we only use essential cookies, disabling them through your browser settings will prevent you from
            logging in to the Platform. Most browsers allow you to manage cookies through their settings menus.
          </p>
          <p className="mt-3">
            Refer to your browser&rsquo;s help documentation for instructions on managing cookies:
          </p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Chrome: Settings → Privacy and Security → Cookies</li>
            <li>Firefox: Settings → Privacy & Security → Cookies</li>
            <li>Safari: Preferences → Privacy → Manage Website Data</li>
            <li>Edge: Settings → Privacy, Search, and Services → Cookies</li>
          </ul>
        </Section>

        <Section title="5. Changes to This Policy">
          <p>
            If we introduce new cookies or change how we use existing ones, we will update this policy and notify you
            where required by applicable law.
          </p>
        </Section>

        <div className="pt-6 border-t border-[#1e1e1e]">
          <p className="text-[13px] text-[#555]">
            Cookie enquiries:{" "}
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

function CookieRow({
  name,
  type,
  duration,
  purpose,
}: {
  name: string;
  type: string;
  duration: string;
  purpose: string;
}) {
  return (
    <tr>
      <td className="py-3 pr-4 text-white font-mono text-[12px]">{name}</td>
      <td className="py-3 pr-4">
        <span className="px-2 py-0.5 bg-[#22c55e]/10 text-[#22c55e] text-[10px] font-semibold rounded uppercase tracking-wider">
          {type}
        </span>
      </td>
      <td className="py-3 pr-4 text-[#555]">{duration}</td>
      <td className="py-3 text-[#777]">{purpose}</td>
    </tr>
  );
}
