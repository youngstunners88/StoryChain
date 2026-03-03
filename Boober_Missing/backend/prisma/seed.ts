import { PrismaClient, UserStatus, UserType, RideStatus, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@boober.taxi' },
    update: {},
    create: {
      email: 'admin@boober.taxi',
      phone: '+27123456789',
      name: 'Admin User',
      password: adminPassword,
      userType: UserType.ADMIN,
      isVerified: true,
      status: UserStatus.ACTIVE,
    },
  });
  console.log('Created admin user:', admin.email);

  // Create test passenger
  const passengerPassword = await bcrypt.hash('passenger123', 12);
  const passenger = await prisma.user.upsert({
    where: { email: 'passenger@test.com' },
    update: {},
    create: {
      email: 'passenger@test.com',
      phone: '+27123456790',
      name: 'Test Passenger',
      password: passengerPassword,
      userType: UserType.PASSENGER,
      isVerified: true,
      status: UserStatus.ACTIVE,
    },
  });
  console.log('Created passenger user:', passenger.email);

  // Create test driver
  const driverPassword = await bcrypt.hash('driver123', 12);
  const driver = await prisma.user.upsert({
    where: { email: 'driver@test.com' },
    update: {},
    create: {
      email: 'driver@test.com',
      phone: '+27123456791',
      name: 'Test Driver',
      password: driverPassword,
      userType: UserType.DRIVER,
      isVerified: true,
      status: UserStatus.ACTIVE,
      rating: 4.8,
    },
  });
  console.log('Created driver user:', driver.email);

  // Create driver's vehicle
  const vehicle = await prisma.vehicle.upsert({
    where: { driverId: driver.id },
    update: {},
    create: {
      driverId: driver.id,
      make: 'Toyota',
      model: 'Corolla',
      year: 2022,
      color: 'White',
      plateNumber: 'CA123456',
      vehicleType: 'SEDAN',
      capacity: 4,
    },
  });
  console.log('Created vehicle:', vehicle.plateNumber);

  // Create driver stats
  await prisma.driverStats.upsert({
    where: { driverId: driver.id },
    update: {},
    create: {
      driverId: driver.id,
      totalRides: 0,
      totalEarnings: 0,
      totalDistance: 0,
      rating: 4.8,
    },
  });

  // Create wallets
  await prisma.wallet.upsert({
    where: { userId: passenger.id },
    update: {},
    create: {
      userId: passenger.id,
      balance: 500,
    },
  });

  await prisma.wallet.upsert({
    where: { userId: driver.id },
    update: {},
    create: {
      userId: driver.id,
      balance: 0,
    },
  });

  // Create sample rides
  const sampleRides = [
    {
      passengerId: passenger.id,
      driverId: driver.id,
      pickupAddress: '123 Main Street, Johannesburg',
      pickupLatitude: -26.2041,
      pickupLongitude: 28.0473,
      dropoffAddress: '456 Park Avenue, Johannesburg',
      dropoffLatitude: -26.1951,
      dropoffLongitude: 28.0573,
      distance: 5.2,
      fare: 67,
      status: RideStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      passengerId: passenger.id,
      driverId: driver.id,
      pickupAddress: 'Sandton City Mall, Johannesburg',
      pickupLatitude: -26.1076,
      pickupLongitude: 28.0567,
      dropoffAddress: 'OR Tambo International Airport',
      dropoffLatitude: -26.1392,
      dropoffLongitude: 28.2460,
      distance: 21.5,
      fare: 285,
      status: RideStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  ];

  for (const ride of sampleRides) {
    await prisma.ride.create({ data: ride });
  }
  console.log('Created sample rides');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
