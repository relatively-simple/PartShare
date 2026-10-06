# PartShare ⚙️

PartShare is a community platform for university students and DIY makers to share leftover electronic and mechanical parts instead of throwing them away or buying new ones. It’s a completely free, zero-waste, open-source solution built to connect makers who have parts with makers who need them.

## Key Features

- **Offers & Requests:** Easily list parts you no longer need, or request specific parts for your projects.
- **Smart Matching:** When making a request, PartShare automatically suggests matching offers based on the part name, model number, and category.
- **Privacy-First Contact:** WhatsApp numbers are never displayed publicly. They are only securely revealed via an RPC call to signed-in users when they click "Contact".
- **Zero Cost Architecture:** Built exclusively on a free-tier stack. Requires absolutely zero monthly costs to run and maintain.
- **PWA Ready:** Install PartShare as a progressive web app on your phone for quick access.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, React Router, Tailwind CSS, Zod.
- **Backend:** Supabase (PostgreSQL, Row Level Security, Auth).
- **Deployment:** Cloudflare Pages.

## Setting Up Your Own PartShare

PartShare is designed to be hosted for exactly $0 using Supabase's free tier and Cloudflare Pages. 

Please follow our **[Step-by-Step Setup Guide](SETUP.md)** to:
1. Initialize your Supabase database using the included `supabase/schema.sql`
2. Configure Google OAuth for authentication
3. Connect and deploy to Cloudflare Pages
4. Set up an automated keep-alive cron job for the free database.

## Architecture & Security

PartShare enforces security entirely at the database layer using Postgres Row Level Security (RLS) and Security Definer functions:
- Anonymous users have strictly read-only access to open posts.
- Authenticated users cannot mutate posts owned by others.
- All "Contact" actions are processed by a securely rate-limited RPC function to prevent abuse and spam.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
