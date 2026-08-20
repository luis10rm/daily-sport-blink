import type { Config } from "tailwindcss";

export default {
  future: {
    hoverOnlyWhenSupported: true,
  },
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      fontFamily: {
        heading: ["Outfit", "sans-serif"],
        sans: ["Outfit", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sport: {
          football: "hsl(var(--sport-football))",
          basketball: "hsl(var(--sport-basketball))",
          tennis: "hsl(var(--sport-tennis))",
          f1: "hsl(var(--sport-f1))",
          mma: "hsl(var(--sport-mma))",
          other: "hsl(var(--sport-other))",
        },
        "news-of-day": {
          DEFAULT: "hsl(var(--news-of-day))",
          foreground: "hsl(var(--news-of-day-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer-border": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "delayed-fade-in": {
          "0%, 50%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "celebration-pop": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "60%": { transform: "scale(1.25)", opacity: "1" },
          "80%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
        "celebration-text": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "confetti-1": {
          "0%": { transform: "translate(0,0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translate(-60px,-80px) rotate(200deg)", opacity: "0" },
        },
        "confetti-2": {
          "0%": { transform: "translate(0,0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translate(70px,-90px) rotate(-180deg)", opacity: "0" },
        },
        "confetti-3": {
          "0%": { transform: "translate(0,0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translate(-80px,30px) rotate(160deg)", opacity: "0" },
        },
        "confetti-4": {
          "0%": { transform: "translate(0,0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translate(50px,60px) rotate(-220deg)", opacity: "0" },
        },
        "confetti-5": {
          "0%": { transform: "translate(0,0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translate(-30px,-100px) rotate(140deg)", opacity: "0" },
        },
        "confetti-6": {
          "0%": { transform: "translate(0,0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translate(90px,-40px) rotate(-160deg)", opacity: "0" },
        },
        "wiggle": {
          "0%,100%": { transform: "rotate(0deg) scale(1)" },
          "25%": { transform: "rotate(-4deg) scale(1.05)" },
          "75%": { transform: "rotate(4deg) scale(1.05)" },
        },
        "float-slow-a": {
          "0%,100%": { transform: "translate(-10%,-10%) scale(1)" },
          "50%": { transform: "translate(10%,10%) scale(1.08)" },
        },
        "float-slow-b": {
          "0%,100%": { transform: "translate(15%,20%) scale(1.05)" },
          "50%": { transform: "translate(-15%,-10%) scale(0.95)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "shimmer-border": "shimmer-border 3s ease-in-out infinite",
        "delayed-fade-in": "delayed-fade-in 2s ease-out forwards",
        "celebration-pop": "celebration-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "celebration-text": "celebration-text 0.5s ease-out forwards",
        "confetti-1": "confetti-1 0.8s ease-out forwards",
        "confetti-2": "confetti-2 0.9s ease-out forwards",
        "confetti-3": "confetti-3 0.85s ease-out forwards",
        "confetti-4": "confetti-4 0.95s ease-out forwards",
        "confetti-5": "confetti-5 0.75s ease-out forwards",
        "confetti-6": "confetti-6 0.88s ease-out forwards",
        "wiggle": "wiggle 0.5s ease-in-out",
        "float-slow-a": "float-slow-a 20s ease-in-out infinite",
        "float-slow-b": "float-slow-b 28s ease-in-out infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    function ({ addVariant }) {
      addVariant("hover", "@media (any-hover: hover) and (any-pointer: fine) { &:hover }");
    },
  ],
} satisfies Config;
