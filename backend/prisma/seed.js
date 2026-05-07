import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ROLE_NAMES = {
  ADMIN: 'admin',
  USER: 'user'
}

const PERMISSION_NAMES = [
  'product:write',
  'product:delete',
  'order:manage'
]

async function resetRbacData() {
  await prisma.rolePermission.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.user.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.role.deleteMany()
}

async function createRoles() {
  const admin_role = await prisma.role.create({
    data: { role_name: ROLE_NAMES.ADMIN }
  })

  const user_role = await prisma.role.create({
    data: { role_name: ROLE_NAMES.USER }
  })

  return {
    admin_role,
    user_role
  }
}

async function createPermissions() {
  return Promise.all(
    PERMISSION_NAMES.map(permission_name =>
      prisma.permission.create({
        data: { permission_name }
      })
    )
  )
}

async function mapAdminPermissions(admin_role, permissions) {
  await Promise.all(
    permissions.map(permission_item =>
      prisma.rolePermission.create({
        data: {
          role_id: admin_role.role_id,
          permission_id: permission_item.permission_id
        }
      })
    )
  )
}

/**
 * Danh mục / thương hiệu mẫu — chỉ khi bảng trống (sau migrate reset).
 * Tránh mọi SP cùng category_id = 1 vì chỉ có một dòng “tạm”.
 */
async function seedCatalogIfEmpty() {
  const cat_count = await prisma.category.count()
  if (cat_count === 0) {
    await prisma.$transaction([
      prisma.category.create({ data: { name: 'Chuột' } }),
      prisma.category.create({ data: { name: 'Lót chuột' } }),
      prisma.category.create({ data: { name: 'Phụ kiện' } })
    ])
    console.log('Seeded default categories: Chuột, Lót chuột, Phụ kiện')
  }

  const brand_count = await prisma.brand.count()
  if (brand_count === 0) {
    await prisma.$transaction([
      prisma.brand.create({ data: { name: 'Lamzu', country: 'CN' } }),
      prisma.brand.create({ data: { name: 'Razer', country: 'US' } }),
      prisma.brand.create({ data: { name: 'Pulsar', country: 'KR' } })
    ])
    console.log('Seeded sample brands: Lamzu, Razer, Pulsar')
  }
}

async function createUsers({ admin_role, user_role }) {
  const admin_password = await bcrypt.hash('admin123', 12)
  const user_password = await bcrypt.hash('user123', 12)

  await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@aimforge.gg',
      password: admin_password,
      roles: {
        create: { role_id: admin_role.role_id }
      }
    }
  })

  await prisma.user.create({
    data: {
      username: 'fps_player',
      email: 'player@aimforge.gg',
      password: user_password,
      roles: {
        create: { role_id: user_role.role_id }
      }
    }
  })
}

async function main() {
  console.log('Seeding User, Role, Permission...')

  await resetRbacData()
  const role_data = await createRoles()
  const permissions = await createPermissions()
  await mapAdminPermissions(role_data.admin_role, permissions)
  await createUsers(role_data)
  await seedCatalogIfEmpty()

  console.log('Seed completed')
  console.log('Admin: admin@aimforge.gg / admin123')
  console.log('User : player@aimforge.gg / user123')
}

main()
  .catch(error => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
