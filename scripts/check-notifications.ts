import prisma from '../src/lib/prisma';

async function checkNotifications() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            email: true
          }
        },
        issue: {
          select: {
            title: true
          }
        }
      }
    });

    console.log('All notifications:', JSON.stringify(notifications, null, 2));
  } catch (error) {
    console.error('Error checking notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotifications(); 