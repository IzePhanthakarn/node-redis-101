const express = require("express");
const axios = require("axios");
const redis = require("redis");
const { promisify } = require("util");

const app = express();
const redisClient = redis.createClient({
  legacyMode: true,
});
async function connectRedis() {
  await redisClient.connect();
}

connectRedis()
  .then(() => {
    console.log("Redis connected");

    const asyncGet = promisify(redisClient.get).bind(redisClient);

    // Get data without radis
    app.get("/", async (req, res) => {
      const username = req.query.username || "izephanthakarn";
      const url = `https://api.github.com/users/${username}`;
      const response = await axios.get(url);
      res.json(response.data);
    });

    // Get data and set with radis
    app.get("/redis", async (req, res) => {
      const username = req.query.username || "izephanthakarn";
      const url = `https://api.github.com/users/${username}`;

      const reply = await asyncGet(username);
      if (reply) {
        return res.json(JSON.parse(reply));
      }

      const response = await axios.get(url);
      redisClient.setex(username, 10, JSON.stringify(response.data));

      return res.json(response.data);
    });

    // Clear data in radis
    app.get("/redis/clear", async (req, res) => {
      try {
        const username = req.query.username || "izephanthakarn";
        await redisClient.del(username);
        res.json({ result: "OK" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "เกิดข้อผิดพลาดในการลบข้อมูลใน Redis" });
      }
    });
  })
  .catch((error) => {
    console.error("Redis connection error:", error);
  });

app.listen(3000, () => {
  console.log("start in port 3000");
});
