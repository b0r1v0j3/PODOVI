import json

# Read the file
with open('public/data/linoleum_colors_complete.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Fix all colors
fixed_count = 0

for color in data.get('colors', []):
    if 'description' in color and color['description']:
        description = color['description']
        
        # Replace "Okruženje:" with "Održivost:"
        if 'Okruženje:' in description:
            color['description'] = description.replace('Okruženje:', 'Održivost:')
            fixed_count += 1

# Write back
with open('public/data/linoleum_colors_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'Changed "Okruženje:" to "Održivost:" for {fixed_count} colors')
