import os

d = r'C:\Users\atiks\OneDrive\Documents\Odoo x LPU Jalandhar Hackathon 2026\backend\app\templates'
replacements = [
    ("url_for('operations.new_receipt')", "url_for('operations.add_receipt')"),
    ("url_for('operations.new_delivery')", "url_for('operations.add_delivery')"),
    ("url_for('operations.new_transfer')", "url_for('operations.transfers')"),
]

for fname in ['base.html', 'dashboard.html']:
    p = os.path.join(d, fname)
    c = open(p, encoding='utf-8').read()
    for old, new in replacements:
        c = c.replace(old, new)
    open(p, 'w', encoding='utf-8').write(c)
    print(f'Fixed {fname}')
