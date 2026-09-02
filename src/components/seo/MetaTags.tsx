import React, { useEffect } from 'react';

const BASE_URL = 'https://sarkari.studymate.in';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const DEFAULT_DESCRIPTION =
  'StudyMate Sarkari — Official portal for Central and State Government vacancies, admit cards, exam results, answer keys, and syllabus notifications across India.';

export interface MetaTagsProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  robots?: 'index, follow' | 'noindex, follow' | 'noindex, nofollow' | 'index, nofollow';
  keywords?: string[];
  schemaJson?: Record<string, any> | Array<Record<string, any>>;
}

export const MetaTags: React.FC<MetaTagsProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath = '',
  ogType = 'website',
  ogImage = DEFAULT_IMAGE,
  robots = 'index, follow',
  keywords,
  schemaJson,
}) => {
  const fullTitle = title
    ? `${title} | StudyMate Sarkari`
    : 'StudyMate Sarkari — Latest Government Jobs, Admit Cards & Results';

  // Normalize canonical URL (strip query parameters and hash)
  const normalizedPath = canonicalPath.split('?')[0].split('#')[0];
  const fullCanonicalUrl = `${BASE_URL}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;

  useEffect(() => {
    // 1. Update Document Title
    document.title = fullTitle;

    // Helper to set or create meta tag
    const setMetaTag = (attribute: 'name' | 'property', key: string, value: string) => {
      let element = document.querySelector(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', value);
    };

    // 2. Standard SEO Meta Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'robots', robots);
    if (keywords && keywords.length > 0) {
      setMetaTag('name', 'keywords', keywords.join(', '));
    }

    // 3. Open Graph Metadata
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', fullCanonicalUrl);
    setMetaTag('property', 'og:site_name', 'StudyMate Sarkari');
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:locale', 'en_IN');

    // 4. Twitter / X Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', ogImage);
    setMetaTag('name', 'twitter:site', '@StudyMateSarkari');

    // 5. Canonical Link Tag
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullCanonicalUrl);

    // 6. JSON-LD Structured Data
    const scriptId = 'studymate-schema-jsonld';
    let scriptTag = document.getElementById(scriptId);
    if (schemaJson) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = scriptId;
        scriptTag.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(schemaJson);
    } else if (scriptTag) {
      scriptTag.remove();
    }
  }, [fullTitle, description, fullCanonicalUrl, ogType, ogImage, robots, keywords, schemaJson]);

  return null;
};
