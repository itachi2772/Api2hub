import http from "http";
import https from "https";
import zlib from "zlib";

export default async function handler(req, res) {
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

  const { searchParams } = new URL(req.url, "http://localhost");
  const type = searchParams.get("type");

  if (!type) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "Missing ?type parameter" }));
  }

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 13; V2040 Build/TP1A.220624.014) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7444.102 Mobile Safari/537.36",
    Accept: "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
    "Accept-Encoding": "gzip, deflate",
    "Accept-Language": "en-US,en;q=0.9",
    Cookie: "PHPSESSID=r978psgjfgg12iv8bps4bhttml",
  };

  let url;

  if (type === "numbers") {
    url = "http://139.99.63.204/ints/client/res/data_smsnumbers.php";
    headers.Referer = "http://139.99.63.204/ints/client/MySMSNumbers";
  } else if (type === "sms") {
    url = "http://139.99.63.204/ints/client/res/data_smscdr.php";
    headers.Referer = "http://139.99.63.204/ints/client/SMSCDRStats";
  } else {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "Invalid type" }));
  }

  try {
    const data = await get(url, headers);
    res.setHeader("Content-Type", "application/json");
    res.end(data);
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Fetch failed", details: err.message }));
  }
}
