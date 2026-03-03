# Boober SEO Configuration

## Meta Tags

### Default Meta Tags
Add to `index.html` or layout component:

```html
<!-- Primary Meta Tags -->
<title>Boober - Jozi Taxi Network | Hail Minibus Taxis in Johannesburg</title>
<meta name="title" content="Boober - Jozi Taxi Network | Hail Minibus Taxis in Johannesburg">
<meta name="description" content="Hail minibus taxis in Johannesburg with Boober. Real-time tracking, cashless payments, and safe rides. Download the app for passengers and drivers.">
<meta name="keywords" content="Johannesburg taxi, minibus taxi, Jozi taxi, taxi app South Africa, taxi hailing, ride sharing, taxi rank, taxi marshal, Gauteng transport, affordable taxi">
<meta name="author" content="Boober">
<meta name="robots" content="index, follow">
<meta name="language" content="English">
<meta name="revisit-after" content="7 days">
<meta name="geo.region" content="ZA-GP">
<meta name="geo.placename" content="Johannesburg">

<!-- App Store Meta Tags -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Boober">
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#E63946">

<!-- Canonical URL -->
<link rel="canonical" href="https://boober.co.za/">

<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/boober-icon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

### Open Graph Tags
```html
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://boober.co.za/">
<meta property="og:title" content="Boober - Jozi Taxi Network | Hail Minibus Taxis in Johannesburg">
<meta property="og:description" content="Hail minibus taxis in Johannesburg with Boober. Real-time tracking, cashless payments, and safe rides. The future of township taxi transport is here.">
<meta property="og:image" content="https://boober.co.za/images/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="Boober">
<meta property="og:locale" content="en_ZA">
<meta property="og:locale:alternate" content="en_ZA">
```

### Twitter Card Tags
```html
<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="https://boober.co.za/">
<meta name="twitter:title" content="Boober - Jozi Taxi Network">
<meta name="twitter:description" content="Hail minibus taxis in Johannesburg with Boober. Real-time tracking, cashless payments, and safe rides.">
<meta name="twitter:image" content="https://boober.co.za/images/twitter-card.png">
<meta name="twitter:site" content="@boobertaxi">
<meta name="twitter:creator" content="@boobertaxi">
```

### Structured Data (JSON-LD)
Add to homepage:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  "name": "Boober",
  "alternateName": "Boober - Jozi Taxi Network",
  "description": "Hail minibus taxis in Johannesburg with Boober. Real-time tracking, cashless payments, and safe rides.",
  "operatingSystem": "Web Browser (PWA)",
  "applicationCategory": "NavigationApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "ZAR"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "ratingCount": "1000"
  },
  "author": {
    "@type": "Organization",
    "name": "Boober",
    "url": "https://boober.co.za"
  },
  "downloadUrl": "https://boober.co.za/download",
  "screenshot": "https://boober.co.za/images/screenshot-1.png",
  "softwareVersion": "1.0.0"
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Boober",
  "alternateName": "Boober Taxi Network",
  "url": "https://boober.co.za",
  "logo": "https://boober.co.za/boober-icon.svg",
  "description": "South Africa's premier minibus taxi hailing app connecting passengers with drivers in Johannesburg.",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Johannesburg",
    "addressRegion": "Gauteng",
    "addressCountry": "ZA"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+27-11-XXX-XXXX",
    "contactType": "customer service",
    "email": "hello@boober.co.za",
    "areaServed": "ZA",
    "availableLanguage": ["English", "Zulu", "Sotho"]
  },
  "sameAs": [
    "https://twitter.com/boobertaxi",
    "https://facebook.com/boobertaxi",
    "https://instagram.com/boobertaxi",
    "https://linkedin.com/company/boober"
  ]
}
</script>
```

## Page-Specific SEO

### Driver Landing Page
```html
<title>Become a Boober Driver | Join Johannesburg's Taxi Network</title>
<meta name="description" content="Join Boober as a taxi driver. Increase your earnings, get more passengers, and manage your routes efficiently. Sign up today for Johannesburg taxi drivers.">
<meta property="og:title" content="Become a Boober Driver | Join Johannesburg's Taxi Network">
<meta property="og:description" content="Increase your earnings with Boober. Get matched with passengers heading your way.">
```

### Passenger Landing Page
```html
<title>Hail a Taxi in Johannesburg | Boober - Safe & Affordable Rides</title>
<meta name="description" content="Book your minibus taxi ride in Johannesburg with Boober. Track your ride in real-time, pay cash or card, and travel safely across Gauteng.">
<meta property="og:title" content="Hail a Taxi in Johannesburg | Boober">
<meta property="og:description" content="Book minibus taxis in seconds. Real-time tracking, safe rides, affordable fares.">
```

### Safety Page
```html
<title>Safety Features | Boober Taxi App Johannesburg</title>
<meta name="description" content="Learn about Boober's safety features including real-time tracking, emergency assistance, driver verification, and community reporting. Your safety is our priority.">
```

## Keywords Strategy

### Primary Keywords
- Johannesburg taxi app
- Minibus taxi Johannesburg
- Taxi hailing app South Africa
- Jozi taxi
- Gauteng taxi booking

### Secondary Keywords
- Affordable taxi Johannesburg
- Township taxi app
- Taxi rank app
- Taxi marshal app
- Cashless taxi payment
- Safe taxi South Africa

### Long-tail Keywords
- How to hail a taxi in Johannesburg
- Best taxi app for Johannesburg
- Minibus taxi tracking app
- Taxi from Johannesburg to Soweto
- Affordable taxi from airport to Sandton

## Technical SEO Checklist

- [ ] Implement HTTPS (SSL certificate)
- [ ] Enable GZIP compression
- [ ] Optimise images (WebP format, lazy loading)
- [ ] Implement caching headers
- [ ] Ensure mobile-first responsive design
- [ ] Minify CSS and JavaScript
- [ ] Implement critical CSS
- [ ] Add breadcrumb navigation
- [ ] Create XML sitemap
- [ ] Add robots.txt
- [ ] Implement canonical URLs
- [ ] Add alt text to all images
- [ ] Ensure fast page load (<3 seconds)
- [ ] Implement PWA features
- [ ] Add structured data markup

## IndexNow Configuration

Submit sitemap to IndexNow for instant indexing:

```bash
# Generate IndexNow key
KEY=$(openssl rand -hex 16)

# Save key file
echo $KEY > /public/$KEY.txt

# Submit to search engines
curl "https://www.bing.com/indexnow?url=https://boober.co.za/&key=$KEY"
curl "https://api.indexnow.org/indexnow?url=https://boober.co.za/&key=$KEY"
curl "https://search.seznam.cz/indexnow?url=https://boober.co.za/&key=$KEY"
curl "https://yandex.com/search/xml?sitemap=https://boober.co.za/sitemap.xml"
```

## Google Search Console Setup

1. Go to https://search.google.com/search-console
2. Add property: boober.co.za
3. Verify ownership via DNS or HTML file
4. Submit sitemap: https://boober.co.za/sitemap.xml
5. Request indexing for key pages
6. Monitor for errors and coverage issues

## Bing Webmaster Setup

1. Go to https://www.bing.com/webmasters
2. Add site: boober.co.za
3. Verify ownership
4. Submit sitemap
5. Use IndexNow for instant indexing

## Performance Targets

- Core Web Vitals (Pass):
  - LCP (Largest Contentful Paint): <2.5s
  - FID (First Input Delay): <100ms
  - CLS (Cumulative Layout Shift): <0.1
- Lighthouse Score: >90
- Mobile PageSpeed: >80
- Desktop PageSpeed: >90
