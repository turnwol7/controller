import type { Config } from "tailwindcss";
import { cartridgeTWPlugin } from "@cartridge/ui-next";

const config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}", "./.storybook/**/*.{ts,tsx}"],
  prefix: "",
  plugins: [cartridgeTWPlugin],
} satisfies Config;

export default config;
