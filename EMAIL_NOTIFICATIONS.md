# Email Notifikacije - Uputstvo za Konfiguraciju

## Pregled

Sistem email notifikacija automatski obavještava korisnike kada vozilima ističu dokumenti ili pregledi (šestomjesečni pregled, registracija, PP aparat).

## Kako radi

1. **Dnevna provjera** - Svaki dan u 8:00 ujutro (UTC) pokreće se automatska provjera
2. **Filtriranje** - Provjeravaju se samo korisnici koji imaju uključene notifikacije
3. **Personalizacija** - Svaki korisnik može podesiti koliko dana unaprijed želi biti obaviješten (7-90 dana)
4. **Email slanje** - Ako ima vozila koja ističu, šalje se HTML email sa detaljima

## Konfiguracija

### 1. Resend Account

1. Idi na [resend.com](https://resend.com) i napravi besplatan nalog
2. Verifikuj svoj email
3. Kreiraj API Key u Resend dashboard-u
4. Dodaj API key u `.env` fajl:

```env
RESEND_API_KEY="re_your_api_key_here"
```

### 2. Email "From" Adresa

Za development (besplatno):
```env
EMAIL_FROM="Dispo-Go <onboarding@resend.dev>"
```

Za production (potrebna verifikovana domena):
```env
EMAIL_FROM="Dispo-Go <notifications@yourdomain.com>"
```

Da bi koristio svoju domenu:
1. Dodaj domenu u Resend dashboard
2. Postavi DNS zapise koje Resend pruži
3. Sačekaj verifikaciju (obično par minuta)

### 3. Cron Job Secret (opciono)

Za dodatnu sigurnost, zaštiti cron endpoint:

```env
CRON_SECRET="generiši-dugi-random-string-ovdje"
```

### 4. App URL

```env
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

## Deployment na Vercel

Vercel automatski prepoznaje `vercel.json` i postavlja cron job:

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

**Napomena:** Cron jobs su dostupni samo na Vercel Pro plan-u ($20/mjesečno).

### Alternativa: Eksterne Cron Services (besplatno)

Ako ne želiš platiti Vercel Pro, koristi eksterne servise:

#### 1. **cron-job.org** (preporučeno)
- Registruj se na [cron-job.org](https://cron-job.org)
- Kreiraj novi cron job:
  - URL: `https://your-domain.com/api/cron/check-expiry`
  - Schedule: `0 8 * * *` (svaki dan u 8:00)
  - Header: `Authorization: Bearer your-cron-secret`

#### 2. **EasyCron**
- Besplatan do 100 cron jobs
- [easycron.com](https://www.easycron.com)

#### 3. **GitHub Actions**
Dodaj `.github/workflows/cron.yml`:

```yaml
name: Daily Vehicle Check
on:
  schedule:
    - cron: '0 8 * * *'
  workflow_dispatch:

jobs:
  check-expiry:
    runs-on: ubuntu-latest
    steps:
      - name: Call API
        run: |
          curl -X GET "https://your-domain.com/api/cron/check-expiry" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Korisničke Postavke

Korisnici mogu upravljati notifikacijama na `/postavke` stranici:

- **Uključi/isključi** email obavještenja
- **Podesi period** - koliko dana unaprijed biti obaviješten (7-90 dana)

Default postavke:
- Email notifikacije: **Uključene**
- Period obavještenja: **30 dana**

## Testiranje

### Manualno pokreni provjeru:

```bash
curl -X GET "http://localhost:3000/api/cron/check-expiry" \
  -H "Authorization: Bearer your-cron-secret"
```

Ili bez secret-a (ako nije postavljen):

```bash
curl -X GET "http://localhost:3000/api/cron/check-expiry"
```

Response:
```json
{
  "success": true,
  "emailsSent": 2,
  "emails": ["user1@example.com", "user2@example.com"],
  "timestamp": "2026-01-18T14:30:00.000Z"
}
```

### Testiranje sa specifičnim datumima:

1. Dodaj vozilo sa datumom koji ističe za 15 dana
2. Postavi notificationDaysBefore na 30 dana
3. Pokreni cron endpoint
4. Provjeri email

## Email Template

Email sadrži:
- **Header** sa logom i naslovom
- **Lista vozila** sa:
  - Naziv i registracija
  - Koji dokument ističe
  - Datum isteka
  - Koliko dana preostaje
- **CTA button** - link na stranicu sa vozilima
- **Footer** sa informacijama o isključivanju

## Struktura Fajlova

```
src/
├── app/
│   ├── api/
│   │   ├── cron/
│   │   │   └── check-expiry/
│   │   │       └── route.ts       # Cron endpoint
│   │   └── user/
│   │       └── settings/
│   │           └── route.ts       # Update postavki
│   └── (dashboard)/
│       └── postavke/
│           └── page.tsx           # Postavke stranica
├── components/
│   └── settings-form.tsx          # Form za postavke
└── lib/
    ├── resend.ts                  # Resend konfiguracija
    └── email-templates.ts         # Email HTML/text template
```

## Cron Schedule Format

Format: `minute hour day month dayOfWeek`

Primjeri:
- `0 8 * * *` - Svaki dan u 8:00 UTC
- `0 9 * * 1` - Svaki ponedjeljak u 9:00 UTC
- `0 */6 * * *` - Svakih 6 sati
- `0 8 1 * *` - Prvi dan u mjesecu u 8:00 UTC

## FAQ

**Q: Zašto ne dobijam emailove?**
- Provjeri da li je RESEND_API_KEY pravilno postavljen
- Provjeri da li korisnik ima uključene notifikacije
- Provjeri da li ima vozila sa datumima koji ističu u periodu
- Provjeri Resend dashboard za errore

**Q: Mogu li promijeniti vrijeme slanja?**
- Da, promijeni schedule u `vercel.json`
- Npr. za 6 ujutro: `"schedule": "0 6 * * *"`

**Q: Koliko košta?**
- Resend: Besplatan do 3,000 emaila/mjesečno
- Vercel Cron: Zahtijeva Pro plan ($20/mjesec) ILI koristi eksterne servise (besplatno)

**Q: Šta ako imam više od 3000 korisnika?**
- Upgrade Resend plan ili koristi drugi email provider (SendGrid, AWS SES)
