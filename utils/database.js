const { QuickDB } = require("quick.db");

const db = new QuickDB();

async function getUser(id) {
  let user = await db.get(`user_${id}`);

  // ONLY create new user if truly missing
  if (!user) {
    user = {
      wallet: 0,
      lastDaily: 0,
      lastWork: 0,
      lastBeg: 0,
      lastSteal: 0,
    };
    await db.set(`user_${id}`, user);
    return user;
  }

  // PATCH OLD USERS (IMPORTANT FIX)
  if (typeof user !== "object") {
    user = { wallet: Number(user) || 0 };
  }

  // add missing fields without resetting existing ones
  user.wallet ??= 0;
  user.lastDaily ??= 0;
  user.lastWork ??= 0;
  user.lastBeg ??= 0;
  user.lastSteal ??= 0;

  return user;
}

async function saveUser(id, data) {
  await db.set(`user_${id}`, data);
}

module.exports = {
  db,
  getUser,
  saveUser,
};