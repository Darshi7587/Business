# 🚀 Deployment Guide

## Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/insightgpt-enterprise)

### Step-by-Step Deployment:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel auto-detects Next.js configuration

3. **Add Environment Variables**
   In Vercel dashboard → Settings → Environment Variables, add:
   ```
   GEMINI_API_KEY=your_primary_api_key
   GEMINI_API_KEY_BACKUP=your_backup_api_key
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live at `https://your-app.vercel.app`

### Automatic Deployments
- Every push to `main` branch auto-deploys
- Preview deployments for pull requests
- Instant rollbacks available

---

## Alternative: Deploy to Netlify

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy via Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

3. **Set environment variables** in Netlify dashboard

---

## Environment Variables Checklist

Ensure these are set in your deployment platform:

- ✅ `GEMINI_API_KEY` (required)
- ✅ `GEMINI_API_KEY_BACKUP` (optional but recommended)

---

## Post-Deployment Testing

Test these endpoints after deployment:

- **Homepage**: `https://your-app.vercel.app/`
- **API Health**: `https://your-app.vercel.app/api/data`
- **Chat Interface**: `https://your-app.vercel.app/copilot`

---

## Performance Optimization

For production deployment:

1. **Enable Edge Functions** (if available)
2. **Add caching headers** for static assets
3. **Monitor API usage** in Gemini dashboard
4. **Set up error tracking** (Sentry, LogRocket)

---

## Troubleshooting

**Issue: API Key not working**
- Verify environment variables are set correctly
- Check API key has sufficient quota
- Ensure no extra spaces in .env values

**Issue: Build fails**
- Run `npm run build` locally first
- Check Node.js version (should be 18+)
- Clear `.next` folder and rebuild

**Issue: Slow response times**
- Check Gemini API quota limits
- Consider upgrading to paid tier
- Add response caching layer

---

## Custom Domain

To add a custom domain:
1. Go to Vercel dashboard → Domains
2. Add your domain (e.g., `insightgpt.yourdomain.com`)
3. Update DNS records as shown
4. SSL certificate auto-generates

---

**Your app is production-ready! 🎉**
