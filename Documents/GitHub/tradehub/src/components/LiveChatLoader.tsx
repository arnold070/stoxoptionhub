import Script from "next/script";
import { getPublicSiteConfig } from "@/lib/actions/admin";

const DEFAULT_PROVIDER = "jivo";
const DEFAULT_WIDGET_ID = "0TczbF90HW";

export default async function LiveChatLoader() {
  let cfg: Record<string, string> = {};
  try {
    cfg = await getPublicSiteConfig([
      "livechat_enabled",
      "livechat_provider",
      "livechat_widget_id",
      "livechat_custom_code",
    ]);
  } catch {
    // DB unavailable — fall through to defaults
  }

  if (cfg.livechat_enabled === "false") return null;

  const provider = (cfg.livechat_provider || DEFAULT_PROVIDER).trim();
  const widgetId = (cfg.livechat_widget_id || DEFAULT_WIDGET_ID).trim();
  const customCode = (cfg.livechat_custom_code ?? "").trim();

  if (provider === "jivo" && widgetId) {
    return <Script src={`//code.jivosite.com/widget/${widgetId}`} strategy="lazyOnload" />;
  }

  if (provider === "tawk" && widgetId) {
    const parts = widgetId.split("/");
    const propertyId = parts[0];
    const widgetHash = parts[1] ?? "default";
    return (
      <Script
        id="tawkto-widget"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `var Tawk_API=Tawk_API||{},Tawk_LoadStart=new Date();(function(){var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];s1.async=true;s1.src="https://embed.tawk.to/${propertyId}/${widgetHash}";s1.charset="UTF-8";s1.setAttribute("crossorigin","*");s0.parentNode.insertBefore(s1,s0);})();`,
        }}
      />
    );
  }

  if (provider === "crisp" && widgetId) {
    return (
      <>
        <Script
          id="crisp-init"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `window.$crisp=[];window.CRISP_WEBSITE_ID="${widgetId}";`,
          }}
        />
        <Script src="https://client.crisp.chat/l.js" strategy="lazyOnload" />
      </>
    );
  }

  if (provider === "intercom" && widgetId) {
    return (
      <Script
        id="intercom-widget"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `window.intercomSettings={api_base:"https://api-iam.intercom.io",app_id:"${widgetId}"};(function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic("reattach_activator");ic("update",w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement("script");s.type="text/javascript";s.async=true;s.src="https://widget.intercom.io/widget/${widgetId}";var x=d.getElementsByTagName("script")[0];x.parentNode.insertBefore(s,x);};if(document.readyState==="complete"){l();}else if(w.attachEvent){w.attachEvent("onload",l);}else{w.addEventListener("load",l,false);}}})();`,
        }}
      />
    );
  }

  if (provider === "custom" && customCode) {
    return (
      <Script
        id="custom-chat-widget"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{ __html: customCode }}
      />
    );
  }

  return null;
}
