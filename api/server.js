const http = require("http");
const https = require("https");
const zlib = require("zlib");
const express = require("express");

const app = express();

const get = (url, headers) =>
  new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const request = lib.get(url, { headers }, (response) => {
      let chunks = [];

      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const encoding = response.headers["content-encoding"];

        try {
          if (encoding === "gzip") {
            zlib.gunzip(buffer, (err, decoded) => {
              if (err) return reject(err);
              resolve(decoded.toString());
            });
          } else if (encoding === "deflate") {
            zlib.inflate(buffer, (err, decoded) => {
              if (err) return reject(err);
              resolve(decoded.toString());
            });
          } else {
            resolve(buffer.toString());
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    request.on("error", reject);
  });

app.get("/api/otp", async (req, res) => {
  const type = req.query.type;

  if (!type) {
    return res.status(400).json({ error: "Missing ?type parameter" });
  }

  const headers = {
    "User-Agent": "Mozilla/5.0",
    Accept: "application/json, text/javascript, */*; q=0.01",
    "Accept-Encoding": "gzip, deflate",
    Cookie: "PHPSESSID=p7liveafe7b26ldr602rg4qsi6",
  };

  let url, referer;

  if (type === "numbers") {
    url = "http://139.99.63.204/ints/client/res/data_smsnumbers.php";
    referer = "http://139.99.63.204/ints/client/MySMSNumbers";
  } else if (type === "sms") {
    url = "http://139.99.63.204/ints/client/res/data_smscdr.php";
    referer = "http://139.99.63.204/ints/client/SMSCDRStats";
  } else {
    return res.status(400).json({ error: "Invalid type (use sms or numbers)" });
  }

  headers.Referer = referer;

  try {
    const data = await get(url, headers);
    res.setHeader("Content-Type", "application/json");
    res.send(data);
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", details: err.message });
  }
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Server running!")
);
