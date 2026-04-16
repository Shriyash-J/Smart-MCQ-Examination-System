/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ========== CUSTOM COLORS (from your CSS variables) ==========
      colors: {
        primary: 'var(--primary)',
        'primary-dark': 'var(--primary-dark)',
        secondary: 'var(--secondary)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
      },
      
      // ========== TYPOGRAPHY ==========
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      
      // ========== ANIMATIONS ==========
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { textShadow: '0 0 5px rgba(67, 97, 238, 0.2)' },
          '100%': { textShadow: '0 0 20px rgba(67, 97, 238, 0.6)' },
        },
      },
      
      // ========== BACKGROUND GRADIENTS (creative presets) ==========
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
        'gradient-secondary': 'linear-gradient(135deg, var(--secondary) 0%, #c9184a 100%)',
        'gradient-success': 'linear-gradient(135deg, var(--success) 0%, #02c39a 100%)',
        'gradient-warning': 'linear-gradient(135deg, var(--warning) 0%, #f9a826 100%)',
        'gradient-danger': 'linear-gradient(135deg, var(--danger) 0%, #d90429 100%)',
        'hero-pattern': 'url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%234361ee" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')',
      },
      
      // ========== CUSTOM BOX SHADOWS ==========
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 15px rgba(67, 97, 238, 0.3)',
        'card-hover': '0 20px 35px -10px rgba(0, 0, 0, 0.1)',
      },
      
      // ========== BACKDROP BLUR (more options) ==========
      backdropBlur: {
        xs: '2px',
      },
      
      // ========== SCREEN SIZES (responsive breakpoints) ==========
      screens: {
        'xs': '475px',
        '3xl': '1920px',
      },
      
      // ========== SPACING (optional extra) ==========
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // ========== BORDER RADIUS (softer defaults) ==========
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
}