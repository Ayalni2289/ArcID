import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        arc: {
          blue: "#185FA5",
          "blue-light": "#93c5fd",
          green: "#34d399",
          purple: "#c4b5fd",
          teal: "#6ee7b7",
        },
      },
    },
  },
  plugins: [],
};

export default config;
