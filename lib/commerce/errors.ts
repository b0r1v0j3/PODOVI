export class CommerceError extends Error {
  lineKey?: string; // `${productSlug}:${variantSlug || ''}` of the cart line that failed, when known
  constructor(message: string, public status = 400, public code = 'INVALID_REQUEST') {
    super(message);
  }
}
