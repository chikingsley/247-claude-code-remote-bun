/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['var(--font-geist-sans)', 'Geist', 'system-ui', 'sans-serif'],
  			mono: ['var(--font-geist-mono)', 'Geist Mono', 'monospace'],
  			display: ['var(--font-geist-sans)', 'Geist', 'system-ui', 'sans-serif'],
  		},
  		borderRadius: {
  			lg: 'var(--radius-lg)',
  			md: 'var(--radius)',
  			sm: 'var(--radius-sm)',
  			xl: 'var(--radius-xl)',
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			'foreground-muted': 'hsl(var(--foreground-muted))',
  			'foreground-subtle': 'hsl(var(--foreground-subtle))',
  			surface: {
  				0: 'hsl(var(--surface-0))',
  				1: 'hsl(var(--surface-1))',
  				2: 'hsl(var(--surface-2))',
  				3: 'hsl(var(--surface-3))',
  			},
  			status: {
  				working: 'hsl(var(--status-working))',
  				attention: 'hsl(var(--status-attention))',
  				permission: 'hsl(var(--status-permission))',
  				success: 'hsl(var(--status-success))',
  				idle: 'hsl(var(--status-idle))',
  				error: 'hsl(var(--status-error))',
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))',
  				hover: 'hsl(var(--primary-hover))',
  				muted: 'hsl(var(--primary-muted))',
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))',
  				blue: 'hsl(var(--accent-blue))',
  				purple: 'hsl(var(--accent-purple))',
  				emerald: 'hsl(var(--accent-emerald))',
  				amber: 'hsl(var(--accent-amber))',
  				rose: 'hsl(var(--accent-rose))',
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			'border-subtle': 'hsl(var(--border-subtle))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		boxShadow: {
  			'glow-orange': 'var(--shadow-glow-orange)',
  			'glow-blue': 'var(--shadow-glow-blue)',
  			'glow-purple': 'var(--shadow-glow-purple)',
  			'glow-emerald': 'var(--shadow-glow-emerald)',
  		},
  		animation: {
  			'status-pulse': 'status-pulse 2s ease-out infinite',
  			'fade-in-up': 'fade-in-up var(--duration-normal) var(--ease-out) forwards',
  			'slide-in-left': 'slide-in-left var(--duration-normal) var(--ease-out) forwards',
  			'scale-in': 'scale-in var(--duration-fast) var(--ease-spring) forwards',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
