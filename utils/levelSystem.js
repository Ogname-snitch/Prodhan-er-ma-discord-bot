function getRequiredXP(level) {
  if (level === 0) return 50;
  return 50 + (level * 10);
}

function getLevelReward(level) {
  if (level === 1) return 30;
  if (level === 2) return 35;
  if (level === 3) return 40;
  if (level === 4) return 50;
  if (level === 5) return 60;
  return 60;
}

module.exports = {
  getRequiredXP,
  getLevelReward,
};