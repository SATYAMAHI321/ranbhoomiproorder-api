import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin';
import Product from '../models/Product';

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/TrackMyORDER';
    await mongoose.connect(mongoURI);

    console.log('✅ Connected to MongoDB');

    // Create default admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@TrackMyORDER.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    const existingAdmin = await Admin.findOne({ email: adminEmail });

    if (!existingAdmin) {
      await Admin.create({
        email: adminEmail,
        password: adminPassword,
        name: 'Super Admin',
        role: 'admin',
      });
      console.log(`✅ Admin user created: ${adminEmail}`);
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create sample products
    const existingProducts = await Product.countDocuments();

    if (existingProducts === 0) {
      const sampleProducts = [
        {
          name: 'YouTube Premium - Individual',
          platform: 'YouTube',
          description: 'Ad-free videos, background play, and YouTube Music',
          price: 129,
          validity: 30,
          features: ['Ad-free videos', 'Background play', 'YouTube Music Premium', 'Offline downloads'],
          category: 'streaming',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/2560px-YouTube_full-color_icon_%282017%29.svg.png'
        },
        {
          name: 'Netflix - Basic',
          platform: 'Netflix',
          description: 'Watch on 1 screen at a time in Standard Definition',
          price: 199,
          validity: 30,
          features: ['Unlimited movies and TV shows', 'Watch on 1 screen', 'SD quality', 'No ads'],
          category: 'streaming',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/2560px-Netflix_2015_logo.svg.png'
        },
        {
          name: 'Disney+ Hotstar - Premium',
          platform: 'Hotstar',
          description: 'Watch latest movies, exclusive shows, and live sports',
          price: 299,
          validity: 30,
          features: ['4K quality', 'Up to 4 devices', 'Live sports', 'Disney+ content'],
          category: 'streaming',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Disney%2B_Hotstar_logo.svg/2560px-Disney%2B_Hotstar_logo.svg.png'
        },
        {
          name: 'Amazon Prime Video',
          platform: 'Prime Video',
          description: 'Watch exclusive Amazon Originals and latest movies',
          price: 179,
          validity: 30,
          features: ['Prime Video access', 'Amazon Originals', 'HD streaming', 'Download & watch'],
          category: 'streaming',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Amazon_Prime_Video_logo.svg/2560px-Amazon_Prime_Video_logo.svg.png'
        },
        {
          name: 'Spotify Premium',
          platform: 'Spotify',
          description: 'Ad-free music streaming with offline downloads',
          price: 119,
          validity: 30,
          features: ['Ad-free music', 'Offline downloads', 'High quality audio', 'Unlimited skips'],
          category: 'music',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/2048px-Spotify_logo_without_text.svg.png'
        }
      ];

      await Product.insertMany(sampleProducts);
      console.log('✅ Sample products created');
    } else {
      console.log('ℹ️  Products already exist');
    }

    console.log('🎉 Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
