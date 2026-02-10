// using global fetch (Node 18+)

async function run() {
    const kitnetId = 3; // Kitnet 3 from screenshot
    const backendUrl = 'http://localhost:3001'; // Default port

    try {
        console.log(`Checking Kitnet ${kitnetId} status...`);
        // 1. Get current status
        const response1 = await fetch(`${backendUrl}/kitnets?search=${kitnetId}`);
        if (!response1.ok) throw new Error(`Failed to fetch kitnet: ${response1.statusText}`);
        const data1 = await response1.json();
        const kitnet = data1.find(k => k.id === kitnetId || k.numero === kitnetId);

        if (!kitnet) {
            console.error('Kitnet 3 not found via API. Listing all:');
            console.log(data1.map(k => `${k.id}: ${k.numero}`));
            return;
        }

        console.log(`Current Status: ${kitnet.status}`);

        // 2. Toggle Status
        console.log('Attempting to toggle status via PUT /kitnets/:id/status...');
        const response2 = await fetch(`${backendUrl}/kitnets/${kitnet.id}/status`, {
            method: 'PUT'
        });

        if (!response2.ok) {
            const errText = await response2.text();
            throw new Error(`Failed to toggle status: ${response2.statusText} - ${errText}`);
        }

        const updatedKitnet = await response2.json();
        console.log(`New Status: ${updatedKitnet.status}`);

        if (updatedKitnet.status === kitnet.status) {
            console.error('FAIL: Status did not change!');
        } else {
            console.log('SUCCESS: Status toggled correctly.');
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.cause) console.error(error.cause);
    }
}

run();
