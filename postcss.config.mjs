/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {
      config: './tailwind.config.css',
    },
  },
};

export default config;
