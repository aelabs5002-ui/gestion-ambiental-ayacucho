export default defineNuxtConfig({
  compatibilityDate: '2025-03-01',
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss'],
  tailwindcss: {
    cssPath: '~/assets/css/main.css'
  },
  css: ['leaflet/dist/leaflet.css'],
  app: {
    head: {
      title: 'Gestión Ambiental Ayacucho — Portal de Aseo Urbano',
      htmlAttrs: { lang: 'es' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Plataforma institucional de gestión de recolección de desechos sólidos, cobros con Ubii Pagos y atención vecinal — Municipio Ayacucho.'
        }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
        }
      ]
    }
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-ayacucho-cambiar-en-produccion-2026',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    ubiiApiKey: process.env.UBII_API_KEY || '',
    ubiiSecret: process.env.UBII_SECRET || '',
    smtpHost: process.env.SMTP_HOST || '',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    public: {
      demoMode: process.env.DEMO_MODE !== 'false',
      defaultExchangeRate: Number(process.env.TASA_CAMBIO_USD_BS || '58.50'),
      institutionName:
        process.env.INSTITUTION_NAME || 'Instituto Municipal de Gestión Ambiental — Ayacucho'
    }
  }
})
