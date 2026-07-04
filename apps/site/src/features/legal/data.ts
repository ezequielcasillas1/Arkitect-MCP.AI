import type { LegalDocument } from "./types";

export const termsDocument: LegalDocument = {
  label: "Legal",
  title: "Terms of Use",
  intro:
    "These terms govern your use of the Arkitect marketing site, desktop application, and MCP server. By accessing or using Arkitect, you agree to these terms.",
  sections: [
    {
      id: "acceptance",
      title: "Acceptance",
      paragraphs: [
        "By downloading, installing, or using Arkitect — including the desktop app, MCP server, or this website — you agree to these Terms of Use. If you do not agree, do not use Arkitect.",
        "We may update these terms from time to time. Continued use after changes are posted constitutes acceptance of the revised terms."
      ]
    },
    {
      id: "eligibility",
      title: "Eligibility",
      paragraphs: [
        "You must be at least 13 years old to use Arkitect. If you are under 18, you represent that you have permission from a parent or guardian.",
        "You are responsible for ensuring your use complies with applicable laws and any policies of your employer or organization."
      ]
    },
    {
      id: "free-tier",
      title: "Free tier (first 1,000 users)",
      paragraphs: [
        "Arkitect desktop and MCP usage is free and unlimited for the first 1,000 registered users. This includes diagnosis, catalog recommendations, verification, and other core MCP tools.",
        "Core MCP analysis runs locally via @arkitect/core on your machine. It does not require Arkitect-provided AI or a cloud AI backend."
      ]
    },
    {
      id: "post-cap-byok",
      title: "After the free tier",
      paragraphs: [
        "Once the 1,000-user free tier is reached, continued use of agent-driven orchestration workflows requires you to supply your own AI provider API key (bring your own key — BYOK).",
        "Orchestration patterns — where an AI agent drives the workflow loop, calls MCP tools, implements cursorGuidance, and edits code — require an AI agent. That agent is typically Cursor's built-in AI, or in the desktop app your own key for providers such as Cursor, Anthropic, OpenAI, Gemini, or Groq.",
        "The MCP server itself does not require Arkitect-hosted AI. AI is required for the agent orchestration loop, not for running diagnosis, catalogs, or verification locally."
      ]
    },
    {
      id: "acceptable-use",
      title: "Acceptable use",
      paragraphs: [
        "You agree not to misuse Arkitect, attempt to bypass licensing or usage limits, reverse engineer protection mechanisms except where law permits, or use the software to violate others' rights.",
        "You are responsible for the code and repositories you analyze, and for any changes an AI agent makes under your direction."
      ]
    },
    {
      id: "scope",
      title: "Desktop & MCP scope",
      paragraphs: [
        "Arkitect is provided as a desktop application and MCP server for local repository analysis and architecture guidance. Features may differ between Cursor chat integration and the desktop wizard; both share the same core diagnosis and catalog logic.",
        "Arkitect does not guarantee specific outcomes, architecture scores, or compatibility with every repository layout. Results depend on your codebase, configuration, and how you use MCP tools and optional AI orchestration."
      ]
    },
    {
      id: "disclaimers",
      title: "Disclaimers",
      paragraphs: [
        "Arkitect is provided \"as is\" without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, or non-infringement.",
        "Architecture guidance and AI-generated suggestions are informational. You remain solely responsible for reviewing, testing, and deploying changes to your code and systems."
      ]
    },
    {
      id: "changes",
      title: "Changes",
      paragraphs: [
        "We may modify these terms, product features, or free-tier limits with notice on this site or in the desktop app where practical.",
        "Material changes to pricing or licensing after the free tier will be communicated before they take effect for existing users where feasible."
      ]
    },
    {
      id: "contact",
      title: "Contact",
      paragraphs: [
        "Questions about these terms can be sent via the contact links on the About or Reviews pages (Reddit or X). Every message gets read."
      ]
    }
  ]
};

export const privacyDocument: LegalDocument = {
  label: "Legal",
  title: "Privacy Policy",
  intro:
    "This policy describes what data Arkitect collects on this marketing site and how the desktop app and MCP server handle your information. Placeholder copy — final text may be updated.",
  sections: [
    {
      id: "what-we-collect",
      title: "What we collect",
      paragraphs: [
        "On this website, we collect data you voluntarily submit (public reviews) and anonymous download-counter events used to track progress toward the 1,000-user free tier.",
        "Reviews may include a display name, rating, comment, and optional social links you choose to share. Download events use a browser-local visitor identifier for deduplication — not for cross-site tracking."
      ]
    },
    {
      id: "supabase",
      title: "Supabase storage",
      paragraphs: [
        "Reviews and download counts are stored in Supabase with row-level security. Public review listings are readable by anyone; writes are rate-limited per visitor.",
        "We do not sell review or download data. Data is used to display community feedback and enforce the free-tier milestone on the marketing site."
      ]
    },
    {
      id: "local-mcp",
      title: "Local-only MCP",
      paragraphs: [
        "The Arkitect MCP server and desktop diagnosis pipeline run on your machine. Repo inspection, catalogs, and verification via @arkitect/core do not phone home to Arkitect for AI processing.",
        "Your source code and local analysis results stay on your device unless you explicitly share them (for example, in a public review or with a third-party AI provider you configure)."
      ]
    },
    {
      id: "ai-keys",
      title: "Third-party AI keys",
      paragraphs: [
        "When you use agent orchestration, API keys for providers (Cursor, Anthropic, OpenAI, Gemini, Groq, etc.) are stored locally in the desktop app on your device — not transmitted to or stored by Arkitect servers.",
        "Requests made with your keys go directly to the provider you choose, subject to that provider's privacy policy and terms."
      ]
    },
    {
      id: "cookies-hosting",
      title: "Cookies & hosting",
      paragraphs: [
        "This site is hosted on Cloudflare Pages. Cloudflare may process standard request metadata (IP address, user agent) for security and delivery.",
        "We use browser local storage for anonymous visitor deduplication on the download counter. We do not use third-party advertising cookies on this site."
      ]
    },
    {
      id: "your-rights",
      title: "Your rights",
      paragraphs: [
        "Depending on your jurisdiction, you may have rights to access, correct, or delete personal data we hold from site submissions. Contact us via the links on the About or Reviews pages.",
        "You can clear local storage in your browser to reset the anonymous visitor identifier used for download deduplication."
      ]
    },
    {
      id: "contact",
      title: "Contact",
      paragraphs: [
        "Privacy questions can be sent via Reddit or X — see the Connect section on the About or Reviews pages."
      ]
    }
  ]
};

export function legalToc(sections: LegalDocument["sections"]) {
  return sections.map(({ id, title }) => ({ id, title }));
}
