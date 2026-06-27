export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getSiteConfig, updateSiteConfig } from "@/lib/actions/admin";
import { Headphones, ExternalLink, Info } from "lucide-react";


const PROVIDERS = [
  {
    value: "jivo",
    label: "JivoChat",
    description: "Currently active — multi-channel live chat",
    docsUrl: "https://www.jivosite.com",
    placeholder: "e.g. 0TczbF90HW",
    idLabel: "Widget ID",
    hint: "Found in JivoChat → Manage → Channels → Website → your widget code (the ID after /widget/)",
  },
  {
    value: "tawk",
    label: "Tawk.to",
    description: "Free live chat, unlimited agents",
    docsUrl: "https://www.tawk.to",
    placeholder: "e.g. 6789abc/1234def01",
    idLabel: "Property ID / Widget Hash",
    hint: "Found in Tawk.to → Administration → Chat Widget → Direct Chat Link",
  },
  {
    value: "crisp",
    label: "Crisp",
    description: "Modern chat with CRM features",
    docsUrl: "https://crisp.chat",
    placeholder: "e.g. abc12345-def6-7890-ghij-klmnopqrstuv",
    idLabel: "Website ID",
    hint: "Found in Crisp → Settings → Website Integrations",
  },
  {
    value: "intercom",
    label: "Intercom",
    description: "Enterprise messaging platform",
    docsUrl: "https://www.intercom.com",
    placeholder: "e.g. abc12345",
    idLabel: "App ID",
    hint: "Found in Intercom → Settings → Installation → Web",
  },
  {
    value: "custom",
    label: "Custom Embed",
    description: "Paste any widget embed code",
    docsUrl: null,
    placeholder: "",
    idLabel: "Widget ID (optional)",
    hint: "Paste your provider's JavaScript snippet in the code box below",
  },
];

export default async function LiveChatConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const sp = await searchParams;
  const cfg = await getSiteConfig();

  const enabled = cfg.livechat_enabled === "true";
  const provider = cfg.livechat_provider || "tawk";
  const widgetId = cfg.livechat_widget_id || "";
  const customCode = cfg.livechat_custom_code || "";

  const currentProvider = PROVIDERS.find((p) => p.value === provider) ?? PROVIDERS[0];

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <Headphones size={20} className="text-[#f0b429]" />
          <h1 className="text-2xl font-bold text-white">Live Chat</h1>
        </div>
        <p className="text-[13px] text-[#555] ml-[28px]">
          Configure a customer support widget for your public pages.
        </p>
      </div>

      {sp.msg === "ok" && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 text-[13px] font-medium">
          Live chat settings saved successfully.
        </div>
      )}

      {/* Enable / Disable */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-semibold text-white">Enable Live Chat</p>
            <p className="text-[12px] text-[#555] mt-0.5">Show the chat widget on all public marketing pages</p>
          </div>
          <form
            action={async (fd: FormData) => {
              "use server";
              await updateSiteConfig("livechat_enabled", fd.get("enabled") === "true" ? "false" : "true");
              redirect("/admin/live-chat?msg=ok");
            }}
          >
            <input type="hidden" name="enabled" value={String(enabled)} />
            <button
              type="submit"
              className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? "bg-[#22c55e]" : "bg-[#2a2a2a]"}`}
              aria-label={enabled ? "Disable live chat" : "Enable live chat"}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-[26px]" : "translate-x-0.5"}`} />
            </button>
          </form>
        </div>
        {enabled && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#22c55e]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            Widget is live on public pages
          </div>
        )}
      </div>

      {/* Provider selection */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-[#1e1e1e]">
          <h3 className="text-[13px] font-semibold text-white">Chat Provider</h3>
        </div>
        <div className="p-5">
          <form
            action={async (fd: FormData) => {
              "use server";
              await updateSiteConfig("livechat_provider", fd.get("provider") as string);
              redirect("/admin/live-chat?msg=ok");
            }}
          >
            <div className="grid grid-cols-2 gap-3 mb-4">
              {PROVIDERS.map((p) => (
                <label
                  key={p.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    provider === p.value
                      ? "border-[#f0b429]/40 bg-[#f0b429]/5"
                      : "border-[#2a2a2a] hover:border-[#333]"
                  }`}
                >
                  <input
                    type="radio"
                    name="provider"
                    value={p.value}
                    defaultChecked={provider === p.value}
                    className="mt-0.5 accent-[#f0b429]"
                  />
                  <div>
                    <p className="text-[12px] font-semibold text-white">{p.label}</p>
                    <p className="text-[11px] text-[#555]">{p.description}</p>
                  </div>
                </label>
              ))}
            </div>
            <button type="submit" className="px-4 py-2 bg-[#1e1e1e] border border-[#2a2a2a] text-[12px] text-[#aaa] font-medium rounded-lg hover:text-white transition-colors">
              Save Provider
            </button>
          </form>
        </div>
      </div>

      {/* Widget ID */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-[#1e1e1e] flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-white">{currentProvider.idLabel}</h3>
          {currentProvider.docsUrl && (
            <a
              href={currentProvider.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-[#555] hover:text-[#f0b429] transition-colors"
            >
              {currentProvider.label} dashboard <ExternalLink size={10} />
            </a>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-start gap-2 mb-3">
            <Info size={12} className="text-[#555] mt-0.5 shrink-0" />
            <p className="text-[11px] text-[#555]">{currentProvider.hint}</p>
          </div>
          <form
            action={async (fd: FormData) => {
              "use server";
              await updateSiteConfig("livechat_widget_id", (fd.get("widgetId") as string).trim());
              redirect("/admin/live-chat?msg=ok");
            }}
            className="flex gap-2"
          >
            <input
              name="widgetId"
              type="text"
              defaultValue={widgetId}
              placeholder={currentProvider.placeholder || "Widget ID"}
              className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder-[#333] outline-none focus:border-[#f0b429]/40"
            />
            <button type="submit" className="px-4 py-2 bg-[#f0b429] text-black text-[12px] font-bold rounded-lg hover:bg-[#e0a820] transition-colors">
              Save
            </button>
          </form>
        </div>
      </div>

      {/* Custom embed code (for custom provider) */}
      {provider === "custom" && (
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-[#1e1e1e]">
            <h3 className="text-[13px] font-semibold text-white">Custom Embed Code</h3>
          </div>
          <div className="p-5">
            <div className="flex items-start gap-2 mb-3">
              <Info size={12} className="text-[#ef4444] mt-0.5 shrink-0" />
              <p className="text-[11px] text-[#ef4444]">
                Paste raw JavaScript only (without &lt;script&gt; tags). This code will run on all public pages.
              </p>
            </div>
            <form
              action={async (fd: FormData) => {
                "use server";
                await updateSiteConfig("livechat_custom_code", (fd.get("code") as string).trim());
                redirect("/admin/live-chat?msg=ok");
              }}
              className="space-y-3"
            >
              <textarea
                name="code"
                rows={6}
                defaultValue={customCode}
                placeholder="// Your widget JavaScript here..."
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[12px] text-[#ccc] font-mono placeholder-[#333] outline-none focus:border-[#f0b429]/40 resize-y"
              />
              <button type="submit" className="px-4 py-2 bg-[#f0b429] text-black text-[12px] font-bold rounded-lg hover:bg-[#e0a820] transition-colors">
                Save Code
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Status summary */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4">
        <p className="text-[11px] text-[#444] uppercase tracking-wider mb-2">Current Configuration</p>
        <div className="space-y-1 text-[12px]">
          <div className="flex justify-between">
            <span className="text-[#555]">Status</span>
            <span className={enabled ? "text-[#22c55e]" : "text-[#555]"}>{enabled ? "Enabled" : "Disabled"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#555]">Provider</span>
            <span className="text-[#888]">{currentProvider.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#555]">Widget ID</span>
            <span className="text-[#888] font-mono">{widgetId ? widgetId.slice(0, 20) + (widgetId.length > 20 ? "…" : "") : "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
