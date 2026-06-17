import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | StoxOptionHub",
  description: "Terms and conditions governing use of the StoxOptionHub platform.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="mb-12">
        <p className="text-[11px] text-[#f0b429] uppercase tracking-widest font-semibold mb-3">Legal</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Terms of Service</h1>
        <p className="text-[14px] text-[#555]">Last updated: June 2026</p>
      </div>

      <div className="space-y-10 text-[14px] text-[#888] leading-relaxed">
        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using StoxOptionHub (&ldquo;the Platform&rdquo;), you agree to be bound by these Terms of Service.
            If you do not agree to these terms, you must not use the Platform.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>
            You must be at least 18 years of age and legally permitted to trade or invest in financial instruments in your
            jurisdiction to use this Platform. By registering, you represent and warrant that you meet these requirements.
          </p>
        </Section>

        <Section title="3. Description of Services">
          <p>
            StoxOptionHub provides a technology platform enabling users to access copy trading tools, educational mentorship
            programs, and investment plan participation. We are a technology provider, not a licensed financial advisor,
            broker, or investment manager.
          </p>
          <p className="mt-3">
            Nothing on this Platform constitutes financial advice. All trading and investment decisions are made solely at
            your own discretion and risk.
          </p>
        </Section>

        <Section title="4. Risk Acknowledgement">
          <p>
            Trading and investing in financial markets involves substantial risk, including the possible loss of some or all
            of your capital. Past performance of any strategy, trader, or investment plan is not indicative of future results.
            You acknowledge that:
          </p>
          <ul className="list-disc ml-5 mt-3 space-y-1">
            <li>Markets can be highly volatile and unpredictable.</li>
            <li>No return on investment is guaranteed.</li>
            <li>You may lose more than your initial deposit in leveraged products.</li>
            <li>You should only invest capital you can afford to lose entirely.</li>
          </ul>
        </Section>

        <Section title="5. Account and Wallet">
          <p>
            You are responsible for maintaining the confidentiality of your account credentials. All wallet deposits and
            withdrawals are processed through cryptocurrency networks and are subject to network fees and confirmation times.
            Once a withdrawal request is submitted and executed on-chain, it cannot be reversed.
          </p>
          <p className="mt-3">
            Wallet balances reflect confirmed, admin-approved deposits only. Pending deposits do not form part of your
            available balance until reviewed and approved by the Platform.
          </p>
        </Section>

        <Section title="6. Prohibited Activities">
          <p>You agree not to:</p>
          <ul className="list-disc ml-5 mt-3 space-y-1">
            <li>Use the Platform for any unlawful purpose or in violation of applicable law.</li>
            <li>Attempt to manipulate account balances, transaction records, or investment returns.</li>
            <li>Engage in fraudulent deposit submissions or falsify transaction hashes.</li>
            <li>Attempt to gain unauthorised access to admin functionality or other users&rsquo; accounts.</li>
            <li>Use the Platform to launder money or finance prohibited activities.</li>
          </ul>
        </Section>

        <Section title="7. Termination">
          <p>
            We reserve the right to suspend or terminate your account at any time, with or without notice, if we reasonably
            believe you have violated these Terms or applicable law. Upon termination, any pending withdrawal requests
            will be reviewed in accordance with applicable regulations.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable law, StoxOptionHub and its affiliates shall not be liable for
            any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform or
            any investment outcomes.
          </p>
        </Section>

        <Section title="9. Amendments">
          <p>
            We may update these Terms at any time. Continued use of the Platform following notification of changes
            constitutes your acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="10. Governing Law">
          <p>
            These Terms shall be governed by and construed in accordance with applicable international commercial law.
            Any disputes shall be resolved through binding arbitration.
          </p>
        </Section>

        <div className="pt-6 border-t border-[#1e1e1e]">
          <p className="text-[13px] text-[#555]">
            For questions about these Terms, please contact us at{" "}
            <a href="mailto:legal@stoxoptionhub.com" className="text-[#f0b429] hover:underline">
              legal@stoxoptionhub.com
            </a>
            .
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
