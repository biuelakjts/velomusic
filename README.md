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
with that account's username substituted. Do not let clients update their own
`role`.

Login and signup display only username and password fields. Supabase password
auth requires an email identifier internally, so the app uses a non-deliverable
`<username>@users.velomusic.invalid` alias; no email address is shown or needed
from the user. Turn off **Authentication > Providers > Email > Confirm email**
in the Supabase dashboard so signups receive a session immediately. Changing a
profile username also updates this internal alias through a database trigger.
Accounts created before username-only sign-in was installed still have their
original email as the Supabase Auth identifier. To migrate one of those
accounts, use the optional, commented username-alias update near the end of
`supabase.sql` in the SQL editor; this changes its Auth email to a
non-deliverable alias.

Avatar uploads belong under the authenticated user's UUID folder in the
`avatars` storage bucket (for example, `<user-uuid>/avatar.webp`); the bucket
accepts image files up to 5 MiB. Public and private playlist visibility is
enforced by row-level security, including access to playlist tracks.

## Admin console

The `/admin` page requires a signed-in account whose `profiles.role` is
`admin`. It supports user roles and suspensions, playlist visibility and
deletion, global app settings, and announcements. Access is checked using the
`is_admin()` database function and every operation remains protected by RLS.
Promote the first admin from the SQL editor using the username example at the
end of `supabase.sql`.

## App and deployment

The standalone Community panel has been removed. Supabase username/password
authentication now uses the app's existing `/login` route and preserves its
original login and signup screens. The signed-in profile/avatar control appears
at the top-right of the app. The account menu supports changing username,
display name, bio, and uploading an image file.
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