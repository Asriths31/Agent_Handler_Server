import User from '../models/user.js';

class BloomFilter {
  constructor(size = 10000, numHashFunctions = 4) {
    this.size = size;
    this.numHashFunctions = numHashFunctions;
    this.bitArray = new Array(size).fill(false);
  }

  // FNV-1a hash implementation
  _hash(string, seed) {
    let h = seed ^ 2166136261;
    for (let i = 0; i < string.length; i++) {
      h ^= string.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return Math.abs(h) % this.size;
  }

  add(item) {
    if (!item) return;
    const str = String(item).toLowerCase().trim();
    for (let i = 0; i < this.numHashFunctions; i++) {
      const idx = this._hash(str, i + 1);
      this.bitArray[idx] = true;
    }
  }

  has(item) {
    if (!item) return false;
    const str = String(item).toLowerCase().trim();
    for (let i = 0; i < this.numHashFunctions; i++) {
      const idx = this._hash(str, i + 1);
      if (!this.bitArray[idx]) {
        return false; // Definitely not in set
      }
    }
    return true; // Possibly in set
  }
}

let usernameFilter = null;

export const initUsernameFilter = async () => {
  usernameFilter = new BloomFilter(10000, 4);
  try {
    const users = await User.find().select('username').lean();
    users.forEach(user => {
      if (user.username) {
        usernameFilter.add(user.username);
      }
    });
    console.log(`Bloom Filter: Initialized with ${users.length} usernames.`);
  } catch (error) {
    console.error('Bloom Filter initialization failed:', error.message);
  }
};

export const addUsernameToFilter = (username) => {
  if (usernameFilter && username) {
    usernameFilter.add(username);
  }
};

export const checkUsernameExists = async (username) => {
  if (!usernameFilter) {
    // Fallback directly to DB if filter not initialized
    const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
    return !!user;
  }

  const str = String(username).toLowerCase().trim();
  // 1. Check Bloom Filter
  if (!usernameFilter.has(str)) {
    return false; // Definitely does not exist!
  }

  // 2. Filter indicates it might exist (could be false positive). Fallback to DB check.
  const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
  return !!user;
};
