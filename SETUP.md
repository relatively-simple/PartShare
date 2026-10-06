# Setup Guide for PartShare

Welcome to PartShare! This guide will walk you through setting up the project from scratch, without writing any code.

## 1. Database Setup (Supabase)

PartShare relies on Supabase for a free PostgreSQL database, authentication, and Row Level Security. 

1. Go to [Supabase](https://supabase.com/) and sign in or create an account.
2. Click **New Project**, select an organization, give it a name (e.g., `partshare-db`), create a secure database password, and click **Create new project**.
3. Wait a few minutes for the database to provision.
4. Go to the **SQL Editor** (the terminal icon on the left sidebar).
5. Click **New Query**.
6. Open the `supabase/schema.sql` file in this repository, copy its entire contents, and paste it into the SQL Editor.
7. Click **Run**. This will create all the necessary tables, indexes, security policies, and functions in your database.

## 2. Authentication Setup (Google)

PartShare uses Google Sign-In to authenticate users.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `partshare-auth`).
3. Go to **APIs & Services > OAuth consent screen**. 
   - Choose **External** and click Create.
   - Fill in the required fields (App name, User support email, Developer contact email).
   - Click Save and Continue through the scopes (default scopes are fine).
   - In the "Publishing status" section, click **Publish App** and set the consent screen to "In production".
4. Go to **APIs & Services > Credentials**.
   - Click **Create Credentials > OAuth client ID**.
   - Application type: **Web application**.
   - Under **Authorized redirect URIs**, you need to add your Supabase project's callback URL. You can find this in your Supabase Dashboard under **Authentication > URL Configuration > Site URL** (append `/auth/v1/callback` to the end, e.g., `https://[PROJECT_REF].supabase.co/auth/v1/callback`).
   - Click **Create**.
5. Copy the generated **Client ID** and **Client Secret**.
6. Go back to your Supabase Dashboard.
7. Navigate to **Authentication > Providers**.
8. Find **Google**, enable it, and paste your Client ID and Client Secret. Click Save.
9. Next, go to **Authentication > URL Configuration** in Supabase.
   - Set the **Site URL** to your production URL once you have it (e.g., `https://partshare.pages.dev`). 
   - Under **Redirect URLs**, add `http://localhost:5173` (for local development) and your production URL.

## 3. Environment Variables

1. In the root of this project, you will find a `.env.example` file.
2. Rename it to `.env` or make a copy named `.env`.
3. Fill in the required variables:
   - `VITE_SUPABASE_URL`: Find this in Supabase under **Project Settings > API > Project URL**.
   - `VITE_SUPABASE_ANON_KEY`: Find this in Supabase under **Project Settings > API > Project API keys** (use the `anon` / `public` key).

## 4. Deploying to Cloudflare Pages

1. Push this repository to your GitHub account.
2. Go to [Cloudflare Pages](https://pages.cloudflare.com/) and sign in.
3. Click **Create a project > Connect to Git**.
4. Select your `PartShare` repository.
5. Configure the build settings:
   - **Framework preset**: `None`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Scroll down to **Environment variables (advanced)** and add both:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Click **Save and Deploy**. Your site will be live on a `*.pages.dev` domain in a few minutes!

## 5. Free Tier Keep-Alive (cron-job.org)

Supabase pauses free tier projects after a week of inactivity. To prevent this, set up a simple free cron job:

1. Sign up for a free account at [cron-job.org](https://cron-job.org/).
2. Create a new cron job.
3. **Title**: PartShare Keep-Alive
4. **URL**: `YOUR_SUPABASE_URL/rest/v1/posts?select=id&limit=1`
   *(Replace YOUR_SUPABASE_URL with your actual Supabase URL)*
5. **Execution schedule**: Every 2 days
6. Click **Advanced settings**.
   - Go to the **Headers** tab.
   - Add a new header: Name = `apikey`, Value = `YOUR_SUPABASE_ANON_KEY`
7. Save the job. This will ping your database securely every two days.

## 6. Moderation (Reviewing and Deleting Reports)

If users report inappropriate posts, they are automatically hidden after 3 reports. To review them:
1. Go to your Supabase Dashboard.
2. Open the **Table Editor** and select the `reports` table to see why a post was reported.
3. Select the `posts` table and filter by `status = 'hidden'` to see hidden posts.
4. If you decide to remove a post entirely, you can delete its row in the `posts` table directly from the Table Editor.

## 7. Restricting Signups to Your University

By default, anyone with a Google account can join. To restrict signups to specific email domains (e.g., only students from your university):
1. Go to the Supabase **Table Editor**.
2. Select the `app_settings` table.
3. Find the row where the key is `allowed_email_domains`.
4. Edit the `value` column from `[]` to a JSON array of your allowed domains, e.g., `["university.edu", "student.university.edu"]`.
5. Save the row. The restriction applies instantly to all new profiles!

## 8. Monthly Backups

The Supabase free tier does not include daily automated backups. Once a month, you should:
1. Go to the Supabase **Table Editor**.
2. For each important table (`profiles`, `posts`), click the **Export** button in the top right.
3. Download and save the CSV files securely.
