import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      colors: {
        primary: {
          DEFAULT: '#1565C0',
          dark: '#0D47A1',
          darker: '#0A3880',
          light: '#DAE5FF',
          deep: '#004D99'
        },
        danger: {
          DEFAULT: '#C62828',
          dark: '#B71C1C',
          bg: '#FFEBEE'
        },
        success: {
          DEFAULT: '#2E7D32',
          bg: '#E8F5E9'
        },
        warning: {
          DEFAULT: '#8D5B00',
          accent: '#F9A825',
          bg: '#FFF8E1'
        },
        canvas: '#F5F7FA',
        ink: {
          DEFAULT: '#1A1A1A',
          secondary: '#616161'
        }
      },
      boxShadow: {
        card: '0 2px 4px rgba(0, 0, 0, 0.05)',
        popover: '0 4px 12px rgba(0, 0, 0, 0.08)',
        modal: '0 8px 24px rgba(0, 0, 0, 0.12)'
      }
    }
  }
}
