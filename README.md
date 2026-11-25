<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Clarity Invoice — local-only prototype

> **This is not a SaaS yet.** There is no login, backend, database, or tenant
> isolation. Invoices, clients, settings and the optional Gemini key live in
> this browser's `localStorage`. Use the sidebar Backup/Restore controls, and do
> not put real customer data here until a backend with authentication ships.

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1cjC2S9g1IB0r-jsCdPCajPtM_FItryPy

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
