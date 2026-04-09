import fs from "fs";
import path from "path";
import { INITIAL_LOCAL_DATA } from "./localSeed";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "localdb.json");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_LOCAL_DATA, null, 2));
    return;
  }

  const current = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

  if (current.__seedVersion !== INITIAL_LOCAL_DATA.__seedVersion) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_LOCAL_DATA, null, 2));
  }
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeStore(data) {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function normalizeValue(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function matchesCondition(docValue, condition) {
  if (condition && typeof condition === "object" && !Array.isArray(condition)) {
    if ("$ne" in condition) {
      return normalizeValue(docValue) !== normalizeValue(condition.$ne);
    }

    return Object.entries(condition).every(([key, value]) => {
      if (key === "$ne") {
        return normalizeValue(docValue) !== normalizeValue(value);
      }

      return false;
    });
  }

  return normalizeValue(docValue) === normalizeValue(condition);
}

function matchesFilter(doc, filter = {}) {
  return Object.entries(filter).every(([key, value]) => {
    if (key === "$or") {
      return value.some((item) => matchesFilter(doc, item));
    }

    return matchesCondition(doc[key], value);
  });
}

function sortDocs(docs, sortSpec = {}) {
  const entries = Object.entries(sortSpec);

  if (!entries.length) {
    return docs;
  }

  return [...docs].sort((left, right) => {
    for (const [field, direction] of entries) {
      const leftValue = normalizeValue(left[field] ?? null);
      const rightValue = normalizeValue(right[field] ?? null);

      if (leftValue === rightValue) {
        continue;
      }

      if (leftValue === null) return 1;
      if (rightValue === null) return -1;

      if (leftValue > rightValue) {
        return direction >= 0 ? 1 : -1;
      }

      if (leftValue < rightValue) {
        return direction >= 0 ? -1 : 1;
      }
    }

    return 0;
  });
}

function selectFields(doc, fields) {
  if (!fields) {
    return doc;
  }

  const selected = {};

  for (const field of fields.split(/\s+/).filter(Boolean)) {
    if (field in doc) {
      selected[field] = doc[field];
    }
  }

  if ("_id" in doc) {
    selected._id = doc._id;
  }

  return selected;
}

function applyUpdate(doc, update) {
  const next = { ...doc };

  for (const [key, value] of Object.entries(update)) {
    if (key === "$inc") {
      for (const [incKey, incValue] of Object.entries(value)) {
        next[incKey] = Number(next[incKey] || 0) + Number(incValue);
      }
      continue;
    }

    next[key] = normalizeValue(value);
  }

  next.updatedAt = new Date().toISOString();
  return next;
}

function makeId(collectionName) {
  return `${collectionName.toLowerCase()}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

class LocalQuery {
  constructor(mode, docs) {
    this.mode = mode;
    this.docs = docs;
    this.sortSpec = null;
    this.limitCount = null;
    this.fields = null;
  }

  sort(spec) {
    this.sortSpec = spec;
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  select(fields) {
    this.fields = fields;
    return this;
  }

  lean() {
    return Promise.resolve(this.value());
  }

  then(resolve, reject) {
    return Promise.resolve(this.value()).then(resolve, reject);
  }

  value() {
    let result = clone(this.docs);

    if (Array.isArray(result) && this.sortSpec) {
      result = sortDocs(result, this.sortSpec);
    }

    if (Array.isArray(result) && Number.isInteger(this.limitCount)) {
      result = result.slice(0, this.limitCount);
    }

    if (Array.isArray(result) && this.fields) {
      result = result.map((item) => selectFields(item, this.fields));
    }

    if (!Array.isArray(result) && result && this.fields) {
      result = selectFields(result, this.fields);
    }

    if (this.mode === "one" && Array.isArray(result)) {
      return result[0] || null;
    }

    return result;
  }
}

export function useLocalDb() {
  return process.env.LOCAL_DB === "1";
}

export function createLocalModel(collectionName) {
  return {
    find(filter = {}) {
      const store = readStore();
      const docs = (store[collectionName] || []).filter((doc) => matchesFilter(doc, filter));
      return new LocalQuery("many", docs);
    },
    findOne(filter = {}) {
      const store = readStore();
      const docs = (store[collectionName] || []).filter((doc) => matchesFilter(doc, filter));
      return new LocalQuery("one", docs);
    },
    findById(id) {
      const store = readStore();
      const doc = (store[collectionName] || []).find((item) => item._id === id) || null;
      return new LocalQuery("one", doc);
    },
    async create(payload) {
      const store = readStore();
      const timestamp = new Date().toISOString();
      const doc = {
        _id: payload._id || makeId(collectionName),
        ...clone(payload),
        createdAt: normalizeValue(payload.createdAt || timestamp),
        updatedAt: normalizeValue(payload.updatedAt || timestamp)
      };

      if (collectionName === "ArticleView" && !doc.viewedAt) {
        doc.viewedAt = timestamp;
      }

      store[collectionName] = [...(store[collectionName] || []), doc];
      writeStore(store);
      return clone(doc);
    },
    async findByIdAndUpdate(id, update, options = {}) {
      const store = readStore();
      const index = (store[collectionName] || []).findIndex((item) => item._id === id);

      if (index === -1) {
        return null;
      }

      const previous = clone(store[collectionName][index]);
      const updated = applyUpdate(store[collectionName][index], update);
      store[collectionName][index] = updated;
      writeStore(store);

      return options.new ? clone(updated) : previous;
    },
    async findByIdAndDelete(id) {
      const store = readStore();
      const current = (store[collectionName] || []).find((item) => item._id === id) || null;
      store[collectionName] = (store[collectionName] || []).filter((item) => item._id !== id);
      writeStore(store);
      return clone(current);
    },
    async findOneAndUpdate(filter, update, options = {}) {
      const store = readStore();
      const index = (store[collectionName] || []).findIndex((item) => matchesFilter(item, filter));

      if (index === -1) {
        if (!options.upsert) {
          return null;
        }

        const created = await this.create({ ...filter, ...update });
        return clone(created);
      }

      const updated = applyUpdate(store[collectionName][index], update);
      store[collectionName][index] = updated;
      writeStore(store);
      return clone(updated);
    },
    async countDocuments(filter = {}) {
      const store = readStore();
      return (store[collectionName] || []).filter((doc) => matchesFilter(doc, filter)).length;
    }
  };
}
