# Akaishi Kuroe TikTok API

**Creator:** SovitaChan  
**Platform:** Vercel Serverless Functions (Node.js 18+)

## Endpoints

- `GET /api/health` — health check.
- `GET /api/tiktok?url=ENCODED_TIKTOK_URL` — extract public TikTok video or slideshow metadata/media links.
- `POST /api/tiktok` — JSON body: `{"url":"https://www.tiktok.com/@username/video/123"}`.

Response may include `type` (`video` or `slideshow`), `videoHD`, `videoSD`, `images`, `cover`, `title`, `author`, and `downloadReady`.

## Deploy on Vercel

1. Extract this ZIP.
2. Upload the folder contents to a new GitHub repository, or import that repository in Vercel.
3. In Vercel choose **Add New → Project**, import the repository, then click **Deploy**.
4. No build command or environment variable is required for the first deployment.
5. Open `https://YOUR-PROJECT.vercel.app/api/health`.
6. Test a public TikTok URL using the homepage test form or `/api/tiktok?url=ENCODED_TIKTOK_URL`.

Vercel's standard dashboard import usually imports a Git repository rather than deploying a ZIP directly. You can also deploy from the extracted folder with Vercel CLI.

## Optional API key

The API is public if `API_KEY` is not set. To protect it:
1. Vercel Project → Settings → Environment Variables.
2. Add `API_KEY` with a long random secret.
3. Redeploy.
4. Send requests with header `x-api-key: YOUR_SECRET`.

Do not put the secret in a public repository or share it in chats.

## Important limitations

This project calls the third-party TikWM extractor at `https://www.tikwm.com/api/`. It is **not an official TikTok API**. Availability, no-watermark media variants, and slideshow support can change without notice. This package has not been live-tested against your Vercel project or a real TikTok URL. After deployment, use the health endpoint and homepage test form. The API returns explicit errors instead of pretending extraction succeeded.

Vercel functions return JSON media links; they do not rehost/store the files. The WhatsApp bot can use `videoHD` or iterate over `images` if those URLs remain accessible and the bot's Baileys version supports sending them.
