import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/site-config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /data/ = sirovi kataloški JSON-ovi (samo za build; HTTP pristup blokiran u middleware-u)
      disallow: ['/api/', '/admin/', '/data/', '/crm/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
