const APP_NAME = "Akaishi Kuroe TikTok API";
const UPSTREAM = "https://www.tikwm.com/api/";

function send(res, status, body) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
  return res.status(status).json(body);
}

function validTikTokUrl(value) {
  try {
    const u = new URL(value);
    const host = u.hostname.toLowerCase();
    return u.protocol === "https:" && [
      "tiktok.com", "www.tiktok.com", "m.tiktok.com",
      "vm.tiktok.com", "vt.tiktok.com"
    ].includes(host);
  } catch {
    return false;
  }
}

function normalize(data, originalUrl) {
  const author = data.author || {};
  const images = Array.isArray(data.images)
    ? data.images.filter(x => typeof x === "string" && x.startsWith("https://"))
    : [];
  const video = data.hdplay || data.play || null;
  const isSlides = images.length > 0 && !video;

  return {
    status: true,
    creator: "SovitaChan",
    api: APP_NAME,
    platform: "tiktok",
    type: isSlides ? "slideshow" : (video ? "video" : "unknown"),
    title: data.title || "",
    author: author.nickname || author.unique_id || "Unknown",
    username: author.unique_id || "",
    duration: Number(data.duration || 0),
    cover: data.cover || data.origin_cover || null,
    music: data.music || null,
    video: video,
    videoSD: data.play || null,
    videoHD: data.hdplay || data.play || null,
    images,
    imageCount: images.length,
    originalUrl,
    downloadReady: Boolean(video || images.length),
    message: video
      ? "Video URL ditemukan; ketersediaan bergantung pada layanan extractor."
      : images.length
        ? "Slide foto ditemukan; URL gambar tersedia pada field images."
        : "Data diterima, tetapi media unduhan tidak ditemukan."
  };
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
    return res.status(204).end();
  }

  if (!["GET", "POST"].includes(req.method)) {
    return send(res, 405, { status: false, message: "Gunakan GET atau POST." });
  }

  // Optional: add API_KEY in Vercel environment variables to protect the endpoint.
  if (process.env.API_KEY) {
    const provided = req.headers["x-api-key"] ||
      (req.method === "GET" ? req.query?.key : req.body?.key);
    if (provided !== process.env.API_KEY) {
      return send(res, 401, { status: false, message: "API key salah atau belum dikirim." });
    }
  }

  let input = req.method === "GET" ? req.query?.url : req.body?.url;
  if (Array.isArray(input)) input = input[0];

  if (typeof input !== "string" || !input.trim()) {
    return send(res, 400, {
      status: false,
      message: "Parameter url wajib diisi.",
      example: "/api/tiktok?url=https%3A%2F%2Fwww.tiktok.com%2F%40username%2Fvideo%2F123"
    });
  }

  input = input.trim();
  if (!validTikTokUrl(input)) {
    return send(res, 400, {
      status: false,
      message: "URL harus berupa tautan HTTPS TikTok yang valid."
    });
  }

  try {
    const upstreamUrl = new URL(UPSTREAM);
    upstreamUrl.searchParams.set("url", input);
    upstreamUrl.searchParams.set("hd", "1");

    const upstream = await fetch(upstreamUrl.toString(), {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; AkaishiKuroeAPI/1.0)"
      },
      signal: AbortSignal.timeout(20000)
    });

    if (!upstream.ok) {
      return send(res, 502, {
        status: false,
        code: "UPSTREAM_HTTP_ERROR",
        upstreamStatus: upstream.status,
        message: "Layanan extractor tidak tersedia. Coba lagi nanti."
      });
    }

    let payload;
    try {
      payload = await upstream.json();
    } catch {
      return send(res, 502, {
        status: false,
        code: "UPSTREAM_INVALID_JSON",
        message: "Extractor mengembalikan respons yang bukan JSON."
      });
    }

    if (payload?.code !== 0 || !payload?.data) {
      return send(res, 502, {
        status: false,
        code: "EXTRACTION_FAILED",
        upstreamMessage: payload?.msg || null,
        message: "TikTok gagal diproses. Link mungkin privat atau extractor sedang bermasalah."
      });
    }

    const result = normalize(payload.data, input);
    if (!result.downloadReady) {
      return send(res, 502, {
        status: false,
        code: "MEDIA_NOT_FOUND",
        message: "Extractor merespons, tetapi URL video/gambar tidak ditemukan."
      });
    }

    return send(res, 200, result);
  } catch (error) {
    const timeout = error?.name === "TimeoutError";
    return send(res, 502, {
      status: false,
      code: timeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_CONNECTION_ERROR",
      message: timeout
        ? "Extractor melewati batas waktu 20 detik."
        : "Gagal menghubungi layanan extractor.",
      detail: "Coba lagi nanti. Hasil bergantung pada layanan TikWM."
    });
  }
}
