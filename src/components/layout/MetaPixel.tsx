import Script from "next/script";
import { META_PIXEL_ID, metaPixelEnabled } from "@/lib/site/analytics";

/**
 * The Meta pixel.
 *
 * `afterInteractive` rather than `beforeInteractive`: analytics is never
 * worth delaying the page for. The hero film and the product images are
 * already competing for the connection, and a tracking script that loads a
 * moment later records exactly the same visit.
 *
 * The <noscript> beacon is Meta's own fallback for visitors with JavaScript
 * off. It is kept because it costs one element, though in practice almost
 * nobody who blocks scripts will let the image through either.
 *
 * WHAT THIS DOES AND DOES NOT SEE.
 *
 * It fires PageView on this site. It cannot see a purchase: checkout happens
 * on Shopify's own domain, so the moment a customer leaves to pay, this
 * pixel stops observing. Conversion tracking needs the same pixel installed
 * inside Shopify as well — otherwise Meta will show traffic and no sales,
 * and the campaign will look like it is failing when it is not.
 *
 * Mounted in the site layout, so it does not load on routes outside it.
 */
export default function MetaPixel() {
  if (!metaPixelEnabled) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>

      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
