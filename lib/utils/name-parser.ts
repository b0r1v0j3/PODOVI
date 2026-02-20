export function splitProductTitle(productName: string, collectionName?: string | null): { collection: string, color: string } {
    if (!productName) {
        return { collection: collectionName || '', color: '' };
    }

    let color = productName;
    let collection = collectionName || '';

    if (collection && color.toLowerCase().startsWith(collection.toLowerCase())) {
        color = color.substring(collection.length).trim();
        // Remove leading separators like "-", "–", or space
        color = color.replace(/^[-–—\s]+/, '');
    }

    // If color was stripped completely (e.g., product name WAS the collection name perfectly), fallback to product name
    if (!color) {
        color = productName;
        collection = ''; // prevent duplicate rendering if they are the exact same sting
    }

    return { collection, color };
}
