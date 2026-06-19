import { getPublicSiteConfig } from "@/lib/actions/admin";
import { LiveChatWidget } from "./LiveChatWidget";

export default async function LiveChatLoader() {
  const cfg = await getPublicSiteConfig([
    "livechat_enabled",
    "livechat_provider",
    "livechat_widget_id",
    "livechat_custom_code",
  ]);

  if (cfg.livechat_enabled !== "true") return null;

  const provider = cfg.livechat_provider ?? "";
  const widgetId = (cfg.livechat_widget_id ?? "").trim();
  const customCode = (cfg.livechat_custom_code ?? "").trim();

  if (!provider) return null;
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
