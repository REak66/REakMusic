const axios = require('axios');
const url = 'https://api-bakong.nbc.gov.kh/v1/check_bakong_account';
(async () => {
    try {
        const res = await axios.post(url, { accountId: "vannak_dim@cadi" });
        console.log("vannak_dim@cadi:", res.data);
    } catch(e) { console.error(e.response?.data || e.message); }
})();
