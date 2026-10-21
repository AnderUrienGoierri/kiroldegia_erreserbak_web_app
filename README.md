# Kiroldegia Erreserbak - Web Aplikazioa

Ordiziako Majori Kiroldegiko instalazioak eta pistak erreserbatzeko web aplikazio interaktiboa (Frontend).

HTML5, Vanilla CSS eta JavaScript (ES6+) bidez garatua, [API_kiroldegia_db](https://github.com/AnderUrienGoierri/API_kiroldegia_db) REST APIarekin zuzenean komunikatzen da.

---

## Ezaugarriak

- **Interfaze Garbia eta Arina**: HTML5 semantikoa eta diseinu erantzunkorra (Responsive design).
- **Pisten Kudeaketa Dinamikoa**: Pisten egoera, erabilgarritasuna eta prezioak denbora errealean kargatzen dira APIaren bidez.
- **Erreserba Sistema**:
  - Pista eta ordu-tartea aukeratzea.
  - Bazkide zenbakia eta ordainketa modua (Bonoa edo Zuzenekoa) hautatzea.
  - Erreserbak berehala konfirmatzea.
- **Dauden Erreserben Zerrenda eta Ezeztatzea**:
  - Erreserba guztiak ikusi.
  - Erreserbak ezabatu/ezeztatu eta bonoa erabili bada saldoa automatikoki berreskuratu.
- **Apache Web Server integrazioa**: Apache bidez zerbitzatzeko optimizatua (`http://localhost/kiroldegia/`).

---

## Erabilera eta Zerbitzatzea

### 1. Backend REST APIa abiarazi

Aplikazioak [API_kiroldegia_db](https://github.com/AnderUrienGoierri/API_kiroldegia_db) behar du martxan `http://localhost:5089` portuan:

```bash
dotnet run --launch-profile http
```

### 2. Web orria ikusi

Apache web zerbitzaria martxan badago:

- Nabigatzailean ireki: `http://localhost/kiroldegia/`
- Edo zuzenean fitxategia tokian bertan ireki (`index.html`).
