const { QuickDB } = require("quick.db");

const db = new QuickDB();

async function getUser(id) {
  let user = await db.get(`user_${id}`);

  if (!user) {
    user = {
      wallet: 0,
      lastDaily: 0,
      lastBeg: 0,
      lastWork: 0,
      lastSteal: 0,
    };

    await db.set(`user_${id}`, user);
  }

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