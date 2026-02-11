---
description: Clean Next.js cache and rebuild
---

// turbo-all

1. Remove Next.js cache
```bash
Remove-Item -Recurse -Force .next
```

2. Run fresh build
```bash
npx next build
```
