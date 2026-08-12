const axios = require("axios");

// =========================
// REPLACE WITH YOUR API KEY
// =========================
const API_KEY = "01b3a653-dccb-47e6-ae97-3187f7b938dd";

async function testLinkedIn() {
    try {
        const response = await axios.post(
            "https://api.brightdata.com/datasets/v3/scrape?dataset_id=gd_l1viktl72bvl7bjuj0&notify=false&include_errors=true",
            {
                input: [
                    {
                        url: "https://www.linkedin.com/in/ragul-kpr/",
                    },
                ],
                limit_per_input: 1,
            },
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("======================================");
        console.log("SUCCESS");
        console.log("======================================");
        console.log(response.data);
    } catch (err) {
        console.log("======================================");
        console.log("ERROR");
        console.log("======================================");

        if (err.response) {
            console.log("Status:", err.response.status);
            console.log("Data:");
            console.log(err.response.data);
        } else {
            console.log(err.message);
        }
    }
}

testLinkedIn();