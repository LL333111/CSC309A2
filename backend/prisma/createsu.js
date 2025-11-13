/*
 * Complete this script so that it is able to add a superuser to the database
 * Usage example: 
 *   node prisma/createsu.js clive123 clive.su@mail.utoronto.ca SuperUser123!
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const args = process.argv;

if (args.length !== 5) {
  console.error("usage: node prisma/createsu.js utorid email password");
  process.exit(1);
}

const utorid = args[2];
const email = args[3];
const password = args[4];

async function createsu() {
  await prisma.user.create({ 
    data: {
      utorid,
      name: "",
      email,
      password,
      role: "superuser",
      createdAt: new Date().toISOString(),
      lastLogin: "2025-10-23T01:26:41.709Z",
      verified: true
    }
  });
}
createsu().finally(() => prisma.$disconnect());



