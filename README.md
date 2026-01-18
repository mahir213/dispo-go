# Dispo-Go

Sistem za upravljanje vozilima i vatrogasnom opremom.

## Funkcionalnosti

- 🚗 Upravljanje vozilima (kamioni, kombiji, terenska vozila, putnička vozila)
- 🧯 Praćenje PP aparata i vatrogasne opreme sa 6-mjesečnom registracijom
- 👤 Autentifikacija i registracija korisnika (email/password)
- 📊 Prikaz vozila u grid layout-u (kao workflowi)
- 🔐 Zaštićene rute sa Better Auth

## Tehnologije

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Prisma** - ORM za bazu podataka
- **PostgreSQL** - Relaciona baza podataka
- **Better Auth** - Autentifikacija
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI komponente
- **Lucide React** - Ikone

## Prisma modeli

### User
- Korisnici sistema sa email/password autentifikacijom

### Vehicle
- Vozila sa informacijama o tipu, registraciji, proizvođaču
- Tipovi: KAMION, KOMBI, TEREN, PUTNICKO

### FireExtinguisher
- PP aparati i vatrogasna oprema
- Praćenje serijskih brojeva, tipova i datuma inspekcija
- Tipovi: PP_APARAT_6KG, PP_APARAT_12KG, CO2_APARAT, PJENA_APARAT

## Instalacija

1. Klonirajte repozitorijum
2. Instalirajte dependencije:
```bash
npm install
```

3. Kopirajte `.env.example` u `.env` i popunite vrijednosti:
```bash
cp .env.example .env
```

4. Pokrenite Prisma migracije:
```bash
npx prisma migrate dev
```

5. Pokrenite development server:
```bash
npm run dev
```

6. Otvorite [http://localhost:3000](http://localhost:3000)

## Prisma komande

```bash
# Generisanje Prisma klijenta
npx prisma generate

# Kreiranje nove migracije
npx prisma migrate dev --name init

# Prisma Studio (GUI za bazu)
npm run studio
```

## Struktura projekta

```
dispo-go/
├── prisma/
│   └── schema.prisma          # Prisma šema
├── src/
│   ├── app/
│   │   ├── (auth)/           # Auth stranice (login, signup)
│   │   ├── (dashboard)/      # Dashboard sa sidebar-om
│   │   │   └── vozila/       # Stranica za vozila
│   │   ├── api/
│   │   │   └── auth/         # Better Auth API rute
│   │   ├── globals.css       # Globalni stilovi
│   │   └── layout.tsx        # Root layout
│   ├── components/
│   │   ├── ui/              # shadcn/ui komponente
│   │   ├── app-sidebar.tsx  # Sidebar komponenta
│   │   ├── login-form.tsx   # Login forma
│   │   ├── register-form.tsx # Registracijska forma
│   │   └── vehicles.tsx     # Komponente za vozila
│   └── lib/
│       ├── auth.ts          # Better Auth konfiguracija
│       ├── auth-client.ts   # Auth klijent
│       ├── auth-utils.ts    # Auth helper funkcije
│       ├── db.ts            # Prisma klijent
│       └── utils.ts         # Utility funkcije
├── .env.example             # Primjer environment varijabli
├── next.config.ts           # Next.js konfiguracija
├── package.json
└── tailwind.config.ts       # Tailwind konfiguracija
```

## Razvoj

Projekat koristi identičnu strukturu i stilove kao nodebase, sa sledećim adaptacijama:

- Umjesto Workflows → **Vozila**
- Fokus na vatrogasnu opremu i vozila
- Bosanski/Hrvatski jezik u interfejsu
- Email/Password autentifikacija (bez GitHub/Google OAuth)

## Licenca

MIT
