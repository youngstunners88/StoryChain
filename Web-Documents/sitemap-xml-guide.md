# sitemap.xml Guide

## What is a Sitemap?

A sitemap is an XML file that lists all the important URLs on your website, helping search engines discover and index your content more efficiently. It acts as a roadmap for search engine crawlers.

---

## File Location

- Place at root: `https://www.yourdomain.com/sitemap.xml`
- Or specify location in robots.txt
- Or submit directly via search engine webmaster tools

---

## XML Structure

### Basic Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
   <url>
      <loc>https://www.yourdomain.com/</loc>
      <lastmod>2024-01-15</lastmod>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
   </url>
</urlset>
```

---

## Required & Optional Tags

### Required Tags

| Tag | Description |
|-----|-------------|
| `<urlset>` | Container for all URLs |
| `<url>` | Container for each URL entry |
| `<loc>` | The URL (must include protocol, e.g., https://) |

### Optional Tags

| Tag | Description | Values |
|-----|-------------|--------|
| `<lastmod>` | Last modification date | YYYY-MM-DD format |
| `<changefreq>` | How often the page changes | always, hourly, daily, weekly, monthly, yearly, never |
| `<priority>` | Importance relative to other pages | 0.0 to 1.0 |

---

## Complete Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
   <!-- Homepage -->
   <url>
      <loc>https://www.example.com/</loc>
      <lastmod>2024-01-15</lastmod>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
   </url>
   
   <!-- About Page -->
   <url>
      <loc>https://www.example.com/about/</loc>
      <lastmod>2024-01-10</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
   </url>
   
   <!-- Products Page -->
   <url>
      <loc>https://www.example.com/products/</loc>
      <lastmod>2024-01-14</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.9</priority>
   </url>
   
   <!-- Blog Section -->
   <url>
      <loc>https://www.example.com/blog/</loc>
      <lastmod>2024-01-15</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.7</priority>
   </url>
   
   <!-- Contact Page -->
   <url>
      <loc>https://www.example.com/contact/</loc>
      <lastmod>2024-01-01</lastmod>
      <changefreq>yearly</changefreq>
      <priority>0.5</priority>
   </url>
</urlset>
```

---

## Sitemap Index File (for Multiple Sitemaps)

Use when you have more than 50,000 URLs or file size exceeds 50MB:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
   <sitemap>
      <loc>https://www.example.com/sitemap-pages.xml</loc>
      <lastmod>2024-01-15</lastmod>
   </sitemap>
   <sitemap>
      <loc>https://www.example.com/sitemap-products.xml</loc>
      <lastmod>2024-01-14</lastmod>
   </sitemap>
   <sitemap>
      <loc>https://www.example.com/sitemap-blog.xml</loc>
      <lastmod>2024-01-15</lastmod>
   </sitemap>
</sitemapindex>
```

---

## Specialised Sitemaps

### Image Sitemap

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
   <url>
      <loc>https://www.example.com/gallery.html</loc>
      <image:image>
         <image:loc>https://www.example.com/images/photo1.jpg</image:loc>
         <image:caption>Beautiful sunset</image:caption>
         <image:title>Sunset Photo</image:title>
      </image:image>
      <image:image>
         <image:loc>https://www.example.com/images/photo2.jpg</image:loc>
      </image:image>
   </url>
</urlset>
```

### Video Sitemap

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
   <url>
      <loc>https://www.example.com/video-page.html</loc>
      <video:video>
         <video:thumbnail_loc>https://www.example.com/thumbnail.jpg</video:thumbnail_loc>
         <video:title>Product Demo Video</video:title>
         <video:description>Learn how to use our product</video:description>
         <video:content_loc>https://www.example.com/video.mp4</video:content_loc>
         <video:duration>600</video:duration>
      </video:video>
   </url>
</urlset>
```

### News Sitemap

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
   <url>
      <loc>https://www.example.com/news/article.html</loc>
      <news:news>
         <news:publication>
            <news:name>Example News</news:name>
            <news:language>en</news:language>
         </news:publication>
         <news:publication_date>2024-01-15</news:publication_date>
         <news:title>Breaking News Story</news:title>
      </news:news>
   </url>
</urlset>
```

---

## Priority Guidelines

| Priority | Page Type |
|----------|-----------|
| 1.0 | Homepage |
| 0.8-0.9 | Key landing pages, main products |
| 0.6-0.7 | Blog posts, secondary pages |
| 0.4-0.5 | Contact, about, FAQ |
| 0.0-0.3 | Old archives, less important content |

---

## Change Frequency Values

| Value | Meaning |
|-------|---------|
| `always` | Every time the page is accessed |
| `hourly` | Every hour |
| `daily` | Every day |
| `weekly` | Every week |
| `monthly` | Every month |
| `yearly` | Once a year |
| `never` | Never changes (archived content) |

*Note: These are hints to crawlers, not guarantees of crawl frequency.*

---

## Best Practices

1. **Keep it under 50MB** (uncompressed) or split into multiple sitemaps
2. **Limit to 50,000 URLs** per sitemap file
3. **Use canonical URLs** - Only include the canonical version
4. **Encode special characters** in URLs:
   - `&` → `&amp;`
   - `'` → `&apos;`
   - `"` → `&quot;`
   - `>` → `&gt;`
   - `<` → `&lt;`
5. **Use gzip compression** for large sitemaps
6. **Update regularly** when content changes
7. **Include only indexable URLs** - No redirects, 404s, or blocked pages
8. **Use absolute URLs** - Include full domain and protocol

---

## Submission Methods

### 1. robots.txt
```
Sitemap: https://www.example.com/sitemap.xml
```

### 2. Google Search Console
1. Go to Google Search Console
2. Select your property
3. Navigate to "Sitemaps"
4. Enter sitemap URL and submit

### 3. Bing Webmaster Tools
1. Go to Bing Webmaster Tools
2. Select your site
3. Navigate to "Sitemaps"
4. Submit your sitemap URL

### 4. Ping Search Engines
```
# Google
https://www.google.com/ping?sitemap=https://www.example.com/sitemap.xml

# Bing
https://www.bing.com/ping?sitemap=https://www.example.com/sitemap.xml
```

---

## Common Errors to Avoid

| Error | Solution |
|-------|----------|
| URLs not under your domain | Only include URLs you own |
| Including noindex pages | Remove pages with noindex |
| Broken URLs | Test all URLs return 200 OK |
| Exceeding size limits | Split into multiple sitemaps |
| Missing XML declaration | Always include `<?xml version="1.0"?>` |
| Incorrect date format | Use YYYY-MM-DD |
| Relative URLs | Always use absolute URLs |

---

## Validation Tools

- **Google Search Console** - Built-in sitemap testing
- **XML Sitemap Validator** - https://www.xml-sitemaps.com/validate-xml-sitemap.html
- **W3C Validator** - https://validator.w3.org/

---

## Content Management Systems

| CMS | Sitemap Plugin/Feature |
|-----|----------------------|
| WordPress | Yoast SEO, Google XML Sitemaps |
| Shopify | Auto-generated at `/sitemap.xml` |
| Magento | Built-in sitemap generation |
| Wix | Auto-generated |
| Squarespace | Auto-generated at `/sitemap.xml` |

---

## Quick Reference

```
File Limit: 50MB or 50,000 URLs
Format: XML (UTF-8 encoding)
Location: Domain root
Namespace: http://www.sitemaps.org/schemas/sitemap/0.9
Compression: gzip allowed (.xml.gz)
```

---

*Document generated for web development best practices*
