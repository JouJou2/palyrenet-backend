// Script to clean blob URLs from database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanBlobUrls() {
  try {
    console.log('Cleaning blob URLs from database...');
    
    // Update users with blob URLs in avatarUrl
    const avatarResult = await prisma.user.updateMany({
      where: {
        avatarUrl: {
          startsWith: 'blob:'
        }
      },
      data: {
        avatarUrl: null
      }
    });
    
    console.log(`Cleaned ${avatarResult.count} avatar blob URLs`);
    
    // Update users with blob URLs in coverUrl
    const coverResult = await prisma.user.updateMany({
      where: {
        coverUrl: {
          startsWith: 'blob:'
        }
      },
      data: {
        coverUrl: null
      }
    });
    
    console.log(`Cleaned ${coverResult.count} cover blob URLs`);
    console.log('Done!');
  } catch (error) {
    console.error('Error cleaning blob URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanBlobUrls();
