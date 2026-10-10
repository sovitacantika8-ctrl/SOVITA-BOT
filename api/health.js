export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    status: true,
    name: "Akaishi Kuroe TikTok API",
    creator: "SovitaChan",
    message: "API is online",
    endpoints: {
      info: "/api/tiktok?url=VIDEO_URL",
      health: "/api/health"
    },
    note: "TikTok media extraction depends on the upstream TikWM service."
  });
}
