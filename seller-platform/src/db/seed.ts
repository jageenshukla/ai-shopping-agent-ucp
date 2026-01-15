import { store } from './store';
import { Product } from '../types';

const sampleProducts: Product[] = [
  {
    sku: 'COFFEE-001',
    name: 'Premium Coffee Maker',
    description: 'Programmable coffee maker with 12-cup capacity, auto-brew timer, and keep-warm function',
    price: 89.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6',
    inventory_count: 50,
    is_active: 1
  },
  {
    sku: 'MUG-001',
    name: 'Ceramic Coffee Mug Set',
    description: 'Set of 4 handcrafted ceramic mugs, dishwasher and microwave safe',
    price: 34.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d',
    inventory_count: 100,
    is_active: 1
  },
  {
    sku: 'BEANS-001',
    name: 'Organic Coffee Beans - Dark Roast',
    description: 'Premium organic Arabica beans, 2lb bag, dark roast with rich chocolate notes',
    price: 24.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e',
    inventory_count: 200,
    is_active: 1
  },
  {
    sku: 'GRINDER-001',
    name: 'Burr Coffee Grinder',
    description: 'Electric burr grinder with 18 settings for precision grinding',
    price: 149.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1612374191446-d1d9a383952d',
    inventory_count: 30,
    is_active: 1
  },
  {
    sku: 'KETTLE-001',
    name: 'Gooseneck Electric Kettle',
    description: 'Variable temperature electric kettle with precision pour spout, perfect for pour-over coffee',
    price: 79.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1585433191992-0e871da26d31',
    inventory_count: 45,
    is_active: 1
  }
];

export function seedDatabase() {
  console.log('Seeding in-memory database with sample products...');

  sampleProducts.forEach((product) => {
    store.addProduct(product);
    console.log(`✓ Added ${product.sku}: ${product.name}`);
  });

  console.log('\nDatabase seeding completed!');
  console.log(`Total products: ${sampleProducts.length}`);
  console.log(`Products in store: ${store.getStats().products}`);
}

// Seed immediately when imported
seedDatabase();
