import prisma from './prisma';
import { PrismaClient } from '@prisma/client';

// Log the available properties on the Prisma client
console.log('Available properties on Prisma client:');
console.log(Object.keys(prisma));

// Log the available models using proper typing
const prismaTyped = prisma as PrismaClient;
console.log('Checking for user model:');
console.log(!!prismaTyped.user);
console.log('Checking for account model:');
console.log(!!prismaTyped.account);
console.log('Checking for client model:');
console.log(!!prismaTyped.client);
console.log('Checking for Client model:');
console.log(!!prismaTyped.client); // Changed to lowercase as that's the correct model name 