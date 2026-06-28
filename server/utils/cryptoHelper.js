const crypto = require('crypto');

const generateRecoveryKey = () => {
    // "DCVR-XXXX-XXXX-XXXX-XXXX"
    const generateBlock = () => crypto.randomBytes(2).toString('hex').toUpperCase();
    return `DCVR-${generateBlock()}-${generateBlock()}-${generateBlock()}-${generateBlock()}`;
};

module.exports = { generateRecoveryKey };
