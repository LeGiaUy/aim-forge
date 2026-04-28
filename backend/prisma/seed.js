import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding AimForge database...')

  // ─── Cleanup (order matters – FK constraints) ──────────────────────────────
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.variantAttributeValue.deleteMany();
  await prisma.variantImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productAttributeValue.deleteMany();
  await prisma.attributeValue.deleteMany();
  await prisma.attribute.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleaned existing data')

  // ─── Roles & Permissions ───────────────────────────────────────────────────
  const adminRole = await prisma.role.create({ data: { role_name: 'admin' } })
  const userRole = await prisma.role.create({ data: { role_name: 'user' } })

  const permissions = await Promise.all([
    prisma.permission.create({ data: { permission_name: 'product:write' } }),
    prisma.permission.create({ data: { permission_name: 'product:delete' } }),
    prisma.permission.create({ data: { permission_name: 'order:manage' } }),
  ])

  await Promise.all(
    permissions.map((p) =>
      prisma.rolePermission.create({
        data: { role_id: adminRole.role_id, permission_id: p.permission_id },
      })
    )
  )

  // ─── Admin User ────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12)
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@aimforge.gg',
      password: adminPassword,
      roles: {
        create: { role_id: adminRole.role_id },
      },
    },
  })

  // ─── Regular User ──────────────────────────────────────────────────────────
  const userPassword = await bcrypt.hash('user123', 12)
  await prisma.user.create({
    data: {
      username: 'fps_player',
      email: 'player@aimforge.gg',
      password: userPassword,
      roles: {
        create: { role_id: userRole.role_id },
      },
    },
  })

  console.log(`✅ Users: admin@aimforge.gg / admin123 | player@aimforge.gg / user123`);

  // ─── Categories ────────────────────────────────────────────────────────────
  const [catMouse, catKeyboard, catHeadset] = await Promise.all([
    prisma.category.create({ data: { name: "Gaming Mouse" } }),
    prisma.category.create({ data: { name: "Mechanical Keyboard" } }),
    prisma.category.create({ data: { name: "Gaming Headset" } }),
  ]);

  // ─── Brands ───────────────────────────────────────────────────────────────
  const [brandLogitech, brandRazer] = await Promise.all([
    prisma.brand.create({ data: { name: "Logitech", country: "Switzerland" } }),
    prisma.brand.create({ data: { name: "Razer", country: "USA" } }),
  ]);

  // ─── Attributes ───────────────────────────────────────────────────────────
  const attrColor = await prisma.attribute.create({
    data: { name: "Color", type: "VARIANT", category_id: catMouse.category_id },
  });
  const attrDPI = await prisma.attribute.create({
    data: { name: "DPI", type: "SPEC", category_id: catMouse.category_id },
  });
  const attrLayout = await prisma.attribute.create({
    data: { name: "Layout", type: "VARIANT", category_id: catKeyboard.category_id },
  });
  const attrSwitch = await prisma.attribute.create({
    data: { name: "Switch Type", type: "SPEC", category_id: catKeyboard.category_id },
  });
  const attrDriver = await prisma.attribute.create({
    data: { name: "Driver Size", type: "SPEC", category_id: catHeadset.category_id },
  });

  // Color values for mouse
  const colorBlack = await prisma.attributeValue.create({ data: { attribute_id: attrColor.attribute_id, value: "Matte Black" } });
  const colorWhite = await prisma.attributeValue.create({ data: { attribute_id: attrColor.attribute_id, value: "Arctic White" } });

  // Layout values for keyboard
  const layout75 = await prisma.attributeValue.create({ data: { attribute_id: attrLayout.attribute_id, value: "75%" } });
  const layoutTKL = await prisma.attributeValue.create({ data: { attribute_id: attrLayout.attribute_id, value: "TKL" } });

  console.log("✅ Categories, Brands, Attributes seeded");

  // ─── Products ─────────────────────────────────────────────────────────────

  // 1. Logitech G Pro X Superlight 2
  const mouse1 = await prisma.product.create({
    data: {
      name: "G Pro X Superlight 2",
      description: "Ultra-lightweight wireless gaming mouse designed for esports professionals. Features HERO 2 sensor with 44K DPI.",
      category_id: catMouse.category_id,
      brand_id: brandLogitech.brand_id,
      specs: {
        create: [
          { attribute_id: attrDPI.attribute_id, value: "44000 DPI max" },
        ],
      },
    },
  });

  const mouse1v1 = await prisma.productVariant.create({
    data: {
      product_id: mouse1.product_id,
      sku: "GPX2-BLK",
      price: 159.99,
      stock: 45,
    },
  });
  await prisma.variantAttributeValue.create({ data: { variant_id: mouse1v1.variant_id, value_id: colorBlack.value_id } });
  await prisma.variantImage.createMany({
    data: [
      { variant_id: mouse1v1.variant_id, image_url: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80", is_main: true, sort_order: 1 },
      { variant_id: mouse1v1.variant_id, image_url: "https://images.unsplash.com/photo-1593640408182-31c228b21564?w=600&q=80", is_main: false, sort_order: 2 },
    ],
  });

  const mouse1v2 = await prisma.productVariant.create({
    data: {
      product_id: mouse1.product_id,
      sku: "GPX2-WHT",
      price: 159.99,
      stock: 30,
    },
  });
  await prisma.variantAttributeValue.create({ data: { variant_id: mouse1v2.variant_id, value_id: colorWhite.value_id } });
  await prisma.variantImage.createMany({
    data: [
      { variant_id: mouse1v2.variant_id, image_url: "https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=600&q=80", is_main: true, sort_order: 1 },
    ],
  });

  // 2. Razer DeathAdder V3 Pro
  const mouse2 = await prisma.product.create({
    data: {
      name: "DeathAdder V3 Pro",
      description: "Ergonomic wireless gaming mouse with Focus Pro 30K optical sensor and 90-hour battery life.",
      category_id: catMouse.category_id,
      brand_id: brandRazer.brand_id,
      specs: {
        create: [
          { attribute_id: attrDPI.attribute_id, value: "30000 DPI max" },
        ],
      },
    },
  });

  const mouse2v1 = await prisma.productVariant.create({
    data: {
      product_id: mouse2.product_id,
      sku: "DAV3P-BLK",
      price: 149.99,
      stock: 60,
    },
  });
  await prisma.variantAttributeValue.create({ data: { variant_id: mouse2v1.variant_id, value_id: colorBlack.value_id } });
  await prisma.variantImage.createMany({
    data: [
      { variant_id: mouse2v1.variant_id, image_url: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&q=80", is_main: true, sort_order: 1 },
    ],
  });

  // 3. Logitech G715 TKL Keyboard
  const kb1 = await prisma.product.create({
    data: {
      name: "G715 TKL Wireless Keyboard",
      description: "Tenkeyless wireless mechanical keyboard with LIGHTSYNC RGB and tactile switches.",
      category_id: catKeyboard.category_id,
      brand_id: brandLogitech.brand_id,
      specs: {
        create: [
          { attribute_id: attrSwitch.attribute_id, value: "GX Brown Tactile" },
        ],
      },
    },
  });

  const kb1v1 = await prisma.productVariant.create({
    data: {
      product_id: kb1.product_id,
      sku: "G715-TKL-WT",
      price: 179.99,
      stock: 25,
    },
  });
  await prisma.variantAttributeValue.create({ data: { variant_id: kb1v1.variant_id, value_id: layoutTKL.value_id } });
  await prisma.variantImage.createMany({
    data: [
      { variant_id: kb1v1.variant_id, image_url: "https://images.unsplash.com/photo-1595044426077-d36d9236d54a?w=600&q=80", is_main: true, sort_order: 1 },
      { variant_id: kb1v1.variant_id, image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80", is_main: false, sort_order: 2 },
    ],
  });

  // 4. Razer BlackWidow V4 75%
  const kb2 = await prisma.product.create({
    data: {
      name: "BlackWidow V4 75%",
      description: "Compact 75% form factor mechanical keyboard with Razer Green switches and magnetic wrist rest.",
      category_id: catKeyboard.category_id,
      brand_id: brandRazer.brand_id,
      specs: {
        create: [
          { attribute_id: attrSwitch.attribute_id, value: "Razer Green Clicky" },
        ],
      },
    },
  });

  const kb2v1 = await prisma.productVariant.create({
    data: {
      product_id: kb2.product_id,
      sku: "BWV4-75-BLK",
      price: 199.99,
      stock: 20,
    },
  });
  await prisma.variantAttributeValue.create({ data: { variant_id: kb2v1.variant_id, value_id: layout75.value_id } });
  await prisma.variantImage.createMany({
    data: [
      { variant_id: kb2v1.variant_id, image_url: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=600&q=80", is_main: true, sort_order: 1 },
    ],
  });

  // 5. Razer BlackShark V2 Pro Headset
  const headset1 = await prisma.product.create({
    data: {
      name: "BlackShark V2 Pro",
      description: "Professional wireless esports headset with TriForce Titanium 50mm drivers and HyperClear Supercardioid mic.",
      category_id: catHeadset.category_id,
      brand_id: brandRazer.brand_id,
      specs: {
        create: [
          { attribute_id: attrDriver.attribute_id, value: "TriForce Titanium 50mm" },
        ],
      },
    },
  });

  const headset1v1 = await prisma.productVariant.create({
    data: {
      product_id: headset1.product_id,
      sku: "BSV2P-BLK",
      price: 179.99,
      stock: 35,
    },
  });
  await prisma.variantImage.createMany({
    data: [
      { variant_id: headset1v1.variant_id, image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80", is_main: true, sort_order: 1 },
      { variant_id: headset1v1.variant_id, image_url: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80", is_main: false, sort_order: 2 },
    ],
  });

  console.log("✅ 5 products with variants and images seeded");
  console.log(`
🎯 AimForge Seed Complete!
──────────────────────────────
  Products  : 5
  Variants  : 7
  Categories: 3 (Gaming Mouse, Mechanical Keyboard, Gaming Headset)
  Brands    : 2 (Logitech, Razer)
  Admin     : admin@aimforge.gg / admin123
  User      : player@aimforge.gg / user123
──────────────────────────────
  `);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
