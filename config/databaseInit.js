const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function disconnectDb() {
  await prisma.$disconnect();
}

module.exports = { prisma, disconnectDb };
