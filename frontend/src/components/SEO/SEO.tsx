import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  noindex?: boolean
  keywords?: string
  author?: string
  publishedAt?: string
  updatedAt?: string
}

const SITE_NAME = 'RustCMS'
const DEFAULT_DESCRIPTION = 'CMS moderno construido con Rust y React. Rapido, seguro y extensible.'

export default function SEO({ title, description = DEFAULT_DESCRIPTION, image, url, type = 'website', noindex = false, keywords, author = 'RustCMS', publishedAt, updatedAt }: SEOProps) {
  const SITE_URL = window.location.origin
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL
  const fullImage = image ? (image.startsWith('http') ? image : `${SITE_URL}${image}`) : `${SITE_URL}/og-default.png`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content={author} />
      <link rel="canonical" href={fullUrl} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="es_CO" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      {publishedAt && <meta property="article:published_time" content={publishedAt} />}
      {updatedAt && <meta property="article:modified_time" content={updatedAt} />}
    </Helmet>
  )
}
