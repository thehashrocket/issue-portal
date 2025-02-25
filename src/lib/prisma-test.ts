import prisma from './prisma';

// Log the available properties on the Prisma client
console.log('Available properties on Prisma client:');
console.log(Object.keys(prisma));

// Log the available models using any type to bypass TypeScript checks
const prismaAny = prisma as any;
console.log('Checking for user model:');
console.log(!!prismaAny.user);
console.log('Checking for account model:');
console.log(!!prismaAny.account);
console.log('Checking for client model:');
console.log(!!prismaAny.client);
console.log('Checking for Client model:');
console.log(!!prismaAny.Client); 