import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

export interface QueryOptions {
  sort?: Record<string, 1 | -1>;
  skip?: number;
  limit?: number;
  populate?: string[];
}

export let isMongoConnected = false;

export function maskMongoUri(uri: string): string {
  try {
    return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  } catch {
    return '***';
  }
}

export class MemoryCollection<T extends { _id: string; [key: string]: any }> {
  private items: Map<string, T> = new Map();
  private filePath: string;
  private name: string;

  constructor(name: string) {
    this.name = name;
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (e) {
        // ignore
      }
    }
    this.filePath = path.join(dataDir, `${name}.json`);
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const list: T[] = JSON.parse(raw);
        for (const it of list) {
          this.items.set(String(it._id), it);
        }
      }
    } catch (e) {
      console.warn(`[TrainSure DB] Warning loading ${this.name}:`, e);
    }
  }

  public saveToDisk() {
    try {
      const data = Array.from(this.items.values());
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.warn(`[TrainSure DB] Warning saving ${this.name}:`, e);
    }
  }

  private checkDbState() {
    if (process.env.NODE_ENV === 'production' && !isMongoConnected) {
      const error: any = new Error('Persistent database service is unavailable. Please check MongoDB Atlas connection.');
      error.statusCode = 503;
      error.errorCode = 'DB_UNAVAILABLE';
      throw error;
    }
  }

  private getMongoCollection() {
    if (isMongoConnected && mongoose.connection.readyState === 1 && mongoose.connection.db) {
      return mongoose.connection.db.collection(this.name);
    }
    return null;
  }

  private cleanMongoFilter(filter: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = { ...filter };
    if (cleaned._id) {
      const idStr = String(cleaned._id);
      if (mongoose.Types.ObjectId.isValid(idStr) && idStr.length === 24) {
        cleaned.$or = [{ _id: idStr as any }, { _id: new mongoose.Types.ObjectId(idStr) as any }];
        delete cleaned._id;
      } else {
        cleaned._id = idStr as any;
      }
    }
    return cleaned;
  }

  private formatDoc(doc: any): T {
    if (!doc) return doc;
    const cloned = deepClone(doc);
    if (cloned._id) {
      cloned._id = String(cloned._id);
    }
    return cloned as T;
  }

  public async find(filter: Record<string, any> = {}): Promise<T[]> {
    this.checkDbState();
    const col = this.getMongoCollection();
    if (col) {
      const docs = await col.find(this.cleanMongoFilter(filter)).toArray();
      return docs.map(d => this.formatDoc(d));
    }
    let result = Array.from(this.items.values());
    result = result.filter(item => matchFilter(item, filter));
    return result.map(it => deepClone(it));
  }

  public async findOne(filter: Record<string, any> = {}): Promise<T | null> {
    this.checkDbState();
    const col = this.getMongoCollection();
    if (col) {
      const doc = await col.findOne(this.cleanMongoFilter(filter));
      return doc ? this.formatDoc(doc) : null;
    }
    const list = await this.find(filter);
    return list.length > 0 ? list[0] : null;
  }

  public async findById(id: string): Promise<T | null> {
    this.checkDbState();
    return this.findOne({ _id: String(id) });
  }

  public async create(data: Partial<T> | Partial<T>[]): Promise<any> {
    this.checkDbState();
    const col = this.getMongoCollection();
    if (col) {
      const now = new Date().toISOString();
      if (Array.isArray(data)) {
        const docs = data.map(d => ({
          ...d,
          _id: d._id ? String(d._id) : generateId(),
          createdAt: d.createdAt || now,
          updatedAt: d.updatedAt || now,
        }));
        if (docs.length > 0) {
          await col.insertMany(docs as any);
        }
        return docs.map(d => this.formatDoc(d));
      }
      const item = {
        ...data,
        _id: data._id ? String(data._id) : generateId(),
        createdAt: data.createdAt || now,
        updatedAt: data.updatedAt || now,
      };
      await col.insertOne(item as any);
      return this.formatDoc(item as any);
    }

    if (Array.isArray(data)) {
      const created: T[] = [];
      for (const d of data) {
        created.push(await this.createOne(d));
      }
      this.saveToDisk();
      return created;
    }
    const item = await this.createOne(data);
    this.saveToDisk();
    return item;
  }

  private async createOne(data: Partial<T>): Promise<T> {
    const _id = data._id ? String(data._id) : generateId();
    const now = new Date().toISOString();
    const item = {
      ...data,
      _id,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    } as unknown as T;
    this.items.set(_id, item);
    return deepClone(item);
  }

  public async findByIdAndUpdate(
    id: string,
    update: Record<string, any>,
    _options: { new?: boolean } = { new: true }
  ): Promise<T | null> {
    this.checkDbState();
    const col = this.getMongoCollection();
    if (col) {
      let patch = { ...update };
      if (!patch.$set && !patch.$unset) {
        patch = { $set: { ...update, updatedAt: new Date().toISOString() } };
      } else if (patch.$set) {
        patch.$set = { ...patch.$set, updatedAt: new Date().toISOString() };
      }
      const res = await col.findOneAndUpdate(
        { _id: String(id) as any },
        patch,
        { returnDocument: 'after' }
      );
      return res ? this.formatDoc(res) : null;
    }

    const existing = this.items.get(String(id));
    if (!existing) return null;

    let patch = update;
    if (update.$set) {
      patch = { ...update.$set };
    }

    const updated = {
      ...existing,
      ...patch,
      _id: existing._id,
      updatedAt: new Date().toISOString(),
    };
    this.items.set(String(id), updated);
    this.saveToDisk();
    return deepClone(updated);
  }

  public async updateOne(filter: Record<string, any>, update: Record<string, any>): Promise<boolean> {
    this.checkDbState();
    const col = this.getMongoCollection();
    if (col) {
      let patch = { ...update };
      if (!patch.$set && !patch.$unset) {
        patch = { $set: { ...update, updatedAt: new Date().toISOString() } };
      }
      const res = await col.updateOne(this.cleanMongoFilter(filter), patch);
      return res.matchedCount > 0;
    }

    const item = await this.findOne(filter);
    if (!item) return false;
    await this.findByIdAndUpdate(item._id, update);
    return true;
  }

  public async updateMany(filter: Record<string, any>, update: Record<string, any>): Promise<number> {
    this.checkDbState();
    const col = this.getMongoCollection();
    if (col) {
      let patch = { ...update };
      if (!patch.$set && !patch.$unset) {
        patch = { $set: { ...update, updatedAt: new Date().toISOString() } };
      }
      const res = await col.updateMany(this.cleanMongoFilter(filter), patch);
      return res.matchedCount;
    }

    const items = await this.find(filter);
    for (const it of items) {
      await this.findByIdAndUpdate(it._id, update);
    }
    return items.length;
  }

  public async findByIdAndDelete(id: string): Promise<T | null> {
    this.checkDbState();
    const col = this.getMongoCollection();
    if (col) {
      const res = await col.findOneAndDelete({ _id: String(id) as any });
      return res ? this.formatDoc(res) : null;
    }

    const it = this.items.get(String(id));
    if (!it) return null;
    this.items.delete(String(id));
    this.saveToDisk();
    return deepClone(it);
  }

  public async deleteMany(filter: Record<string, any> = {}): Promise<number> {
    this.checkDbState();
    const col = this.getMongoCollection();
    if (col) {
      const res = await col.deleteMany(this.cleanMongoFilter(filter));
      return res.deletedCount;
    }

    const items = await this.find(filter);
    for (const it of items) {
      this.items.delete(String(it._id));
    }
    this.saveToDisk();
    return items.length;
  }

  public async countDocuments(filter: Record<string, any> = {}): Promise<number> {
    this.checkDbState();
    const col = this.getMongoCollection();
    if (col) {
      return await col.countDocuments(this.cleanMongoFilter(filter));
    }
    const list = await this.find(filter);
    return list.length;
  }

  public async clear() {
    this.checkDbState();
    const col = this.getMongoCollection();
    if (col) {
      await col.deleteMany({});
      return;
    }
    this.items.clear();
    this.saveToDisk();
  }
}

function matchFilter(item: any, filter: Record<string, any>): boolean {
  for (const key of Object.keys(filter)) {
    const expected = filter[key];
    if (expected === undefined) continue;

    if (expected !== null && typeof expected === 'object' && !Array.isArray(expected)) {
      if ('$in' in expected && Array.isArray(expected.$in)) {
        if (!expected.$in.map(String).includes(String(item[key]))) {
          return false;
        }
        continue;
      }
      if ('$nin' in expected && Array.isArray(expected.$nin)) {
        if (expected.$nin.map(String).includes(String(item[key]))) {
          return false;
        }
        continue;
      }
      if ('$ne' in expected) {
        if (item[key] === expected.$ne) return false;
        continue;
      }
      if ('$gt' in expected) {
        if (!(item[key] > expected.$gt)) return false;
        continue;
      }
      if ('$gte' in expected) {
        if (!(item[key] >= expected.$gte)) return false;
        continue;
      }
      if ('$lt' in expected) {
        if (!(item[key] < expected.$lt)) return false;
        continue;
      }
      if ('$lte' in expected) {
        if (!(item[key] <= expected.$lte)) return false;
        continue;
      }
      if ('$regex' in expected) {
        const regex = new RegExp(expected.$regex, expected.$options || 'i');
        if (!regex.test(String(item[key] || ''))) return false;
        continue;
      }
    }

    if (item[key] === undefined) {
      if (expected === null) continue;
      return false;
    }

    if (String(item[key]) !== String(expected)) {
      return false;
    }
  }
  return true;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function generateId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return (timestamp + random).substring(0, 24);
}

export async function connectDatabase() {
  const uri = process.env.MONGO_URI;
  const isProd = process.env.NODE_ENV === 'production';

  if (!uri) {
    if (isProd) {
      console.error('[TrainSure DB] FATAL: MONGO_URI environment variable is required in production.');
      throw new Error('MONGO_URI must be set in production mode. Refusing to switch silently to in-memory store.');
    }
    console.log('[TrainSure DB] No MONGO_URI supplied. Operating in development mode with embedded persistent file store.');
    return;
  }

  console.log(`[TrainSure DB] Connecting to database (${maskMongoUri(uri)})...`);
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: !isProd,
    });
    isMongoConnected = true;
    console.log('[TrainSure DB] Successfully connected to persistent MongoDB cluster!');

    mongoose.connection.on('disconnected', () => {
      isMongoConnected = false;
      console.warn('[TrainSure DB] Disconnected from MongoDB cluster.');
    });

    mongoose.connection.on('reconnected', () => {
      isMongoConnected = true;
      console.log('[TrainSure DB] Reconnected to MongoDB cluster.');
    });
  } catch (err: any) {
    isMongoConnected = false;
    if (isProd) {
      console.error('[TrainSure DB] FATAL: Failed to connect to MongoDB in production:', err.message);
      throw err;
    } else {
      console.warn('[TrainSure DB] MongoDB connection failed in development:', err.message);
      console.log('[TrainSure DB] Using embedded local JSON store for local development.');
    }
  }
}
