# VeloMusic

## YouTube Music sign-in

The YouTube Music device sign-in routes its TV/OAuth requests through the
app's same-origin Node server, avoiding browser cross-origin failures and the
unavailable `/youtube-auth/*` routes on the old Worker deployment. The existing
Cloudflare Worker remains configured for YouTube API and media proxy traffic.
Deploy the Node web service described in `render.yaml` and run tests with
`npm test`.
