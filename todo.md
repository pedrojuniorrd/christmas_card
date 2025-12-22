# Christmas Card SaaS - Project TODO

## Core Features

- [x] Database schema for cards, payments, and file references
- [x] Card creation flow with template selection
- [x] Custom message input with character limit
- [x] AI-powered festive message suggestions
- [x] Curated library of public domain Christmas songs
- [x] User music upload functionality
- [x] Photo upload with secure S3 storage
- [x] QR code generation with non-sequential unique IDs
- [x] Card display page with animations (falling snow, twinkling lights)
- [x] Audio playback on card display page
- [x] Time-limited card access (expires January 15th)

## Payment Integration

- [x] Stripe integration for international payments
- [ ] Brazilian PIX payment support
- [x] Tiered pricing model (3 reais for 1 card, 5 reais for 5 cards)
- [x] Payment verification before card activation

## Security & Infrastructure

- [x] Non-sequential unique card IDs to prevent URL enumeration
- [x] Secure file upload validation (type, size)
- [ ] Automatic cleanup of expired content
- [ ] Rate limiting for API endpoints

## UI/UX

- [x] Landing page with value proposition
- [x] Card creation wizard/stepper
- [x] Template preview gallery
- [x] Mobile-responsive design
- [x] Loading states and error handling

## Testing

- [x] Unit tests for card creation
- [x] Unit tests for payment processing
- [ ] Integration tests for file uploads
