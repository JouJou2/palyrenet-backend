# Palyrenet Backend

Backend API for Palyrenet - Social Learning Platform built with NestJS, Prisma, PostgreSQL, and Socket.io.

## Features

- 🔐 **Authentication** - JWT-based auth with bcrypt password hashing
- 📝 **Posts & Comments** - Social learning content management
- 💬 **Real-time Messaging** - WebSocket-based instant messaging
- 🔔 **Notifications** - Real-time notification system
- 📚 **Library Resources** - File management for educational materials
- 📝 **Exams System** - Quiz and exam functionality
- 🤝 **Collaborations** - Team collaboration features
- 🗄️ **PostgreSQL** - Robust relational database
- ⚡ **Redis** - Caching and session management

## Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Real-time**: Socket.io
- **Authentication**: JWT + Passport
- **Validation**: class-validator

## Prerequisites

- Node.js (v18 or higher)
- Docker & Docker Compose (for database)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Database Services

Start PostgreSQL and Redis using Docker:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

### 3. Environment Variables

Copy `.env.example` to `.env` and update if needed. Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens (change in production!)
- `REDIS_HOST` & `REDIS_PORT` - Redis configuration
- `FRONTEND_URL` - Your frontend URL for CORS

### 4. Run Database Migrations

Generate Prisma client and create database tables:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Start Development Server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get current user profile (requires JWT)

### Future Endpoints (to be implemented)

- `/posts` - CRUD operations for posts
- `/comments` - CRUD operations for comments
- `/messages` - Messaging system
- `/notifications` - Notification management
- `/library` - Library resources
- `/exams` - Exam management
- `/collaborations` - Collaboration features

## WebSocket Events

Connect to WebSocket at `ws://localhost:3001`

- `authenticate` - Authenticate user with userId
- `message` - Send/receive real-time messages
- `notification` - Receive real-time notifications

## Database Schema

The database includes models for:
- Users (with roles: STUDENT, TEACHER, ADMIN)
- Posts, Comments, Likes
- Messages
- Notifications
- Library Resources
- Exams & Exam Results
- Collaborations

See `prisma/schema.prisma` for full schema definition.

## Useful Commands

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Prisma commands
npx prisma studio          # Open Prisma Studio (database GUI)
npx prisma migrate dev     # Create new migration
npx prisma generate        # Generate Prisma client

# Docker commands
docker-compose up -d       # Start services
docker-compose down        # Stop services
docker-compose logs -f     # View logs
```

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── auth/              # Authentication module
│   ├── events/            # WebSocket gateway
│   ├── prisma/            # Prisma service
│   ├── app.module.ts      # Main app module
│   └── main.ts            # Application entry point
├── docker-compose.yml     # Docker services
└── .env                   # Environment variables
```

## Next Steps

To complete the backend, implement:

1. **Posts Module** - CRUD operations for posts with likes
2. **Comments Module** - Nested comments system
3. **Messages Module** - Direct messaging with real-time updates
4. **Notifications Module** - Push notifications for user activities
5. **Library Module** - File upload/download for resources
6. **Exams Module** - Quiz creation and taking functionality
7. **Collaborations Module** - Team project management
8. **File Upload** - Integration with AWS S3 or Cloudinary

## Security Notes

⚠️ **Important for Production:**

1. Change `JWT_SECRET` to a strong random value
2. Update database credentials
3. Enable HTTPS
4. Configure proper CORS settings
5. Set up rate limiting
6. Enable Helmet for security headers

---

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
