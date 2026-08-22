import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
  console.log('Seeding...');
  const ownerHash = await bcrypt.hash('owner123', 10);
  const operatorHash = await bcrypt.hash('operator123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({ where: { phone: '+919000000001' }, update: {}, create: { name: 'Sitaram Owner', phone: '+919000000001', email: 'owner@sitaram.co.in', passwordHash: ownerHash, role: 'OWNER', status: 'ACTIVE' } });
  await prisma.user.upsert({ where: { phone: '+919000000002' }, update: {}, create: { name: 'Site Admin', phone: '+919000000002', email: 'admin@sitaram.co.in', passwordHash: adminHash, role: 'ADMIN', status: 'ACTIVE' } });
  const opUsers = [
    { name: 'Ramesh Kumar', phone: '+919876543210', email: 'ramesh@sitaram.co.in' },
    { name: 'Sunil Yadav', phone: '+919876543211', email: 'sunil@sitaram.co.in' },
    { name: 'Manoj Patel', phone: '+919876543212', email: 'manoj@sitaram.co.in' },
    { name: 'Amit Sharma', phone: '+919876543213', email: 'amit@sitaram.co.in' },
  ];
  for (const u of opUsers) {
    const user = await prisma.user.upsert({ where: { phone: u.phone }, update: {}, create: { name: u.name, phone: u.phone, email: u.email, passwordHash: operatorHash, role: 'OPERATOR', status: 'ACTIVE' } });
    await prisma.operator.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, licenseNumber: 'MP-2021-' + Math.floor(10000+Math.random()*90000), joiningDate: new Date('2023-01-15'), salaryType: 'MONTHLY', salaryAmount: 22000, status: 'ACTIVE' } });
  }
  const machines = [
    { name: 'JCB 3DX', registrationNumber: 'MP15AB1234', machineType: 'JCB', manufacturer: 'JCB', model: '3DX Xtra', currentHourMeter: 4921.5, expectedFuelEfficiency: 6.0, status: 'ACTIVE' },
    { name: 'CAT 320 Excavator', registrationNumber: 'MP15AB7821', machineType: 'EXCAVATOR', manufacturer: 'Caterpillar', model: '320', currentHourMeter: 8421.2, expectedFuelEfficiency: 14.0, status: 'IDLE' },
    { name: 'Tata Hitachi EX200', registrationNumber: 'MP15AC1132', machineType: 'EXCAVATOR', manufacturer: 'Tata Hitachi', model: 'EX200', currentHourMeter: 6231.8, status: 'UNDER_MAINTENANCE' },
  ];
  for (const m of machines) { await prisma.machine.upsert({ where: { registrationNumber: m.registrationNumber }, update: {}, create: m }); }
  await prisma.jobSite.upsert({ where: { id: 'site-abc-001' }, update: {}, create: { id: 'site-abc-001', name: 'ABC Highway Construction - Pkg 03', clientName: 'ABC Constructions', clientPhone: '+91 98765 00000', address: 'Bhopal Bypass, MP', status: 'ACTIVE', billingType: 'HOURLY', rate: 1800 } });
  console.log('Seed done');
}
main().then(()=>prisma.$disconnect()).catch(e=>{console.error(e); prisma.$disconnect(); process.exit(1)});
