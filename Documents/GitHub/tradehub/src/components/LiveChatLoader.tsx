import { getPublicSiteConfig } from "@/lib/actions/admin";
import { LiveChatWidget } from "./LiveChatWidget";

export default async function LiveChatLoader() {
  const cfg = await getPublicSiteConfig([
    "livechat_enabled",
    "livechat_provider",
    "livechat_widget_id",
    "livechat_custom_code",
  ]);

  // Disabled only when explicitly set to "false"
  if (cfg.livechat_enabled === "false") return null;

  const provider = (cfg.livechat_provider || "jivo").trim();
  const widgetId = (cfg.livechat_widget_id || "0TczbF90HW").trim();
  const customCode = (cfg.livechat_custom_code ?? "").trim();

  if (provider !== "custom" && !widgetId) return null;
  if (provider === "custom" && !customCode) return null;

  return (
    <LiveChatWidget
      provider={provider}
      widgetId={widgetId}
      customCode={customCode}
    />
  );
}
