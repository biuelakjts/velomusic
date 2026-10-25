# VeloMusic

## YouTube Music sign-in

The YouTube Music device sign-in routes its TV/OAuth requests through the
existing Cloudflare Worker to avoid browser cross-origin failures. Deploy the
updated `worker.js` to that Worker and publish the updated static site together;
the site bridge uses the Worker URL configured in `workeradd.js`. Run the
project tests with `npm test`.
