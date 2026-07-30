import "dotenv/config";
import { connectDB, disconnectDB } from "../config/db";
import { UserModel } from "../models/user.model";
import { ProductModel } from "../models/product.model";
import { hashPassword } from "../utils/hash";
import { IProduct } from "../types/product.types";

const sampleProducts: IProduct[] = [
  {
    name: "Aurora X1 Smartphone",
    description: "6.5-inch OLED, 128GB storage, dual camera.",
    category: "mobile",
    price: 699.99,
    stock: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
  },
  {
    name: "Nimbus Pro 14 Laptop",
    description: "14-inch, 16GB RAM, 512GB SSD, all-day battery.",
    category: "laptop",
    price: 1299.0,
    stock: 12,
    imageUrl:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80",
  },
  {
    name: "EchoBuds Wireless Earbuds",
    description: "Active noise cancellation with 24h case battery.",
    category: "accessory",
    price: 149.5,
    stock: 60,
    imageUrl:
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
  },
  {
    name: "VoltCharge 65W GaN Adapter",
    description: "Compact USB-C fast charger for phones and laptops.",
    category: "accessory",
    price: 39.99,
    stock: 100,
    imageUrl:
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80",
  },
  {
    name: "Pixel Tab Mini",
    description: "8-inch tablet, 64GB, ideal for reading and media.",
    category: "other",
    price: 229.0,
    stock: 18,
    imageUrl:
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80",
  },
];

async function seed() {
  const adminEmail = (
    process.argv[2] ||
    process.env.SEED_ADMIN_EMAIL ||
    "admin@gadgetstore.local"
  ).toLowerCase();
  const adminPassword =
    process.argv[3] || process.env.SEED_ADMIN_PASSWORD || "admin1234";

  await connectDB();

  const existingAdmin = await UserModel.findOne({ email: adminEmail });
  if (existingAdmin) {
    console.log(`Admin already exists: ${adminEmail}`);
  } else {
    const passwordHash = await hashPassword(adminPassword);
    await UserModel.create({
      name: "Store Admin",
      email: adminEmail,
      passwordHash,
      role: "admin",
    });
    console.log(`Created admin user: ${adminEmail}`);
  }

  const productCount = await ProductModel.countDocuments();
  if (productCount === 0) {
    await ProductModel.insertMany(sampleProducts);
    console.log(`Seeded ${sampleProducts.length} products`);
  } else {
    console.log(
      `Products already present (${productCount}), skipping product seed`
    );
  }

  await disconnectDB();
  console.log("Seed complete");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
