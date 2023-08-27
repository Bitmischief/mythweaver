# MythWeaver

#### MythWeaver is a web application that helps Dungeon Masters' by auto-generating helpful and engaging content on the fly during your roleplaying sessions.

Check out the application at [app.mythweaver.co](https://app.mythweaver.co)

[![codecov](https://codecov.io/gh/Bitmischief/mythweaver/branch/main/graph/badge.svg?token=lDQ3i95Vfc)](https://codecov.io/gh/Bitmischief/mythweaver)

### DISCLAIMER

This repo is in the early stages of development and may be subject to drastic changes until we make it to v1.0.

## Getting Started

### Prerequisites

1. [Docker](https://docs.docker.com/get-docker/)
2. [Docker Compose](https://docs.docker.com/compose/install/)
3. (optional) [NodeJS](https://nodejs.org/en/download/)
4. (optional) [Yarn](https://classic.yarnpkg.com/en/docs/install/#mac-stable)

### Local Development

We are working toward providing better support for development Dockerfiles that will allow you to develop locally without installing any dependencies other than Docker and Docker Compose.
While you can certainly develop locally as is, in order to get the debugger working for the API, it can be beneficial to have NodeJS running locally. If you do this,
just make sure to run `yarn install` in the API directory to install the dependencies. Then run `yarn run dev` to start the API server.

### Database migrations

We are using [Prisma](https://www.prisma.io/) as our ORM. To run migrations, you will need to install the Prisma CLI. You can do this by running `yarn global add prisma` in the API directory.
To add a new migration, modify the `schema.prisma` file (see Prisma docs for more info) and run `prisma migrate dev --name <migration-name>` in the API directory. This will create a new migration
file in the `prisma/migrations` directory. You can then run `prisma migrate dev` to apply the migration to the database.

After creating new database migrations, you will need to have Prisma generate the new/updated types for the API. You can do this by running `prisma generate` in the API directory.

### Set UI environment variables

- Use example.env as a template to create a .env file in the root of the UI directory

### Set API environment variables

#### Local Development

- Use example.env as a template to create a .env file in the root of the API directory
- `DATABASE_URL`
  - In most cases this can stay unchanged, as the default value is set to the Postgres container that is created by Docker Compose
- `JWT_SECRET_KEY`
  - This should be a unique alphanumeric string that is used to sign the JWT tokens that are created by the API. This can be any string you want, but it should be kept secret.
  - We typically recommend using openssl to generate the keys like so: `openssl rand -base64 32`
- `JWT_REFRESH_SECRET_KEY`
  - Same as JWT_SECRET_KEY above, but used to sign the refresh tokens that are created by the API. **DO NOT USE THE SAME KEY FOR BOTH JWT_SECRET_KEY AND JWT_REFRESH_SECRET_KEY.**
- `GOOGLE_CLIENT_ID`
  - You will either need to create a Google OAuth2 client ID and secret, or use our "test" Google OAuth Client. You can do this by following the instructions [here](https://developers.google.com/identity/protocols/oauth2/openid-connect#appsetup).
  - The MythWeaver test Google OAuth Client ID is `676157131038-nt4ldb3psc6rnt6onhbd397trr6ut09c.apps.googleusercontent.com`
- `GOOGLE_CLIENT_SECRET`
  - You will either need to create a Google OAuth2 client ID and secret, or use our "test" Google OAuth Client. You can do this by following the instructions [here](https://developers.google.com/identity/protocols/oauth2/openid-connect#appsetup).
  - The MythWeaver test Google OAuth Client Secret is `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`
- `OPENAI_API_KEY`
  - You will need to create an OpenAI API key. You can do this by following the instructions [here](https://platform.openai.com/docs/api-reference/authentication).

#### Production deployments

Using the concepts above, we can set the environment variables for the API in a production environment. We recommend these environment variables for production systems be stored
in a secrets manager of your choosing.

### Run the application

- Make sure you've followed the steps above to ensure you have the proper environment variables set, and dependencies installed.
- Run `docker-compose up --build` to build the containers for the UI and API, and stand up our Postgres database as well.
- At first, your database will be entirely empty. Run `cd api && prisma migrate dev` to apply the migrations to the database. _(Make sure you have installed the Prisma CLI first)_
- You can also run `prisma db seed` to seed the database with some initial data. _(Make sure you have run `prisma migrate up` first)_. You may also need to install ts-node by running: `yarn global add ts-node`.
- The UI will be available at `localhost:3000`
- The API will be available at `localhost:8000`
- The database will be available at `localhost:5432`
