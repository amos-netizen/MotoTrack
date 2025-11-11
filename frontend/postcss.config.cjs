// Use CommonJS to avoid ESM loader issues in PostCSS config
module.exports = {
  plugins: [require('@tailwindcss/postcss'), require('autoprefixer')],
}



