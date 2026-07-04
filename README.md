# MoonWalk Backend

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

Edit `backend/.env`:

```
PORT=4000
TEST_PORT=4001
DATABASE_URL="postgresql://<postgres username>:<postgres pass>@localhost:5432/moonwalk?schema=public"
SECRET_KEY="<any-random-string>"
JWT_EXPIRES_IN=7d
CORS_ORIGIN="http://localhost:3000"
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM=
```

`SMTP_*` is only needed for order-confirmation emails -- leave `SMTP_HOST` empty to skip sending in local dev.

## 3. Run migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

Applies every existing migration file in `prisma/migrations/` to create the database tables from `prisma/schema.prisma`. Use `npx prisma migrate dev` instead only when you're actively changing the schema yourself and need Prisma to generate a *new* migration file — `migrate dev` can reset the database to resolve drift, so it's not safe to run against a fresh/shared database that already has migration files in the repo.

## 4. Start the server

```bash
npm run dev
```

Runs `app.js` under nodemon on `PORT` (default `4000`). Use `npm start` to run it without nodemon.

## 5. Run tests

```bash
npm test
```

Runs the Jest suite (`tests/order.api.test.js`) against `app.js` via supertest, using the same database.

## Optional: quick start without your own database

If you don't have pgAdmin (or any other Postgres client) set up locally, you can skip creating your own database and use an already-seeded shared demo database instead. Create a `.env` file in the `backend/` root with the following values:

```
DATABASE_URL=postgresql://neondb_owner:npg_ytf3bUl0oIDG@ep-shy-field-ad3tzt8n-pooler.c-2.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=abcdef799021@gmail.com
SMTP_PASS=aitsbetzfamytudk
MAIL_FROM=abcdef799021@gmail.com
CORS_ORIGIN="http://localhost:3000"
FRONTEND_URL="http://localhost:3000"
SECRET_KEY="15d174a47055e771b4981c83b9a753c771b7149a56bf8fbeb20dac1caa1dd212"
```

`CORS_ORIGIN` and `FRONTEND_URL` above are set to the local frontend URL (`http://localhost:3000`) — change these if your frontend runs somewhere else.

This database already has a superuser account. Log in with:

```
email: super@gmail.com
password: 1234
```

See `frontend/README.md` for the matching frontend `.env` setup to run against this database.
