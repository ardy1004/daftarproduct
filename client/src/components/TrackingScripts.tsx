import { Helmet } from 'react-helmet-async';
import { useSettings } from '@/hooks/useSettings';

export function TrackingScripts() {
  const { data: settings } = useSettings();

  const fbPixelId = settings?.facebook_pixel_id;
  const gaId = settings?.google_analytics_id;

  return (
    <Helmet>
      {/* Facebook Pixel Script */}
      {fbPixelId && (
        <script>
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${fbPixelId}');
            fbq('track', 'PageView');
          `}
        </script>
      )}
      {fbPixelId && (
        <noscript>
          {`
            <img height="1" width="1" style="display:none"
                 src="https://www.facebook.com/tr?id=${fbPixelId}&ev=PageView&noscript=1"/>
          `}
        </noscript>
      )}

      {/* Google Analytics Script */}
      {gaId && (
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}></script>
      )}
      {gaId && (
        <script>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `}
        </script>
      )}
    </Helmet>
  );
}
