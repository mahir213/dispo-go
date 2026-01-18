# 📧 Email Notifikacije - Brzi Start

## ✅ Šta je implementirano

Email sistem koji automatski obavještava korisnike kada vozilima ističu:
- 🔍 Šestomjesečni pregled
- 📋 Registracija  
- 🧯 PP Aparat

## 🚀 Setup (5 minuta)

### 1. Instaliraj Resend paket ✓
```bash
npm install resend  # ✓ Već urađeno
```

### 2. Kreiraj Resend Account

1. Idi na **[resend.com](https://resend.com)** i registruj se (besplatno)
2. Verifikuj email
3. U dashboard-u kreiraj **API Key**
4. Kopiraj key

### 3. Dodaj Environment Variables

Kreiraj `.env` fajl (ili dodaj u postojeći):

```env
# Resend
RESEND_API_KEY="re_tvoj_api_key_ovdje"
EMAIL_FROM="Dispo-Go <onboarding@resend.dev>"

# Optional - za sigurnost cron endpointa
CRON_SECRET="generiši-random-string-123"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Pokreni Migraciju ✓

```bash
npx prisma migrate dev  # ✓ Već urađeno - dodano emailNotificationsEnabled i notificationDaysBefore
```

### 5. Deploy na Vercel

```bash
git add .
git commit -m "Add email notifications system"
git push

# Na Vercel dashboard dodaj environment variables:
# RESEND_API_KEY=...
# EMAIL_FROM=...
# CRON_SECRET=...
```

## 🧪 Testiranje

### Lokalno:

1. Idi na **http://localhost:3000/postavke**
2. Uključi email notifikacije
3. Klikni "**Pokreni provjeru**" u Test Email sekciji
4. Provjeri konzolu za rezultat

### Via API:

```bash
curl http://localhost:3000/api/cron/check-expiry
```

## 📱 Korištenje

### Za Korisnike:

1. Idi na **Postavke** (sidebar)
2. **Omogući email obavještenja** - Uključi/isključi
3. **Koliko dana unaprijed** - Odaberi (7-90 dana, default 30)
4. Spremi promjene

### Za Developere:

Automatski cron job se pokreće **svaki dan u 8:00 UTC**.

Struktura:
```
src/
├── app/api/cron/check-expiry/route.ts    # ⏰ Cron endpoint
├── app/api/user/settings/route.ts        # ⚙️ Update postavki
├── app/(dashboard)/postavke/page.tsx     # 🎨 UI stranica
├── components/
│   ├── settings-form.tsx                 # 📝 Form za postavke
│   └── test-email-button.tsx            # 🧪 Test dugme
└── lib/
    ├── resend.ts                        # 📧 Email config
    └── email-templates.ts                # 📄 HTML templates
```

## ⚙️ Cron Job Options

### Option 1: Vercel Cron (Pro Plan - $20/mj) ✓

Već konfigurisano u `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-expiry",
      "schedule": "0 8 * * *"
    }
  ]
}
```

### Option 2: Externe Servise (Besplatno) 

#### **cron-job.org** (preporučeno)
1. Registruj se na [cron-job.org](https://cron-job.org)
2. Kreiraj job:
   - URL: `https://your-domain.com/api/cron/check-expiry`
   - Schedule: Svaki dan u 8:00
   - Header: `Authorization: Bearer your-cron-secret`

#### **GitHub Actions**
Dodaj `.github/workflows/cron.yml`:
```yaml
name: Check Vehicle Expiry
on:
  schedule:
    - cron: '0 8 * * *'
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - run: curl https://your-domain.com/api/cron/check-expiry -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## 📊 Features

✅ **Personalizovani emailovi** - HTML sa logom i styling  
✅ **Korisničke preference** - Svako bira periode notifikacija  
✅ **Multi-datum provjera** - Svi datumi u jednom emailu  
✅ **Responsive design** - Izgleda dobro na svim uređajima  
✅ **Test funkcionalnost** - Lako testiraj bez čekanja cron-a  
✅ **Error handling** - Loguje greške za debugging  

## 💰 Troškovi

- **Resend**: Besplatan do 3,000 emaila/mjesečno
- **Vercel Cron**: $20/mjesec (Pro plan) ili koristi eksterne besplatne
- **Eksterne cron**: Besplatno (cron-job.org, GitHub Actions)

## 🎨 Email Izgled

Email sadrži:
- 🎨 Profesionalni header
- 📋 Lista vozila sa detalj ima
- 🎨 Color-coded warning (crveno/narandžasto)
- 📅 Datum isteka i preostali dani
- 🔗 Link za pregled vozila
- ℹ️ Info kako isključiti notifikacije

## 📚 Dodatna Dokumentacija

Detaljnije uputstvo: [EMAIL_NOTIFICATIONS.md](./EMAIL_NOTIFICATIONS.md)

## ❓ Problemi?

1. **Ne dolaze emailovi?**
   - Provjeri RESEND_API_KEY
   - Provjeri Resend dashboard za errore
   - Provjeri da li korisnik ima notifikacije uključene
   - Testni endpoint: `/api/cron/check-expiry`

2. **Cron ne radi?**
   - Vercel Pro plan potreban ZA Vercel cron
   - Ili koristi eksterne servise (besplatno)

3. **Testiranje?**
   - Idi na Postavke → Klikni "Pokreni provjeru"
   - Ili curl endpoint direktno

## ✨ Gotovo!

Sistem je spreman za korištenje. Korisnici mogu odmah podesiti svoje preference na `/postavke` stranici!
