# Ruff Lyfe Pet Services - PWA

## What Is This?
A Progressive Web App (PWA) for Ruff Lyfe Pet Services. It works like a native app on any phone — customers can "Add to Home Screen" and it looks just like a real app with your logo as the icon.

## Features
- **Booking system** — Customers pick a service, select dates, enter pet details, and submit a request
- **Admin dashboard** — Approve/decline bookings, manage schedule, set max pets, edit prices (PIN protected, default: 1234)
- **Product shop** — Boop Butter listing with cart and "request to purchase" flow
- **Push notifications** — Get alerts when new bookings come in
- **Offline support** — Works even with spotty internet
- **Contact page** — Phone, email, Venmo, Zelle info

## How to Deploy (Free)

### Option A: Vercel (Recommended - Easiest)
1. Create a free account at https://vercel.com
2. Install Vercel CLI: `npm install -g vercel`
3. In the project folder, run: `vercel --prod`
4. Follow the prompts — when asked for the output directory, enter: `public`
5. Done! You'll get a URL like `ruff-lyfe.vercel.app`
6. (Optional) Connect a custom domain like `rufflyfe.com` in Vercel settings

### Option B: Netlify (Also Easy)
1. Create a free account at https://netlify.com
2. Drag and drop the `public` folder onto the Netlify dashboard
3. Done! Get your URL and optionally connect a custom domain

### Option C: Run Locally for Testing
```bash
npm install
npm start
```
Open http://localhost:3000 on your phone (same WiFi network)

## How to Install on Phone

### Android
1. Open the site in Chrome
2. You'll see an "Add to Home Screen" banner automatically
3. Tap "Install" — the app appears on your home screen with the Ruff Lyfe icon

### iPhone
1. Open the site in Safari
2. Tap the Share button (box with arrow at bottom)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"
5. The app appears on your home screen

## Admin Setup (First Time)
1. Open the app and tap the **Admin** (gear) icon in the bottom nav
2. Enter PIN: **1234** (change this immediately!)
3. Go to **Info** tab — fill in your phone, email, Venmo, Zelle, and bio
4. Go to **Schedule** tab — block off any dates you're unavailable
5. Go to **Services** tab — adjust prices and disable any services you don't offer
6. Go to **Alerts** tab — tap "Enable Notifications" so you get alerts for new bookings
7. Change your PIN in the **Info** tab!

## How Payments Work
Payments are handled externally for now. When a customer books or orders:
1. You get a notification
2. Open Admin → Bookings to review
3. Confirm or decline the booking
4. Contact the customer via phone/text to collect payment via Venmo or Zelle

## File Structure
```
public/
├── index.html      — Main HTML with PWA setup
├── app.js          — The full React app
├── sw.js           — Service worker (offline + notifications)
├── manifest.json   — PWA config (name, icons, colors)
├── logo.jpg        — Original logo
├── icon-*.png      — Generated app icons (all sizes)
```

## Customizing
- **Colors**: Edit the BRAND object at the top of `app.js`
- **Services**: Edit DEFAULT_SETTINGS in `app.js` or change them in Admin
- **Products**: Edit DEFAULT_PRODUCTS in `app.js` or change them in Admin
- **Logo**: Replace `logo.jpg` and regenerate icons

## Future Enhancements
- Online payment integration (Stripe, Square)
- Photo gallery of happy pets
- Customer accounts and booking history
- SMS notifications via Twilio
- Google Calendar sync
- Review/testimonial section
