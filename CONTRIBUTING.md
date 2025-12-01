# Contributing

## Generally

- [Semantic Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- Rebasing only

## Running TTW

1. Create a `.env` in the root with these values

```bash
POSTGRES_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:5435/type_the_word'
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:1199"
GOOGLE_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
CROSSWAY_SECRET=""
NEXT_PUBLIC_FATHOM_ID=""
NEXT_PUBLIC_AXIOM_DATASET=type_the_word
NEXT_PUBLIC_AXIOM_TOKEN=""
SENTRY_AUTH_TOKEN=""
CONVERTKIT_API_KEY=""
CONVERTKIT_SUBSCRIBE_FORM_ID=""
DEPLOYED_URL="http://localhost:1199"
STRIPE_SECRET_KEY=""
```

This will allow you to load [Psalm 23](http://localhost:1199/passage/psalm_23) and [Gensis 1](http://localhost:1199/passage/genesis_1).

Reach out via email (josh@typetheword.site) or on [discord](https://discord.com/invite/a9eYv4sgWp) and if we hit it off I can give you the env for further work.

2. Install docker + container runtime + pnpm

Here is a how I startup the app

```bash
kill $(lsof -t -i:1199) || true && colima start --cpu 10 --memory 8 --disk 10 && docker compose --project-directory ./docker up -d && pnpm dev -p 1199
```
