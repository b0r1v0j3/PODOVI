# Instalacija GitHub CLI za automatsko kreiranje Issues

## Windows (PowerShell)

```powershell
# Instalacija preko winget
winget install --id GitHub.cli

# Ili preko Chocolatey
choco install gh

# Nakon instalacije, autentifikacija
gh auth login
```

## Korak po korak

1. **Instaliraj GitHub CLI:**
   - Windows: `winget install --id GitHub.cli`
   - Mac: `brew install gh`
   - Linux: `sudo apt install gh` ili `sudo yum install gh`

2. **Autentifikuj se:**
   ```bash
   gh auth login
   ```
   - Odaberi GitHub.com
   - Odaberi HTTPS
   - Prihvati da se autentifikuješ preko browser-a

3. **Nakon instalacije i autentifikacije, mogu da kreiram Issues direktno!**

## Alternativa - Ručno kreiranje

Ako ne želiš da instaliraš GitHub CLI, možeš ručno da kreiraš Issue:

1. Idi na: https://github.com/cvetkovicborivoje-hub/PODOVI/issues/new
2. Kopiraj sadržaj iz `GITHUB_ISSUE.md`
3. Zalepi u Issue opis
4. Klikni "Submit new issue"
