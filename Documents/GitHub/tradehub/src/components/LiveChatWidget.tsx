"use client";

import { useEffect } from "react";

interface LiveChatWidgetProps {
  provider: string;
  widgetId: string;
  customCode?: string;
}

export function LiveChatWidget({ provider, widgetId, customCode }: LiveChatWidgetProps) {
  useEffect(() => {
    const SCRIPT_ID = "lc-widget-script";
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.type = "text/javascript";

    if (provider === "tawk" && widgetId) {
      script.innerHTML = `var Tawk_API=Tawk_API||{},Tawk_LoadStart=new Date();(function(){var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];s1.async=true;s1.src="https://embed.tawk.to/${widgetId}/default";s1.charset="UTF-8";s1.setAttribute("crossorigin","*");s0.parentNode.insertBefore(s1,s0)})();`;
    } else if (provider === "crisp" && widgetId) {
      script.innerHTML = `window.$crisp=[];window.CRISP_WEBSITE_ID="${widgetId}";(function(){var d=document;var s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s)})();`;
    } else if (provider === "intercom" && widgetId) {
      script.innerHTML = `window.intercomSettings={api_base:"https://api-iam.intercom.io",app_id:"${widgetId}"};(function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic("reattach_activator");ic("update",w.intercomSettings)}else{var d=document;var i=function(){i.c(arguments)};i.q=[];i.c=function(args){i.q.push(args)};w.Intercom=i;var l=function(){var s=d.createElement("script");s.type="text/javascript";s.async=true;s.src="https://widget.intercom.io/widget/${widgetId}";var x=d.getElementsByTagName("script")[0];x.parentNode.insertBefore(s,x)};l()}})();`;
    } else if (provider === "custom" && customCode) {
      script.innerHTML = customCode;
    } else {
      return;
    }

    document.head.appendChild(script);

    return () => {
      document.getElementById(SCRIPT_ID)?.remove();
    };
  }, [provider, widgetId, customCode]);

  return null;
}
