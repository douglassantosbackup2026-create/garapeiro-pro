/**
 * Upload PDFs do Playbook para o bucket privado `playbook`.
 * Requer no .env: VITE_SUPABASE_URL (ou SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY
 *
 *   node scripts/upload-playbook.mjs
 */
import { readFileSync } from "fs";
import { resolve } from "path";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [
        l.slice(0, i).trim(),
        l
          .slice(i + 1)
          .trim()
          .replace(/^["']|["']$/g, ""),
      ];
    }),
);

const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env");
  process.exit(1);
}

const files = [
  "playbook-oficinapro.pdf",
  "recuperador-orcamentos.pdf",
  "kit-templates.pdf",
  "metodo-3km.pdf",
];

for (const name of files) {
  const buf = readFileSync(resolve("supabase/seed-playbook", name));
  const res = await fetch(`${url}/storage/v1/object/playbook/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      "Content-Type": "application/pdf",
      "x-upsert": "true",
    },
    body: buf,
  });
  console.log(name, res.status, (await res.text()).slice(0, 160));
}
