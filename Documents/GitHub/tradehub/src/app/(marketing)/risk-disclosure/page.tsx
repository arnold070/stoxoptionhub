import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Risk Disclosure | StoxOptionHub",
  description: "Important risk information for users of the StoxOptionHub platform.",
};

export default function RiskDisclosurePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      {/* High-contrast warning banner */}
      <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-5 mb-12">
        <p className="text-[13px] text-[#ef4444] font-semibold uppercase tracking-wider mb-2">
          Important Risk Warning
        </p>
        <p className="text-[13px] text-[#888] leading-relaxed">
          Trading and investing in financial markets involves significant risk and may not be suitable for all investors.
          You may lose some or all of your invested capital. Past performance is not indicative of future results.
          Please read this document carefully before using the Platform.
        </p>
      </div>

      <div className="mb-12">
        <p className="text-[11px] text-[#f0b429] uppercase tracking-widest font-semibold mb-3">Legal</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Risk Disclosure Statement</h1>
        <p className="text-[14px] text-[#555]">Last updated: June 2026</p>
      </div>

      <div className="space-y-10 text-[14px] text-[#888] leading-relaxed">
        <Section title="1. General Market Risk">
          <p>
            Financial markets are subject to rapid and unpredictable price movements driven by economic data, geopolitical
            events, liquidity conditions, and investor sentiment. No trading strategy or investment plan can guarantee
            protection against market losses. The value of any position can fall as well as rise.
          </p>
        </Section>

        <Section title="2. Copy Trading Risk">
          <p>
            Copy trading allows you to replicate the trades of other traders. This does not eliminate risk. The traders
            you follow may suffer losses, and those losses will be reflected in your account. Historical performance of
            a trader is not a guarantee of future returns. Strategies that performed well in past market conditions may
            underperform or fail entirely in different conditions.
          </p>
          <p className="mt-3">
            You remain solely responsible for all trading activity in your account, including any losses that arise from
            copy trading.
          </p>
        </Section>

        <Section title="3. Investment Plan Risk">
          <p>
            Investment plans offered on the Platform are structured participation products. Projected returns are estimates
            based on historical strategy performance and are <strong className="text-white">not guaranteed</strong>.
            Actual results may differ materially from projections. Capital allocated to an investment plan is locked for
            the duration of the plan and may not be withdrawn early.
          </p>
          <p className="mt-3">
            In adverse market conditions, the Platform may be unable to meet projected payout amounts. You could receive
            less than your initial investment.
          </p>
        </Section>

        <Section title="4. Cryptocurrency and Technology Risk">
          <p>
            Deposits and withdrawals on the Platform are conducted via cryptocurrency networks. These networks are subject
            to:
          </p>
          <ul className="list-disc ml-5 mt-3 space-y-1">
            <li>Transaction irreversibility — blockchain transactions cannot be reversed once confirmed.</li>
            <li>Network congestion — confirmation times and fees may vary significantly.</li>
            <li>Smart contract risk — vulnerabilities in underlying protocols may result in loss of funds.</li>
            <li>Exchange rate risk — the fiat-equivalent value of cryptocurrency holdings may fluctuate substantially.</li>
            <li>Wallet address errors — sending funds to an incorrect address results in permanent, unrecoverable loss.</li>
          </ul>
        </Section>

        <Section title="5. Liquidity Risk">
          <p>
            There may be periods during which you are unable to withdraw funds promptly due to market conditions,
            regulatory requirements, or operational constraints. Withdrawal requests are subject to review and processing
            times of up to 24 business hours under normal circumstances.
          </p>
        </Section>

        <Section title="6. Regulatory Risk">
          <p>
            The regulatory landscape for cryptocurrency and online investment platforms is evolving rapidly. Changes in
            applicable law or regulation may affect the availability of Platform services in certain jurisdictions.
            You are solely responsible for ensuring that your use of the Platform is lawful in your jurisdiction.
          </p>
        </Section>

        <Section title="7. Operational and Cybersecurity Risk">
          <p>
            The Platform may be subject to technical outages, cyberattacks, or data breaches. While we implement
            industry-standard security measures, no system is entirely immune. In the event of a security incident,
            you may temporarily be unable to access your account or funds.
          </p>
        </Section>

        <Section title="8. No Financial Advice">
          <p>
            Nothing on the Platform constitutes financial, investment, legal, or tax advice. The Platform is an
            educational and technology tool. You should seek independent professional advice before making any investment
            decision, taking into account your personal financial situation, investment objectives, and risk tolerance.
          </p>
        </Section>

        <Section title="9. Only Risk Capital">
          <p className="text-white font-semibold">
            Only invest capital you can afford to lose entirely.
          </p>
          <p className="mt-2">
            Do not invest funds required for essential living expenses, emergency reserves, or obligations to third parties.
            The potential for loss is real and should be fully understood before participating in any product on this Platform.
          </p>
        </Section>

        <div className="pt-6 border-t border-[#1e1e1e]">
          <p className="text-[13px] text-[#555]">
            By using the Platform, you confirm that you have read and understood this Risk Disclosure Statement.
            Questions:{" "}
            <a href="mailto:compliance@stoxoptionhub.com" className="text-[#f0b429] hover:underline">
              compliance@stoxoptionhub.com
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
