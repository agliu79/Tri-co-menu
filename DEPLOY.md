# Deploying Tri-Co Eatmaxxing with a real database

GitHub Pages hosts the website. Supabase (free tier) stores everything students share and handles sign-in with emailed codes.

What goes where:

| Data | Where it's stored | Who can see it |
| --- | --- | --- |
| Reviews, ratings, review photos, Rate My Plate posts, likes, comments, reports, name, profile photo | `contrib` table, one row per student | Every signed-in student |
| Profile and dining preferences, favorites, calendar, dish reminders, Fuel log | `private_docs` table | Only that student |
| Uploaded photos | `photos` storage bucket | Anyone with the link |
| Menus, hours, nutrition | Built into `index.html` | Everyone |

## 1. Create the database (about 10 minutes)

1. Sign up at https://supabase.com and click **New project**. Pick any name and password, and a US East region.
2. Open **SQL Editor** → **New query**. Paste all of `supabase_setup.sql`, then click **Run**. It creates the tables and security rules, the Tri-Co-only email check, live updates and photo storage.
3. Open **Authentication** → **Emails** → **Templates** → **Magic Link**. Replace the body with:
   ```html
   <h2>Your Tri-Co Eatmaxxing code</h2>
   <p>Enter this code to sign in: <strong>{{ .Token }}</strong></p>
   ```
   Click **Save**. Without this, students get a link instead of a code.
4. Set up email sending in **Authentication** → **Emails** → **SMTP Settings**. Supabase's built-in sender only emails people on your Supabase team and allows only 2 emails an hour. Connect a free provider such as Resend or Brevo there, and real students can get codes. For a quick demo, you can skip this and instead invite your teammates to your Supabase organization (**Organization settings → Team**). Their addresses will then work.
5. Open **Project Settings** → **API Keys**. Copy the **Project URL** and the **publishable key** (`sb_publishable_...`). The publishable key is safe to put in a public repo, because the security rules from step 2 decide what it can do. Never copy the **secret** key into the site.

## 2. Connect the site

Open `config.js` and fill in:

```js
window.EATMAXXING_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  supabaseKey: "sb_publishable_...",
  guestEmails: { "judge@example.com": "H" }   // optional, see step 4
};
```

## 3. Put it on GitHub Pages

1. Create a new repository on github.com and upload everything in this folder, or use `git push`.
2. In the repo, open **Settings** → **Pages**. Set **Branch** to `main` and the folder to `/(root)`, then click **Save**.
3. After a minute the site is live at `https://YOUR-USERNAME.github.io/REPO-NAME/`.
4. In Supabase, open **Authentication** → **URL Configuration** and set **Site URL** to that address.

## 4. Before the demo

- **Make yourself an admin** so you can delete anyone's posts. Sign up on the site, then run this in the SQL Editor:
  `insert into public.admins (uid) select id from auth.users where email = 'you@haverford.edu';`
- **Let judges in.** Judges don't have college emails. For each judge, run
  `insert into public.allowed_emails (email) values ('judge@example.com');`
  and add the same address to `guestEmails` in `config.js`, with the college they should land on (`"B"`, `"H"` or `"S"`).
- **Test with two accounts:** post a plate from one and like it from the other.
- **See your data** in Supabase under **Table Editor**: `contrib`, `private_docs`, and **Storage → photos**.

## How it works

- `config.js` turns the database on. With it blank, the site falls back to saving in each browser, the same as opening the file locally.
- Sign-up checks the email domain in the browser, then Supabase emails a code. The database itself refuses any account that isn't a Tri-Co address or on `allowed_emails`, so the check can't be skipped by editing the page.
- Students can only change their own row. Admins can edit any row (for deletions), and everyone signed in can read shared content.
- Signing in on a new device restores your profile, preferences, favorites, calendar and Fuel log.
