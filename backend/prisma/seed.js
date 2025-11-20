/*
 * If you need to initialize your database with some data, you may write a script
 * to do so here.
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedData() {
  const mockUsers = [
    {
      utorid: "super001",
      name: "Mock user 000",
      email: "mock.000@mail.utoronto.ca",
      birthday: "2005-01-01",
      role: "superuser",
      points: 1000,
      createdAt: "2010-01-01T00:00:00.000Z",
      lastLogin: "2011-01-01T00:00:00.000Z",
      verified: true,
      password: "123456cC!",
      suspicious: false,
    },
    {
      utorid: "mana001",
      name: "Mock user 001",
      email: "mock.001@mail.utoronto.ca",
      birthday: "2005-02-03",
      role: "manager",
      points: 500,
      createdAt: "2011-05-02T00:00:00.000Z",
      lastLogin: "2011-08-01T00:00:00.000Z",
      verified: true,
      password: "123456cC!",
      suspicious: false,
    },
    {
      utorid: "mana002",
      name: "Mock user 002",
      email: "mock.002@mail.utoronto.ca",
      birthday: "2005-03-04",
      role: "manager",
      points: 500,
      createdAt: "2011-05-21T00:00:00.000Z",
      lastLogin: "2011-08-01T00:00:00.000Z",
      verified: true,
      password: "123456cC!",
      suspicious: false,
    },
    {
      utorid: "cash001",
      name: "Mock user 003",
      email: "mock.003@mail.utoronto.ca",
      birthday: "2005-02-03",
      role: "cashier",
      points: 250,
      createdAt: "2012-01-02T00:00:00.000Z",
      lastLogin: "2013-08-01T00:00:00.000Z",
      verified: true,
      password: "123456cC!",
      suspicious: false,
    },
    {
      utorid: "cash002",
      name: "Mock user 004",
      email: "mock.004@mail.utoronto.ca",
      birthday: "2005-02-03",
      role: "cashier",
      points: 250,
      createdAt: "2012-03-04T00:00:00.000Z",
      lastLogin: "2013-08-01T00:00:00.000Z",
      verified: true,
      password: "123456cC!",
      suspicious: false,
    },
    {
      utorid: "cash003",
      name: "Mock user 005",
      email: "mock.005@mail.utoronto.ca",
      birthday: "2005-02-03",
      role: "cashier",
      points: 250,
      createdAt: "2012-05-06T00:00:00.000Z",
      lastLogin: "2013-08-01T00:00:00.000Z",
      verified: true,
      suspicious: true,
    },
    {
      utorid: "regul001",
      name: "Mock user 006",
      email: "mock.006@mail.utoronto.ca",
      birthday: "2005-02-03",
      role: "regular",
      points: 1000,
      createdAt: "2012-05-06T00:00:00.000Z",
      lastLogin: "2013-08-01T00:00:00.000Z",
      verified: true,
      password: "123456cC!",
      suspicious: false,
    },
    {
      utorid: "regul002",
      name: "Mock user 007",
      email: "mock.007@mail.utoronto.ca",
      birthday: "2005-02-03",
      role: "regular",
      points: 750,
      createdAt: "2012-05-06T00:00:00.000Z",
      lastLogin: "2013-08-01T00:00:00.000Z",
      verified: true,
      password: "123456cC!",
      suspicious: false,
    },
    {
      utorid: "regul003",
      name: "Mock user 008",
      email: "mock.008@mail.utoronto.ca",
      birthday: "2005-02-03",
      role: "regular",
      points: 500,
      createdAt: "2012-05-06T00:00:00.000Z",
      lastLogin: "2013-08-01T00:00:00.000Z",
      verified: false,
      suspicious: false,
    },
    {
      utorid: "regul004",
      name: "Mock user 009",
      email: "mock.009@mail.utoronto.ca",
      birthday: "2005-02-03",
      role: "regular",
      points: 250,
      createdAt: "2012-05-06T00:00:00.000Z",
      lastLogin: "2013-08-01T00:00:00.000Z",
      verified: false,
      suspicious: false,
    },
  ];
  const mockPromotions = [
    {
      "name": "Mock Promotion Automatic 1",
      "description": "A Mock Promotion - ended",
      "type": "automatic",
      "startTime": "2025-11-01T00:00:00.000+08:00",
      "endTime": "2025-11-08T00:00:00.000+08:00",
      "minSpending": 10,
      "rate": 0.1,
      "points": 100,
    },
    {
      "name": "Mock Promotion Automatic 2",
      "description": "A Mock Promotion - active",
      "type": "automatic",
      "startTime": "2025-11-15T00:00:00.000+08:00",
      "endTime": "2025-12-30T00:00:00.000+08:00",
      "minSpending": null,
      "rate": 0.15,
      "points": 100,
    },
    {
      "name": "Mock Promotion Automatic 3",
      "description": "A Mock Promotion - upcoming",
      "type": "automatic",
      "startTime": "2026-09-01T00:00:00.000+08:00",
      "endTime": "2026-12-08T00:00:00.000+08:00",
      "minSpending": 100,
      "rate": 0.9,
      "points": 100,
    },
    {
      "name": "Mock Promotion Automatic 4",
      "description": "A Mock Promotion - ended",
      "type": "one-time",
      "startTime": "2025-11-01T00:00:00.000+08:00",
      "endTime": "2025-11-08T00:00:00.000+08:00",
      "minSpending": 10,
      "rate": 0.1,
      "points": 100,
    },
    {
      "name": "Mock Promotion Automatic 5",
      "description": "A Mock Promotion - active",
      "type": "one-time",
      "startTime": "2025-11-15T00:00:00.000+08:00",
      "endTime": "2025-12-30T00:00:00.000+08:00",
      "minSpending": null,
      "rate": 0.15,
      "points": 100,
    },
    {
      "name": "Mock Promotion Automatic 6",
      "description": "A Mock Promotion - upcoming",
      "type": "one-time",
      "startTime": "2026-09-01T00:00:00.000+08:00",
      "endTime": "2026-12-08T00:00:00.000+08:00",
      "minSpending": 100,
      "rate": 0.9,
      "points": 100,
    }
  ];
  // user
  for (const user of mockUsers) {
    await prisma.user.create({ data: user });
  }
  // promotion
  for (const promotion of mockPromotions) {
    let result = await prisma.promotion.create({ data: promotion });
    const users = await prisma.user.findMany();
    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          promotions: {
            connect: { id: result.id }
          }
        }
      });
    }
  }

  const mockTransactionsSuper = [
    {
      type: "transfer",
      remark: "super001 -> regul001",
      createdBy: "super001",
      amount: 10,
      relatedId: 7,
      sender: "super001",
      recipient: "regul001",
      sent: 10,
    },
    {
      type: "transfer",
      remark: "super001 -> mana001",
      createdBy: "super001",
      amount: 10,
      relatedId: 2,
      sender: "super001",
      recipient: "mana001",
      sent: 10,
    },
    {
      type: "redemption",
      remark: "super001 redemption - processed",
      utorid: "super001",
      createdBy: "super001",
      amount: 10,
      relatedId: 2,
      processed: true,
      processedBy: "mana001",
      redeemed: 10,
    },
    {
      type: "redemption",
      remark: "super001 redemption 1 - unprocessed",
      utorid: "super001",
      createdBy: "super001",
      amount: 11,
      processed: false,
    },
    {
      type: "redemption",
      remark: "super001 redemption 2 - unprocessed",
      utorid: "super001",
      createdBy: "super001",
      amount: 12,
      processed: false,
    },
    {
      type: "redemption",
      remark: "super001 redemption 3 - unprocessed",
      utorid: "super001",
      createdBy: "super001",
      amount: 13,
      processed: false,
    },
    {
      type: "redemption",
      remark: "super001 redemption 4 - unprocessed",
      utorid: "super001",
      createdBy: "super001",
      amount: 14,
      processed: false,
    },
    {
      type: "redemption",
      remark: "super001 redemption 5 - unprocessed",
      utorid: "super001",
      createdBy: "super001",
      amount: 15,
      processed: false,
    },
    {
      type: "redemption",
      remark: "super001 redemption 6 - unprocessed",
      utorid: "super001",
      createdBy: "super001",
      amount: 16,
      processed: false,
    },
    {
      "utorid": "super001",
      "type": "purchase",
      "spent": 100,
      "remark": "super001 purchase without promotion",
      "createdBy": "mana001",
      "amount": 400,
      "earned": 400
    },
    {
      "utorid": "super001",
      "type": "purchase",
      "spent": 100,
      "remark": "super001 purchase without promotion with adjustment",
      "createdBy": "mana001",
      "amount": 400,
      "earned": 400,
    },
    {
      "utorid": "super001",
      "type": "adjustment",
      "amount": -100,
      "relatedId": 11,
      "remark": "super001 adjustment to id 11 purchase",
      "createdBy": "mana001",
    },
  ];
  const mockTransactionsSuperP2 = [{
    "utorid": "super001",
    "type": "purchase",
    "spent": 100.1,
    "remark": "super001 purchase with promotion 2",
    "createdBy": "mana001",
    "amount": 2002,
    "earned": 2002,
  },
  {
    "utorid": "super001",
    "type": "purchase",
    "spent": 100.1,
    "remark": "super001 purchase with promotion 2 with adjustment",
    "createdBy": "mana001",
    "amount": 2002,
    "earned": 2002
  },
  {
    "utorid": "super001",
    "type": "adjustment",
    "amount": -100,
    "relatedId": 14,
    "remark": "super001 adjustment to id 14 purchase that with promotion 2",
    "createdBy": "mana001",
  },
  ];
  const mockTransactionsMana = [
    {
      type: "transfer",
      remark: "super001 -> mana001",
      createdBy: "super001",
      amount: 10,
      relatedId: 1,
      sender: "super001",
      recipient: "mana001",
      sent: 10,
    },
  ];
  const mockTransactionsRegul = [
    {
      type: "transfer",
      remark: "super001 -> regul001",
      createdBy: "super001",
      amount: 10,
      relatedId: 1,
      sender: "super001",
      recipient: "regul001",
      sent: 10,
    },
  ];
  // transactions
  // super001
  for (const transaction of mockTransactionsSuper) {
    let created = await prisma.transaction.create({ data: transaction });
    await prisma.user.update({
      where: { id: 1 },
      data: {
        pastTransactions: { connect: { id: created.id } }
      }
    });
  }
  // with promotion 2
  for (const transaction of mockTransactionsSuperP2) {
    let created = await prisma.transaction.create({ data: transaction });
    await prisma.user.update({
      where: { id: 1 },
      data: {
        pastTransactions: { connect: { id: created.id } }
      }
    });
    await prisma.transaction.update({
      where: { id: created.id },
      data: {
        promotionIds: { connect: { id: 2 } }
      }
    });
  }
  // mana001
  for (const transaction of mockTransactionsMana) {
    let created = await prisma.transaction.create({ data: transaction });
    await prisma.user.update({
      where: { id: 2 },
      data: {
        pastTransactions: { connect: { id: created.id } }
      }
    });
  }
  // regul001
  for (const transaction of mockTransactionsRegul) {
    let created = await prisma.transaction.create({ data: transaction });
    await prisma.user.update({
      where: { id: 7 },
      data: {
        pastTransactions: { connect: { id: created.id } }
      }
    });
  }
  const mockEvents = [
    {
      name: "Mock Event 1",
      description: "published ended event",
      location: "BA1060",
      startTime: "2025-09-01T00:00:00Z",
      endTime: "2025-10-01T00:00:00Z",
      pointsRemain: 0,
      pointsAwarded: 0,
      published: true,
      capacity: null,
    },
    {
      name: "Mock Event 2",
      description: "unpublished ended event",
      location: "BA1060",
      startTime: "2025-09-01T00:00:00Z",
      endTime: "2025-10-01T00:00:00Z",
      pointsRemain: 0,
      pointsAwarded: 0,
      published: false,
      capacity: 150,
    },
    {
      name: "Mock Event 3",
      description: "published active event",
      location: "BA1060",
      startTime: "2025-09-01T00:00:00Z",
      endTime: "2026-10-01T00:00:00Z",
      pointsRemain: 1000,
      pointsAwarded: 0,
      published: true,
      capacity: null,
    },
    {
      name: "Mock Event 4",
      description: "unpublished active event",
      location: "BA1060",
      startTime: "2025-09-01T00:00:00Z",
      endTime: "2026-10-01T00:00:00Z",
      pointsRemain: 1500,
      pointsAwarded: 0,
      published: false,
      capacity: 150,
    },
    {
      name: "Mock Event 5",
      description: "published upcoming event",
      location: "BA1060",
      startTime: "2026-11-21T00:00:00Z",
      endTime: "2026-12-30T00:00:00Z",
      pointsRemain: 1000,
      pointsAwarded: 0,
      published: true,
      capacity: null,
    },
    {
      name: "Mock Event 6",
      description: "unpublished upcoming event",
      location: "BA1060",
      startTime: "2026-11-21T00:00:00Z",
      endTime: "2026-12-30T00:00:00Z",
      pointsRemain: 1500,
      pointsAwarded: 0,
      published: false,
      capacity: 150,
    },
  ];
  // events
  // no guest no organizer
  for (const event of mockEvents) {
    await prisma.event.create({ data: event });
  }
  // with guest with organizer
  for (const event of mockEvents) {
    let created = await prisma.event.create({ data: event });
    await prisma.event.update({
      where: { id: created.id },
      data: {
        organizers: {
          connect: [
            { id: 1 },
            { id: 2 },
            { id: 4 },
            { id: 7 },
          ]
        },
        guests: {
          connect: [
            { id: 3 },
            { id: 5 },
            { id: 9 },
            { id: 10 },
          ]
        },
      }
    });
  }
}

seedData().finally(() => prisma.$disconnect());
