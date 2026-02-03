const validateId = (id) => {
    const parsed = parseInt(id);
    return !isNaN(parsed) && parsed > 0;
};

const validateValor = (valor) => {
    const parsed = parseFloat(valor);
    return !isNaN(parsed) && parsed > 0;
};

const validateStatus = (status) => {
    return ['livre', 'alugada'].includes(status);
};

module.exports = {
    validateId,
    validateValor,
    validateStatus
};
