#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FINALNO uklanjanje dimenzija iz opisa i postavljanje na prvo mesto
"""

import sys

sys.stdout.reconfigure(encoding='utf-8')

# Ažuriraj mock-data.ts
with open('lib/data/mock-data.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Ukloni sve varijante dimenzija iz opisa
content = content.replace('• 50×50cm format pločica\\n', '')
content = content.replace('• 50×50cm format pločica\n', '')
content = content.replace('50×50cm format pločica\\n', '')
content = content.replace('50×50cm format pločica\n', '')
content = content.replace('• 50x50cm format pločica\\n', '')
content = content.replace('• 50x50cm format pločica\n', '')

with open('lib/data/mock-data.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ mock-data.ts: dimenzije uklonjene iz opisa')
print('\nOpis sada nema dimenzije!')
print('Karakteristike prikazuju dimenzije na prvom mestu!')
