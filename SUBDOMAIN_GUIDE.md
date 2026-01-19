# 🌐 Blog Subdomain Guide (blog.villen.me)

Currently, your blog lives at `villen.me/blog`. 
If you want it to be accessible at `blog.villen.me` but still share the same code and login system, here is how to do it on Vercel.

## Option 1: The Easy Way (Redirect)
This simply makes `blog.villen.me` redirect users to `villen.me/blog`.

1.  **Vercel Dashboard** > Select Project.
2.  **Settings** > **Domains**.
3.  Add `blog.villen.me`.
4.  Click **Edit** next to it.
5.  **Redirect to**: `https://villen.me/blog`
6.  **Status Code**: 307 (Temporary) or 308 (Permanent).

*Result: User types `blog.villen.me` -> Browser goes to `villen.me/blog`.*

---

## Option 2: The "Advanced" Way (Rewrite)
This keeps `blog.villen.me` in the address bar but shows the content of the `/blog` page.

### 1. Update `vercel.json`
Update your `frontend/vercel.json` to handle multi-domain routing:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "has": [
        {
          "type": "host",
          "value": "blog.villen.me"
        }
      ],
      "destination": "/blog/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2. Add Domain in Vercel
1.  **Vercel Dashboard** > Settings > Domains.
2.  Add `blog.villen.me`.
3.  **IMPORTANT**: Do **NOT** set a redirect for this one. Leave it as a standard domain.

### 3. Add DNS Record
In your Domain Registrar (Namecheap/GoDaddy):
*   **Type**: `CNAME`
*   **Name**: `blog`
*   **Value**: `cname.vercel-dns.com`

---

## ❓ Which one should I choose?
*   **Use Option 1 (Redirect)** if you just want a shortcut. It's safer and avoids SEO confusion.
*   **Use Option 2 (Rewrite)** if you want `blog.villen.me` to feel like a completely separate site. Note that you might need to adjust some React links to handle the base path correctly.
