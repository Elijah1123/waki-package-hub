# Waki Packages Hub

Role: You are an expert Full-Stack Web Developer. Your task is to build a complete e-commerce website based on the specifications below.

1. Business & Branding Details

Business Name: Waki Packages

Phone Number: 0725094498

Location: Behind Bingo Hardware, Kiria-ini Town, Murang'a County

Currency: Kenyan Shillings (Ksh)

Product Catalog:

Brown packaging bags

Gift bags

Branded book covers

Charcoal briquettes

Cake boxes

Envelopes

Popcorn bags

2. Website Navigation & Main Pages

A. Home Page

Display a grid layout showcasing all packaging products with clear titles, image placeholders, and pricing in Ksh.

Include an "Order" (or "Add to Cart") button below each item that updates the user's order list in real-time.

Feature clear navigation links to Home, About Us, and Contact Us.

B. About Us Page

About Us: We produce quality, affordable packaging products, including paper bags, gift bags, branded book covers, charcoal briquettes, cake boxes, envelopes, and popcorn bags.

Mission: To provide quality, affordable, and eco-friendly packaging solutions.

Vision: To be a trusted leader in innovative and sustainable packaging.

C. Contact Us Page

Display contact details:

Phone: 0725094498

Location: Behind Bingo Hardware, Kiria-ini Town, Murang'a County

Include an interactive contact form (Name, Email, Message) and a location map placeholder.

3. Authentication & User Dashboard

A. Authentication System

Implement Sign Up and Login functionality.

Upon successful registration/login, display the user's profile avatar/name at the top-right corner of the navigation bar.

Clicking the profile icon redirects the user to their User Dashboard.

B. User Dashboard Features

Profile Settings:

Ability to update profile picture, full name, and delivery address (exact location input field).

Orders Category:

View current ordered items and item quantities.

Edit or modify ordered goods prior to checkout.

Automatic calculation of subtotal, shipping fee, and grand total.

Shipping Logic:

Free Delivery: Within Kiria-ini Town.

Location-Based Shipping: Calculated based on the user's specified delivery address outside Kiria-ini Town.

Payment Integration:

Checkout process utilizing M-Pesa (STK Push / M-Pesa API integration).

Privacy & Security Settings:

Option to change account password.

Checkbox/toggle to view and accept the website’s Terms and Conditions.

Navigation:

A prominent "Back to Home Page" button.

4. Admin Dashboard

Create a dedicated Admin Panel compatible with the front-end functionality, featuring:

Product Management: Add, update, edit pricing (in Ksh), and delete product listings.

Order Management: View incoming orders, updated delivery addresses, payment status (M-Pesa transaction reference), and order status (Pending, Shipped, Delivered).

User Management: View registered users and their delivery details.

Shipping Fee Settings: Configure base rates for locations outside Kiria-ini Town.

5. Technical Requirements

Clean, responsive design (mobile-friendly and desktop-optimized).

Secure authentication and route protection for user and admin dashboards.

Form validation for inputs (phone numbers, login credentials, address fields). Now develop the website and let the admindashboard be accessed with the following details; email; Ad

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/246c3a48-89ea-42f3-bf3e-b97baf21e214).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
