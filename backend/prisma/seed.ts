import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Development-only default password for local environment testing
const DEV_DEFAULT_PASSWORD = process.env.DEV_SEED_PASSWORD || 'Password@123'

interface SeedUserDefinition {
  name: string
  email: string
  role: Role
  department: string
}

const seedUsers: SeedUserDefinition[] = [
  {
    name: 'Aditi Sharma',
    email: 'employee@prachay.com',
    role: Role.EMPLOYEE,
    department: 'Engineering',
  },
  {
    name: 'Rajesh Mehta',
    email: 'director@prachay.com',
    role: Role.DIRECTOR,
    department: 'Executive Leadership',
  },
  {
    name: 'Suresh Patel',
    email: 'accounts@prachay.com',
    role: Role.ACCOUNTS,
    department: 'Finance & Accounts',
  },
]

async function main() {
  console.log('[Seed] Checking test accounts in expense_voucher_db...')

  const passwordHash = await bcrypt.hash(DEV_DEFAULT_PASSWORD, 10)

  for (const userDef of seedUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: userDef.email },
    })

    if (existing) {
      console.log(`[Seed] User ${userDef.email} already exists (skipping).`)
    } else {
      await prisma.user.create({
        data: {
          name: userDef.name,
          email: userDef.email,
          passwordHash,
          role: userDef.role,
          department: userDef.department,
        },
      })
      console.log(`[Seed] Created test user: ${userDef.email} [${userDef.role}]`)
    }
  }

  console.log('[Seed] Account check complete.')
}

main()
  .catch((e) => {
    console.error('[Seed] Error provisioning test users:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
