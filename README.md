# VeloMusic

## Supabase data setup

[`supabase.sql`](./supabase.sql) creates the profiles, follows, blocks,
playlists, saved tracks, user/global settings, announcements, avatar storage
bucket, and row-level security policies. Run it in the Supabase SQL editor for
the project before connecting an app client.

The Supabase project URL and **publishable** key can be used in browser code;
never put a `service_role` key in the client. Admin privileges are granted to
the `profiles.role = 'admin'` row only. Create the owner account first, then
run the commented profile-promotion statement at the end of `supabase.sql`
with that account's email substituted. Do not let clients update their own
`role`.

For password signup without confirmation email, turn off **Authentication >
Providers > Email > Confirm email** in the Supabase dashboard. This is an Auth
provider setting and cannot be changed by the database schema.

Avatar uploads belong under the authenticated user's UUID folder in the
`avatars` storage bucket (for example, `<user-uuid>/avatar.webp`); the bucket
accepts image files up to 5 MiB. Public and private playlist visibility is
enforced by row-level security, including access to playlist tracks.

## App and deployment

The standalone Community panel has been removed. Supabase email/password
authentication now uses the app's existing `/login` route, and the signed-in
profile/avatar control appears at the top-right of the app. The account menu
supports changing username, display name, bio, and uploading an image file.
The Supabase session is also written in the app's existing session format so
the app recognizes the signed-in state.

This checkout contains the built app but not its original `../main` source, so
this account integration is added as a small static script rather than changes
to the source React components.

The YouTube Music device sign-in now routes its TV/OAuth requests through the
existing Cloudflare Worker to avoid browser cross-origin failures. Deploy the
updated `worker.js` to that Worker and publish the updated static site together;
the site bridge uses the Worker URL configured in `workeradd.js`. Run the
project tests with `npm test`.