/// <reference types="vite/client" />

declare module "*.md?raw" {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_BUY_ME_A_COFFEE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
