/*
 * If you need to initialize your database with some data, you may write a script
 * to do so here.
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// id        Int      @id @default(autoincrement())
// utorid    String   @unique
// name      String
// email     String   @unique
// birthday  String   @default("")
// role      RoleType @default(regular)
// points    Int      @default(0)
// createdAt String
// lastLogin String   @default("")
// verified  Boolean  @default(false)
// avatarUrl String   @default("")
// password  String   @default("")

// utorid: "shepard",
// name: "shepard chen",
// email: "shepard.chen@mail.utoronto.ca",
// birthday: "",
// role: "",
// points: ,
// createdAt: "",
// lastLogin: "",
// verified: ,
// avatarUrl: "",
async function seedData() {
  const mockUsers = [
    {
      utorid: "shepard",
      name: "shepard chen",
      email: "shepard.chen@mail.utoronto.ca",
      role: "manager",
      points: 100,
      createdAt: "2005-09-05T00:00:00.000Z",
      verified: true,
    },
    {
      utorid: "shaber1",
      name: "shaber chen",
      email: "shaber1.chen@mail.utoronto.ca",
      role: "regular",
      points: 7,
      createdAt: "2025-10-01T00:00:00.000Z",
      verified: false,
    },
    {
      utorid: "shaber2",
      name: "shaber chen",
      email: "shaber2.chen@mail.utoronto.ca",
      role: "regular",
      points: 12,
      createdAt: "2025-10-01T00:00:00.000Z",
      verified: false,
    },
    {
      utorid: "shaber3",
      name: "shaber chen",
      email: "shaber3.chen@mail.utoronto.ca",
      role: "cashier",
      points: 36,
      createdAt: "2025-10-01T00:00:00.000Z",
      verified: false,
    },
  ];

  for (const user of mockUsers) {
    await prisma.user.create({ data: user });
  }
}

seedData().finally(() => prisma.$disconnect());
