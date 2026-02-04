function validateMessage(msg) {
  if (!msg) return false;
  if (typeof msg !== "string") return false;
  if (msg.length > 500) return false;
  return true;
}

module.exports = validateMessage;
