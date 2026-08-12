const axios = require("axios");

const API_KEY = "01b3a653-dccb-47e6-ae97-3187f7b938dd";

async function test() {
    try {
        const response = await axios.post(
            "https://api.brightdata.com/datasets/v3/trigger",
            {
                dataset_id: "gd_l1viktl72bvl7bjuj0",
                input: [
                    {
                        url: "https://www.linkedin.com/in/satyanadella/"
                    }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log(response.data);
    } catch (err) {
        console.log(err.response?.data || err.message);
    }
}

test();