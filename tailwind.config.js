/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Breakpoints personalizados para diferentes resoluciones
      screens: {
        'xs': '480px',      // Móviles pequeños
        'sm': '640px',      // Móviles grandes
        'md': '768px',      // Tablets
        'lg': '1024px',     // Laptops pequeñas
        'xl': '1280px',     // Laptops medianas (1366x768 cae aquí con sidebar)
        '2xl': '1536px',    // Monitores grandes
        // Breakpoints específicos para resoluciones comunes
        'laptop-sm': '1366px',  // HP 245 G9 y laptops 14"
        'laptop-md': '1440px',  // MacBook Pro 13"
        'laptop-lg': '1600px',  // Laptops 15.6"
        'desktop': '1920px',    // Full HD
      },
      // Espaciado personalizado para diferentes densidades
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      // Anchos de sidebar responsive
      width: {
        'sidebar': '16rem',        // 256px - Default
        'sidebar-sm': '14rem',     // 224px - Pantallas pequeñas
        'sidebar-collapsed': '4rem', // 64px - Colapsado
      },
      // Alturas mínimas
      minHeight: {
        'content': 'calc(100vh - 4rem)',
        'content-sm': 'calc(100vh - 3rem)',
      },
      // Fuentes con escalado fluido
      fontSize: {
        'fluid-xs': 'clamp(0.625rem, 0.5rem + 0.25vw, 0.75rem)',
        'fluid-sm': 'clamp(0.75rem, 0.625rem + 0.25vw, 0.875rem)',
        'fluid-base': 'clamp(0.875rem, 0.75rem + 0.25vw, 1rem)',
        'fluid-lg': 'clamp(1rem, 0.875rem + 0.25vw, 1.125rem)',
      },
    },
  },
  plugins: [],
}