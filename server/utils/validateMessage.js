module.exports = function validateMessage(message) {
    if (typeof message !== 'string') return null;
    const cleanMessage = message.trim();
    if (cleanMessage.length === 0) return null;
    return cleanMessage;
};
