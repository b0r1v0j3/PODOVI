import json

# Read the file
with open('public/data/linoleum_colors_complete.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Fix all colors
fixed_count_format = 0
fixed_count_dimensions = 0

for color in data.get('colors', []):
    if 'characteristics' in color and color['characteristics']:
        # Fix Format
        if 'Format' in color['characteristics']:
            if color['characteristics']['Format'] == '2m Rolna':
                color['characteristics']['Format'] = 'Rolna'
                fixed_count_format += 1
        
        # Remove Širina rolne and Dužina rolne
        removed_width = color['characteristics'].pop('Širina rolne', None)
        removed_length = color['characteristics'].pop('Dužina rolne', None)
        if removed_width or removed_length:
            fixed_count_dimensions += 1

# Write back
with open('public/data/linoleum_colors_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'Fixed Format: {fixed_count_format} colors')
print(f'Removed width/length: {fixed_count_dimensions} colors')
