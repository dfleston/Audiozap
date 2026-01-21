const axios = require('axios');

async function testLNBits() {
    const LNBITS_URL = 'http://lnbits:5000';
    const ADMIN_KEY = '78ce29be362a409a9099948baac8ea00';

    console.log('Testing LNBits API...');
    console.log('URL:', LNBITS_URL);
    console.log('Admin Key:', ADMIN_KEY);

    try {
        // Test 1: GET users
        console.log('\n1. Testing GET /usermanager/api/v1/users');
        const getResponse = await axios.get(
            `${LNBITS_URL}/usermanager/api/v1/users`,
            { headers: { 'X-Api-Key': ADMIN_KEY } }
        );
        console.log('✓ GET Success:', getResponse.status);
        console.log('Users:', JSON.stringify(getResponse.data, null, 2));
    } catch (e) {
        console.log('✗ GET Failed:', e.response?.status, e.response?.data || e.message);
    }

    try {
        // Test 2: POST create user
        console.log('\n2. Testing POST /usermanager/api/v1/users');
        const postResponse = await axios.post(
            `${LNBITS_URL}/usermanager/api/v1/users`,
            {
                user_name: 'Test Artist',
                wallet_name: 'Test Wallet'
            },
            { headers: { 'X-Api-Key': ADMIN_KEY, 'Content-Type': 'application/json' } }
        );
        console.log('✓ POST Success:', postResponse.status);
        console.log('Created:', JSON.stringify(postResponse.data, null, 2));
    } catch (e) {
        console.log('✗ POST Failed:', e.response?.status, e.response?.data || e.message);
    }
}

testLNBits();
