#!/usr/bin/env python3
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = data.get('colors', [])

ballerina = [c for c in colors if c.get('slug') == 'ballerina-41870347']
amber = [c for c in colors if c.get('slug') == 'amber-61261744']
arena = [c for c in colors if c.get('slug') == 'arena-39770060']

print('Ballerina (creation-30):')
if ballerina:
    print(f'  Dimension: {ballerina[0].get("dimension")}')
    print(f'  Format: {ballerina[0].get("format")}')
    print(f'  Thickness: {ballerina[0].get("overall_thickness")}')
    desc = ballerina[0].get('description', '')
    print(f'  Description: {desc[:100] if desc else "NONE"}...')

print('\nAmber (creation-55-clic-acoustic):')
if amber:
    print(f'  Dimension: {amber[0].get("dimension")}')
    print(f'  Format: {amber[0].get("format")}')
    print(f'  Thickness: {amber[0].get("overall_thickness")}')
    desc = amber[0].get('description', '')
    print(f'  Description: {desc[:100] if desc else "NONE"}...')

print('\nArena (creation-70-looselay):')
if arena:
    print(f'  Dimension: {arena[0].get("dimension")}')
    print(f'  Format: {arena[0].get("format")}')
    print(f'  Thickness: {arena[0].get("overall_thickness")}')
    desc = arena[0].get('description', '')
    print(f'  Description: {desc[:100] if desc else "NONE"}...')

# Count complete
complete = sum(1 for c in colors if c.get('description') and c.get('dimension') and c.get('format') and c.get('overall_thickness'))
print(f'\nKompletno: {complete}/{len(colors)} ({complete/len(colors)*100:.1f}%)')
