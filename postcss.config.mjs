const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    "postcss-preset-env": {
      features: {
        'nesting-rules': true
      },
      browsers: [
        "> 0.2%",
        "last 2 versions",
        "Chrome >= 109",
        "not dead"
      ]
    },
    "autoprefixer": {},
  },
};

export default config;
