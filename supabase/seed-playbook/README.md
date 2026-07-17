# Playbook PDFs (private Storage seed)
#
# Upload to the private `playbook` bucket after deploy:
#
#   npx supabase storage cp supabase/seed-playbook/playbook-oficinapro.pdf playbook/playbook-oficinapro.pdf --experimental
#
# Or via Dashboard → Storage → playbook → Upload each PDF with the exact filenames:
#   playbook-oficinapro.pdf
#   recuperador-orcamentos.pdf
#   kit-templates.pdf
#   metodo-3km.pdf
#
# These files must NOT live under /public (direct URL bypass).
