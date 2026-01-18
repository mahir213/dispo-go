import { format } from "date-fns";

interface ExpiringVehicle {
  name: string;
  registrationNumber: string;
  expiringItem: string;
  expiryDate: Date;
  daysUntilExpiry: number;
}

interface VehicleExpiryEmailProps {
  userName: string;
  vehicles: ExpiringVehicle[];
}

export function VehicleExpiryEmailTemplate({ userName, vehicles }: VehicleExpiryEmailProps) {
  return `
<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Obavještenje o isteku dokumenata</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
    }
    .header h1 {
      color: #dc2626;
      margin: 0;
      font-size: 24px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
    }
    .vehicle-card {
      background-color: #fef2f2;
      border-left: 4px solid #dc2626;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 4px;
    }
    .vehicle-card.warning {
      background-color: #fff7ed;
      border-left-color: #f97316;
    }
    .vehicle-name {
      font-weight: bold;
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 5px;
    }
    .registration {
      font-family: 'Courier New', monospace;
      color: #6b7280;
      margin-bottom: 10px;
    }
    .expiry-info {
      margin-top: 10px;
    }
    .expiry-item {
      font-weight: 600;
      color: #dc2626;
    }
    .expiry-date {
      color: #4b5563;
    }
    .days-warning {
      display: inline-block;
      background-color: #dc2626;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 5px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #f0f0f0;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .cta-button {
      display: inline-block;
      background-color: #2563eb;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Obavještenje o isteku dokumenata</h1>
    </div>
    
    <div class="greeting">
      Poštovani/a ${userName},
    </div>
    
    <p>
      Obavještavamo Vas da sljedećim vozilima uskoro ističu važni dokumenti ili pregledi:
    </p>
    
    ${vehicles.map(vehicle => `
    <div class="vehicle-card ${vehicle.daysUntilExpiry <= 7 ? '' : 'warning'}">
      <div class="vehicle-name">${vehicle.name}</div>
      <div class="registration">${vehicle.registrationNumber}</div>
      <div class="expiry-info">
        <div class="expiry-item">${vehicle.expiringItem}</div>
        <div class="expiry-date">
          Datum isteka: <strong>${format(vehicle.expiryDate, "dd.MM.yyyy")}</strong>
        </div>
        <span class="days-warning">
          ${vehicle.daysUntilExpiry === 0 ? 'ISTIČE DANAS!' : 
            vehicle.daysUntilExpiry === 1 ? 'Ističe sutra!' : 
            `Ističe za ${vehicle.daysUntilExpiry} dana`}
        </span>
      </div>
    </div>
    `).join('')}
    
    <p style="margin-top: 25px;">
      Molimo Vas da pravovremeno obnovite potrebne dokumente kako biste izbjegli probleme u radu.
    </p>
    
    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/vozila" class="cta-button">
        Pogledaj vozila
      </a>
    </div>
    
    <div class="footer">
      <p>
        Ovo je automatska poruka iz sistema Dispo-Go.<br>
        Ukoliko ne želite primati ova obavještenja, možete ih isključiti u postavkama profila.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getVehicleExpiryEmailText({ userName, vehicles }: VehicleExpiryEmailProps) {
  return `
Poštovani/a ${userName},

Obavještavamo Vas da sljedećim vozilima uskoro ističu važni dokumenti ili pregledi:

${vehicles.map(vehicle => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${vehicle.name} (${vehicle.registrationNumber})
${vehicle.expiringItem}
Datum isteka: ${format(vehicle.expiryDate, "dd.MM.yyyy")}
${vehicle.daysUntilExpiry === 0 ? 'ISTIČE DANAS!' : 
  vehicle.daysUntilExpiry === 1 ? 'Ističe sutra!' : 
  `Ističe za ${vehicle.daysUntilExpiry} dana`}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`).join('\n')}

Molimo Vas da pravovremeno obnovite potrebne dokumente kako biste izbjegli probleme u radu.

Pogledajte vozila: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/vozila

---
Ovo je automatska poruka iz sistema Dispo-Go.
Ukoliko ne želite primati ova obavještenja, možete ih isključiti u postavkama profila.
  `.trim();
}
