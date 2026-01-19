import json
import re

# Read the file
with open('public/data/linoleum_colors_complete.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Fix all colors
fixed_count = 0

for color in data.get('colors', []):
    if 'description' in color and color['description']:
        description = color['description']
        original = description
        
        # Remove "Ugrađeni dizajni: ..." line
        description = re.sub(r'Ugrađeni dizajni:.*\n', '', description)
        
        # Remove "Kreativni dizajn: ..." line  
        description = re.sub(r'Kreativni dizajn:.*\n', '', description)
        
        # Clean up double newlines that might result
        description = re.sub(r'\n\n\n+', '\n\n', description)
        
        if description != original:
            color['description'] = description
            fixed_count += 1

# Write back
with open('public/data/linoleum_colors_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'Removed design lines from {fixed_count} colors')
