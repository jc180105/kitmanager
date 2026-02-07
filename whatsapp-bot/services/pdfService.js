const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Gera um PDF com as regras e informações das Kitnets
 * @returns {Promise<string>} Caminho do arquivo PDF gerado
 */
async function generateRulesPDF() {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const filePath = path.join(os.tmpdir(), `folder_kitnets_${Date.now()}.pdf`);
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // --- CABEÇALHO ---
        doc.fontSize(24).font('Helvetica-Bold').text('🏠 Kitnets Praia de Fora', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica').text('R. Porto Reis, 125 - Praia de Fora, Palhoça', { align: 'center', color: 'grey' });
        doc.moveDown(2);

        // --- PREÇO E DESTAQUE ---
        doc.rect(50, 130, 500, 40).fill('#e0f2fe'); // Fundo azul claro
        doc.fillColor('black').fontSize(16).text('💰 Aluguel: R$ 500,00 / mês', 50, 142, { align: 'center', width: 500 });
        doc.moveDown(3);

        // --- REGRAS (Ícones simulados com texto) ---
        const rules = [
            { title: 'Custos Inclusos', desc: 'Água e Luz (Internet não inclusa)', icon: '💧' },
            { title: 'Mobília', desc: 'Kitnets 100% mobiliadas', icon: '🛏️' },
            { title: 'Contrato', desc: 'Mínimo de 6 meses (Caução R$ 450,00)', icon: '📝' },
            { title: 'Garagem', desc: 'Apenas para MOTOS (sem vaga de carro)', icon: '🏍️' },
            { title: 'Lavanderia', desc: 'Conexão para máquina na própria kitnet', icon: '🧺' },
            { title: 'Restrições', desc: 'Máx. 2 pessoas (pref. 1). Sem crianças/pets.', icon: '🚫' },
            { title: 'Silêncio', desc: 'Lei do silêncio após às 22h', icon: '🤫' },
        ];

        let y = 200;
        rules.forEach(rule => {
            doc.fontSize(14).font('Helvetica-Bold').text(rule.title, 60, y);
            doc.fontSize(12).font('Helvetica').text(rule.desc, 60, y + 20);
            y += 50;
        });

        doc.moveDown(2);

        // --- RODAPÉ ---
        doc.rect(0, 700, 612, 100).fill('#1e293b'); // Fundo escuro
        doc.fillColor('white').fontSize(14).text('Agende sua visita!', 0, 720, { align: 'center', width: 612 });
        doc.fontSize(12).text('Segunda a Sexta das 10h às 17h', 0, 745, { align: 'center', width: 612 });
        doc.fontSize(10).text('Contato via WhatsApp', 0, 765, { align: 'center', width: 612 });

        doc.end();

        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
    });
}

module.exports = { generateRulesPDF };
