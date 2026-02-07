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

const validatePaymentMethod = (method) => {
    // Allow null/undefined as sometimes payment is just toggled without method (e.g. undoing payment)
    if (!method) return true;

    const allowed = [
        'Dinheiro',
        'Pix - Nubank',
        'Pix - Bradesco',
        'Pix - Inter',
        'Pix - Caixa'
    ];
    return allowed.includes(method);
};

module.exports = {
    validateId,
    validateValor,
    validateStatus,
    validatePaymentMethod
};
