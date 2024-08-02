// import { Config } from "tailwindcss";
// import { cartridgeTWPlugin } from "@cartridge/ui-next";
const {cartridgeTWPlugin} = require("@cartridge/ui-next");

/** @type {import('tailwindcss').Config} */
// const config = {
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@cartridge/ui-next/dist/**/*.js",
  ],
  prefix: "",
  plugin: [cartridgeTWPlugin],
} satisfies Config;

// export default config;
