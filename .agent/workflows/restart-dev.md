---
description: Stop running dev server, clear cache, and restart
---

// turbo-all

1. Kill any running dev server on port 3000
```bash
npx kill-port 3000
```

2. Remove Next.js cache
```bash
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
```

3. Start fresh dev server
```bash
npm run dev
```
