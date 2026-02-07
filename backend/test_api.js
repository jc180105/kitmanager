const http = require('http');

const id = 25; // Known valid ID from debug script
const url = `http://localhost:3001/pagamentos/detalhes/${id}`;

console.log(`Fetching ${url}...`);

http.get(url, (res) => {
    let data = '';

    console.log(`Status Code: ${res.statusCode}`);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Body:', data);
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
