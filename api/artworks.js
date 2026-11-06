/**
 * Nadine Baghdady Atelier - Live Gallery Artworks Serverless API for Vercel
 * Supports:
 *  1. MongoDB Atlas (via MONGODB_URI)
 *  2. Vercel KV / Upstash Redis (via KV_REST_API_URL & KV_REST_API_TOKEN)
 *  3. Bundled static seed fallback (assets/data/artworks.json)
 */
const fs = require('fs');
const path = require('path');

let cachedMongoClient = null;

function getMongoUri() {
  const envUri = (process.env.MONGODB_URI || '').trim();
  if (envUri.startsWith('mongodb://') || envUri.startsWith('mongodb+srv://')) {
    return envUri;
  }
  return null;
}

async function getMongoClient(uri) {
  if (cachedMongoClient) return cachedMongoClient;
  const { MongoClient } = require('mongodb');
  const client = new MongoClient(uri, {
    connectTimeoutMS: 5000,
    socketTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
    tls: true,
    retryWrites: true
  });
  await client.connect();
  cachedMongoClient = client;
  return client;
}

function getLocalSeedData() {
  try {
    const jsonPath = path.join(process.cwd(), 'assets', 'data', 'artworks.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.warn('Seed read warning:', e.message);
  }
  return [];
}

// Upstash / Vercel KV REST helpers (zero dependencies)
function getKvConfig() {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  if (url && token) {
    return { url, token };
  }
  return null;
}

async function kvGet(config, key) {
  const res = await fetch(`${config.url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${config.token}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data && data.result) {
    try {
      return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
    } catch (e) {
      return null;
    }
  }
  return null;
}

async function kvSet(config, key, value) {
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  const res = await fetch(`${config.url}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return res.ok;
}

module.exports = async (req, res) => {
  // Universal CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const mongoUri = getMongoUri();
  const kvConfig = getKvConfig();

  try {
    // -------------------------------------------------------------------------
    // 1. GET: Return artworks list
    // -------------------------------------------------------------------------
    if (req.method === 'GET') {
      // Priority A: Vercel KV / Upstash
      if (kvConfig) {
        try {
          const list = await kvGet(kvConfig, 'nadine_artworks');
          if (Array.isArray(list) && list.length > 0) {
            return res.status(200).json(list);
          }
        } catch (e) {
          console.warn('KV GET error:', e.message);
        }
      }

      // Priority B: MongoDB Atlas
      if (mongoUri) {
        try {
          const client = await getMongoClient(mongoUri);
          const db = client.db('nadine_baghdadi');
          const docs = await db.collection('artworks').find({}).sort({ order: 1 }).toArray();
          if (Array.isArray(docs) && docs.length > 0) {
            const cleanDocs = docs.map(({ _id, ...rest }) => rest);
            return res.status(200).json(cleanDocs);
          }
        } catch (e) {
          console.warn('MongoDB GET error:', e.message);
        }
      }

      // Priority C: Static seed file (always succeeds gracefully)
      const seedData = getLocalSeedData();
      return res.status(200).json(seedData);
    }

    // -------------------------------------------------------------------------
    // 2. POST / PUT: Save updated artworks list
    // -------------------------------------------------------------------------
    if (req.method === 'POST' || req.method === 'PUT') {
      let bodyData = req.body;
      if (typeof bodyData === 'string') {
        try {
          bodyData = JSON.parse(bodyData);
        } catch (e) {
          return res.status(400).json({ error: 'Invalid JSON body' });
        }
      }

      const artworks = Array.isArray(bodyData)
        ? bodyData
        : (bodyData && Array.isArray(bodyData.artworks) ? bodyData.artworks : null);

      if (!artworks) {
        return res.status(400).json({ error: 'Missing artworks array in payload' });
      }

      const cleanArtworks = artworks.map((item, index) => {
        const copy = { ...item };
        delete copy._id;
        if (!copy.order) copy.order = index + 1;
        return copy;
      });

      let savedToCloud = false;
      let providerName = '';

      // Priority A: Vercel KV / Upstash
      if (kvConfig) {
        try {
          const ok = await kvSet(kvConfig, 'nadine_artworks', cleanArtworks);
          if (ok) {
            savedToCloud = true;
            providerName = 'Vercel KV';
          }
        } catch (e) {
          console.warn('KV SET error:', e.message);
        }
      }

      // Priority B: MongoDB Atlas
      if (!savedToCloud && mongoUri) {
        try {
          const client = await getMongoClient(mongoUri);
          const db = client.db('nadine_baghdadi');
          const collection = db.collection('artworks');
          await collection.deleteMany({});
          if (cleanArtworks.length > 0) {
            await collection.insertMany(cleanArtworks);
          }
          savedToCloud = true;
          providerName = 'MongoDB Atlas';
        } catch (e) {
          console.error('MongoDB SET error:', e.message);
        }
      }

      if (savedToCloud) {
        return res.status(200).json({
          success: true,
          count: cleanArtworks.length,
          provider: providerName,
          message: `Artworks synced successfully to ${providerName}`
        });
      }

      // If no cloud database is active on Vercel
      return res.status(503).json({
        success: false,
        count: cleanArtworks.length,
        error: 'No cloud database connected. Please add MONGODB_URI or Vercel KV in your Vercel project environment variables so uploads persist live for all visitors.',
        code: 'NO_CLOUD_DATABASE'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Artworks API Serverless error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
