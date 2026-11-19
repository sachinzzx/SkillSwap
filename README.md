# SkillSwap

SkillSwap is a peer-to-peer learning platform where users earn **SkillCoins** by teaching skills and spend coins to learn from other users. It also supports direct 1-to-1 skill exchanges through reciprocal matching.

## SkillCoin economy

- New users receive a 50-SkillCoin welcome balance.
- Session prices are calculated from the teacher's hourly coin rate and session duration.
- Completing a session atomically transfers coins from the learner to the teacher.
- ACID transactions prevent insufficient-funds races and double-spending.
- CoinTransaction records provide the debit/credit history for every session.

## Architecture

```text
                  +--------------------+
                  |  Express / Node.js |
                  |  REST API          |
                  +---------+----------+
                            |
             +--------------+---------------+
             |                              |
     +-------v--------+             +-------v--------+
     |  Prisma ORM    |             | Mongoose ODM   |
     |  PostgreSQL    |             | MongoDB        |
     |                |             |                |
     | users, skills  |             | chats, notes   |
     | sessions, coins|             | activity logs  |
     | reviews        |             |                |
     +----------------+             +----------------+
                            |
                    +-------v-------+
                    | SkillCoin     |
                    | Economy       |
                    +---------------+
```

## Tech stack

- Node.js and Express
- Plain JavaScript with CommonJS
- PostgreSQL and Prisma ORM
- MongoDB and Mongoose
- JWT access/refresh authentication and bcrypt
- Nodemon for local development
- Node `fs/promises` for non-blocking receipt and log files

## Setup

Requires Node.js 18+, PostgreSQL, and MongoDB.

```bash
git clone <repository-url>
cd SkillSwap
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Update `.env` with real PostgreSQL, MongoDB, and JWT secret values before starting.

To create the public teacher directory SQL view:

```bash
npx prisma db execute --file prisma/views.sql --schema prisma/schema.prisma
```

## API endpoints

| Method | Route | Auth | Role |
|---|---|---:|---|
| GET | `/` | No | - |
| GET | `/api/health` | No | - |
| POST | `/api/v1/auth/register` | No | - |
| POST | `/api/v1/auth/login` | No | - |
| POST | `/api/v1/auth/refresh` | No | - |
| POST | `/api/v1/auth/logout` | Yes | - |
| GET | `/api/v1/skills` | No | - |
| GET | `/api/v1/skills/:id` | No | - |
| POST | `/api/v1/skills` | Yes | ADMIN |
| DELETE | `/api/v1/skills/:id` | Yes | ADMIN |
| GET | `/api/v1/categories` | No | - |
| POST | `/api/v1/categories` | Yes | ADMIN |
| POST | `/api/v1/users/skills` | Yes | - |
| DELETE | `/api/v1/users/skills/:id` | Yes | - |
| GET | `/api/v1/users/me/skills` | Yes | - |
| GET | `/api/v1/users/me` | Yes | - |
| GET | `/api/v1/users/:id/profile` | No | - |
| GET | `/api/v1/match/teachers` | Yes | - |
| GET | `/api/v1/match/direct-swap` | Yes | - |
| POST | `/api/v1/sessions` | Yes | - |
| GET | `/api/v1/sessions/my` | Yes | - |
| PATCH | `/api/v1/sessions/:id/complete` | Yes | Teacher or ADMIN |
| PATCH | `/api/v1/sessions/:id/cancel` | Yes | Teacher or learner |
| GET | `/api/v1/sessions/:id/receipt` | Yes | Teacher or learner |
| GET | `/api/v1/coins/balance` | Yes | - |
| GET | `/api/v1/coins/history` | Yes | - |
| POST | `/api/v1/reviews` | Yes | Learner |
| GET | `/api/v1/reviews/user/:id` | No | - |
| GET | `/api/v1/analytics/top-mentors` | No | - |
| GET | `/api/v1/analytics/budget-teachers` | Yes | ADMIN |
| GET | `/api/v1/analytics/popular-categories` | Yes | ADMIN |
| GET | `/api/v1/analytics/economy` | Yes | ADMIN |
| GET | `/api/v1/analytics/demand-gap` | Yes | ADMIN |
| GET | `/api/v1/analytics/trending-tags` | No | - |
| POST | `/api/v1/chat/:userId/message` | Yes | - |
| GET | `/api/v1/chat/:userId` | Yes | - |
| PATCH | `/api/v1/chat/:userId/read` | Yes | - |
| GET | `/api/v1/chat/unread/count` | Yes | - |
| POST | `/api/v1/notes/:sessionId` | Yes | Session participant |
| GET | `/api/v1/notes/:sessionId` | Yes | Session participant |
| POST | `/api/v1/notes/:sessionId/comments` | Yes | Session participant |
| POST | `/api/v1/notes/:sessionId/resources` | Yes | Session participant |
| GET | `/api/v1/notes/search?tags=a,b` | Yes | - |

## SQL concepts

- `UserSkill` self-join for reciprocal direct-skill swaps
- CTE aggregation for top-mentor analytics
- Correlated subqueries for budget teachers
- `public_teacher_directory` SQL view
- Indexes on user skills, sessions, and coin transaction foreign keys
- Interactive Prisma ACID transactions for coin transfers and session completion

## MongoDB concepts

- Embedded chat messages and session-note comments/resources
- `$push` for appending conversations, comments, and resources
- `$in` for tag searches
- Aggregation pipelines with `$match`, `$unwind`, `$group`, `$sort`, and `$limit`
- Array filters for marking individual embedded messages as read
- `$lt` and `$expr` for old-chat cleanup

## Production deployment

### Railway or Render

1. Provision PostgreSQL and MongoDB databases.
2. Set the repository root as the service root.
3. Configure these environment variables:
   - `PORT`
   - `DATABASE_URL`
   - `MONGO_URI`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `NODE_ENV=production`
4. Build command:

```bash
npm install
npx prisma generate
```

5. Start command:

```bash
npm start
```

Run migrations and the seed from a one-off deployment or administrative shell:

```bash
npx prisma migrate deploy
npx prisma db seed
npx prisma db execute --file prisma/views.sql --schema prisma/schema.prisma
```
