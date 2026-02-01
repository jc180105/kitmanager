import jsPDF from 'jspdf';

export const generateContract = (kitnet) => {
    const doc = new jsPDF();

    // Configurações de fonte
    doc.setFont('times', 'normal');
    doc.setFontSize(12);

    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);

    // Título
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('CONTRATO DE LOCAÇÃO RESIDENCIAL', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('times', 'normal');

    // Dados
    const today = new Date().toLocaleDateString('pt-BR');
    const valor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kitnet.valor);
    const inquilino = kitnet.inquilino_nome || '_______________________________';
    const telefone = kitnet.inquilino_telefone || '_________________';
    const cpf = kitnet.inquilino_cpf || '_________________';
    const rg = kitnet.inquilino_rg || '_________________';
    const dataEntrada = kitnet.data_entrada ? new Date(kitnet.data_entrada).toLocaleDateString('pt-BR') : '___/___/_____';
    const diaVencimento = kitnet.dia_vencimento || '___';

    // Texto do Contrato
    const text = [
        `Pelo presente instrumento particular, de um lado o(a) LOCADOR(A) responsável pela administração das Kitnets.`,
        ``,
        `E de outro lado, ${inquilino}, portador(a) do RG nº ${rg} e CPF nº ${cpf}, contato ${telefone}, doravante denominado(a) LOCATÁRIO(A).`,
        ``,
        `As partes têm, entre si, justo e contratado o seguinte:`,
        ``,
        `1. OBJETO: O presente contrato tem como objeto a locação da Kitnet de número ${kitnet.numero}, para fins exclusivamente residenciais.`,
        ``,
        `2. PRAZO: A locação terá início em ${dataEntrada}, com prazo indeterminado, podendo ser rescindido por qualquer das partes mediante aviso prévio de 30 dias.`,
        ``,
        `3. VALOR: O aluguel mensal é de ${valor}, devendo ser pago até o dia ${diaVencimento} de cada mês.`,
        ``,
        `4. ATRASO: O não pagamento no prazo estipulado sujeitará o(a) LOCATÁRIO(A) a multa de 2% e juros de 1% ao mês.`,
        ``,
        `5. CONSERVAÇÃO: O(A) LOCATÁRIO(A) recebe o imóvel em perfeito estado de conservação e limpeza, obrigando-se a devolvê-lo nas mesmas condições.`,
        ``,
        `6. PROIBIÇÕES: É proibido sublocar o imóvel, realizar obras sem autorização ou utilizar o imóvel para fins comerciais ou ilícitos.`,
        ``,
        `7. RESCISÃO: A infração de qualquer cláusula deste contrato ensejará sua rescisão imediata.`,
        ``,
        `E por estarem justos e contratados, assinam o presente em 2 (duas) vias de igual teor.`,
        ``,
        ``,
        `Cidade/UF, ${today}.`,
        ``,
        ``,
        `__________________________________________`,
        `LOCADOR (Proprietário)`,
        ``,
        ``,
        `__________________________________________`,
        `LOCATÁRIO: ${inquilino}`,
    ];

    let y = 40;

    text.forEach(line => {
        // Se a linha for muito longa, quebra
        const splitLines = doc.splitTextToSize(line, contentWidth);

        // Verifica se cabe na página
        if (y + (splitLines.length * 7) > 280) {
            doc.addPage();
            y = 20;
        }

        doc.text(splitLines, margin, y);
        y += (splitLines.length * 7);
    });

    // Save
    doc.save(`Contrato_Kitnet_${kitnet.numero}_${inquilino.replace(/\s+/g, '_')}.pdf`);
};
