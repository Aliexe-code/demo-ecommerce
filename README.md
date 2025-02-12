<p align="center">
  <a href="http://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
</p>

<p align="center">
  A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.
</p>

<p align="center">
  <a href="https://www.npmjs.com/~nestjscore" target="_blank">
    <img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" />
  </a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank">
    <img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" />
  </a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank">
    <img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" />
  </a>
  <a href="https://circleci.com/gh/nestjs/nest" target="_blank">
    <img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" />
  </a>
  <a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank">
    <img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master" alt="Coverage" />
  </a>
  <a href="https://discord.gg/G7Qnnhy" target="_blank">
    <img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/>
  </a>
  <a href="https://twitter.com/nestframework" target="_blank">
    <img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter">
  </a>
</p>

# This repository demonstrates a NestJS application built with [Bun](https://bun.sh/) and Prisma. It includes a **Users** feature that provides REST endpoints for creating, retrieving, updating, and deleting users, along with comprehensive unit and end-to-end tests.

# Optimized NestJS App

This is a NestJS application optimized for performance and scalability. It uses:
- **Prisma** for database access.
- **Neon PostgreSQL** as the database.
- **Bun** as the runtime.
- **SWC** for fast builds.

## Features
- CRUD operations for users.
- Logging with `nestjs-pino`.
- Environment variable management with `@nestjs/config`.

## Prerequisites
- [Bun](https://bun.sh/) (v1.0.0 or higher)
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Neon PostgreSQL](https://neon.tech/) account

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Linxier-node/Optimized-nestjs.git
   cd Optimized-nestjs
    bun install
     cp .env.example .env
   bunx prisma migrate dev --name init
    bun run start:dev
2.For testing check package.json file

    bun run test
    bun run test:e2e
    ```
    
  


