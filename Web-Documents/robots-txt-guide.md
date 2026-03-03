# robots.txt Guide

## What is robots.txt?

The `robots.txt` file is a text file that tells web robots (typically search engine robots) which pages on your site to crawl and which to ignore. It's part of the Robots Exclusion Protocol (REP).

---

## File Location

- Must be placed at the **root of your domain**
- URL: `https://www.yourdomain.com/robots.txt`
- Must be accessible via HTTP/HTTPS

---

## Basic Syntax

```
User-agent: [robot-name]
Disallow: [URL-path]
Allow: [URL-path]
```

---

## Common Directives

| Directive | Description |
|-----------|-------------|
| `User-agent` | Specifies which robot the rule applies to |
| `Disallow` | URLs the robot should NOT crawl |
| `Allow` | URLs the robot CAN crawl (overrides Disallow) |
| `Sitemap` | Location of your XML sitemap |
| `Crawl-delay` | Seconds to wait between requests |

---

## Example robots.txt Files

### 1. Allow All Robots (Default)
```
User-agent: *
Allow: /
```

### 2. Block All Robots
```
User-agent: *
Disallow: /
```

### 3. Block Specific Directory
```
User-agent: *
Disallow: /admin/
Disallow: /private/
Disallow: /temp/
```

### 4. Block Specific Robot
```
User-agent: Googlebot
Disallow: /private/

User-agent: Bingbot
Disallow: /images/
```

### 5. Block Specific File Types
```
User-agent: *
Disallow: /*.pdf$
Disallow: /*.json$
Disallow: /*.xml$
```

### 6. Complex Example with Sitemap
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /login/
Disallow: /checkout/
Disallow: /*.json$

User-agent: Googlebot
Allow: /images/
Crawl-delay: 10

Sitemap: https://www.yourdomain.com/sitemap.xml
```

---

## Best Practices

1. **Test Your robots.txt** - Use Google Search Console's robots.txt Tester
2. **Keep it Simple** - Complex rules can be misinterpreted
3. **Use Comments** - Add `#` comments for documentation
4. **Specify Sitemap Location** - Help search engines find your sitemap
5. **Regularly Review** - Update as your site structure changes
6. **Use Lowercase Paths** - URLs are case-sensitive
7. **Escape Special Characters** - Use `\*` for asterisk, `\$` for dollar sign

---

## Common User-Agents

| Search Engine | User-Agent |
|---------------|------------|
| Google | `Googlebot` |
| Google Images | `Googlebot-Image` |
| Bing | `Bingbot` |
| Yahoo | `Slurp` |
| DuckDuckGo | `DuckDuckBot` |
| Baidu | `Baiduspider` |
| Yandex | `Yandex` |
| All Robots | `*` |

---

## Security Considerations

⚠️ **Important**: robots.txt does NOT:
- Prevent access to your pages (only suggests crawlers don't visit)
- Hide pages from search results (use `noindex` meta tag instead)
- Provide actual security for sensitive data
- Block malicious bots

**Never rely on robots.txt to protect sensitive information.** Use proper authentication and access controls instead.

---

## Testing & Validation

### Google Search Console
1. Go to Google Search Console
2. Select your property
3. Navigate to "robots.txt Tester"
4. Test URLs against your rules

### Online Tools
- https://www.google.com/webmasters/tools/robots-testing-tool
- https://technicalseo.com/tools/robots-txt/

---

## HTTP Response Code

Your robots.txt should return:
- **HTTP 200 OK** - File found and readable
- **HTTP 404 Not Found** - Search engines will crawl everything (not recommended)
- **HTTP 403 Forbidden** - Search engines will NOT crawl anything

---

## robots.txt vs Other Methods

| Method | Effect | Use Case |
|--------|--------|----------|
| `robots.txt` | Blocks crawling | General site-wide rules |
| `noindex` meta tag | Blocks indexing | Hide specific pages |
| `X-Robots-Tag` header | Blocks indexing | Non-HTML files |
| Password protection | Blocks access | Sensitive content |

---

## Quick Reference

```
# Comment line
User-agent: *              # All robots
Disallow: /private/        # Block directory
Allow: /public/file.html   # Allow specific file
Sitemap: https://...       # Sitemap location
Crawl-delay: 10            # Delay between requests
```

---

*Document generated for web development best practices*
