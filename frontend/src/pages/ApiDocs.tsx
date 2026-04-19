import { useEffect, useRef } from 'react'

export default function ApiDocs() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Cargar Swagger UI desde CDN
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js'
    script.onload = () => {
      if (containerRef.current && (window as any).SwaggerUIBundle) {
        ;(window as any).SwaggerUIBundle({
          url: '/api/v1/api-docs/openapi.json',
          dom_id: '#swagger-ui',
          presets: [(window as any).SwaggerUIBundle.presets.apis],
          layout: 'BaseLayout',
          deepLinking: true,
          tryItOutEnabled: true,
          theme: 'dark',
        })
      }
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(link)
      document.head.removeChild(script)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="border-b border-[#1a1a24] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">RustPress API <span className="text-[#7c6aff]">Docs</span></h1>
          <p className="text-xs text-[#555566] mt-0.5">OpenAPI 3.0 — Swagger UI</p>
        </div>
        <a href="/api/v1/api-docs/openapi.json" target="_blank" rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl border border-[#2a2a3a] text-sm text-[#888899] hover:text-white hover:border-[#7c6aff]/50 transition-all">
          openapi.json ↗
        </a>
      </div>
      <div id="swagger-ui" ref={containerRef} className="swagger-dark" />
      <style>{`
        .swagger-ui { background: transparent !important; }
        .swagger-ui .topbar { display: none !important; }
        .swagger-ui .info { padding: 20px; }
        .swagger-ui .scheme-container { background: #0e0e1a !important; padding: 10px 20px; }
        .swagger-ui .opblock { background: #0e0e1a !important; border-color: #2a2a3a !important; margin-bottom: 8px; }
        .swagger-ui .opblock-summary { border-color: #2a2a3a !important; }
        .swagger-ui .opblock .opblock-summary-description { color: #888899 !important; }
        .swagger-ui .btn { background: #7c6aff !important; border-color: #7c6aff !important; }
        .swagger-ui section.models { background: #0e0e1a !important; }
        .swagger-ui .model-box { background: #1a1a2e !important; }
        body .swagger-ui, body .swagger-ui * { color: #ccc; }
        .swagger-ui .info .title { color: white !important; }
      `}</style>
    </div>
  )
}
