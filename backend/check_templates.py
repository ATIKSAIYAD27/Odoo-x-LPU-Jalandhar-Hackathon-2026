import re, glob, os

app_dir = r'C:\Users\atiks\OneDrive\Documents\Odoo x LPU Jalandhar Hackathon 2026\backend\app'

# Gather all valid endpoints from route decorators
eps = set()
for py in glob.glob(os.path.join(app_dir, '*.py')):
    content = open(py, encoding='utf-8').read()
    for m in re.finditer(r'@(\w+_bp)\.route\(', content):
        bp = m.group(1).replace('_bp', '')
        # find next def after this route
        rest = content[m.end():]
        dm = re.search(r'def\s+(\w+)', rest)
        if dm:
            eps.add(f'{bp}.{dm.group(1)}')

print(f"Valid endpoints ({len(eps)}):")
for e in sorted(eps):
    print(f"  {e}")

# Check all templates for broken url_for
print("\nBroken url_for references:")
broken = False
for tpl in glob.glob(os.path.join(app_dir, 'templates', '**', '*.html'), recursive=True):
    content = open(tpl, encoding='utf-8').read()
    for m in re.finditer(r"""url_for\(['"]([\w.]+)['"]""", content):
        ep = m.group(1)
        if ep not in eps:
            # find line number
            line = content[:m.start()].count('\n') + 1
            rel = os.path.relpath(tpl, app_dir)
            print(f"  {rel}:{line} -> {ep}")
            broken = True
if not broken:
    print("  None found")
