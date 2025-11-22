// 🔥 Force Node.js Runtime (MOST IMPORTANT)
export const config = {
  runtime: "nodejs20.x"
};

import http from "http";
import https from "https";
import zlib from "zlib";

export default async function handler(req, res) {
  const get = (url) =>
    fetch(url)
      .then((r) => r.text())
      .catch((e) => "");

  const { searchParams } = new URL(req.url, "http://localhost");
  const type = searchParams.get("type");

  if (!type) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "Missing ?type parameter" }));
  }

  let targetURL = "";

  if (type === "numbers") {
    targetURL =
      "http://139.99.63.204/ints/client/res/data_smsnumbers.php";
  } else if (type === "sms") {
    targetURL =
      "http://139.99.63.204/ints/client/res/data_smscdr.php";
  } else {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "Invalid type (use sms or numbers)" }));
  }

  // 🔥 Proxy (Because direct HTTP block ho raha hai)
  const proxyURL =
    "https://api.allorigins.win/raw?url=" + encodeURIComponent(targetURL);

  try {
    const data = await get(proxyURL);
    res.setHeader("Content-Type", "application/json");
    res.end(data);
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Fetch failed", details: err.message }));
  }
}
