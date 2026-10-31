# Transakzio Egoerak eta DELETE Motaren Justifikazioa

**Proiektua:** Ordiziako Kiroldegiko Erreserbak - Web Aplikazioa
**Irakasgaia:** Datu-Atzipena (2. Maila, DAM)

Dokumentu honek kiroldegiko erreserba sisteman aurreikusitako transakzio-egoerak eta datu-baseko ezabaketa (DELETE) motaren aukeraketa modu sinple eta argian azaltzen ditu.

---

## 1. Zein transakzio egoera aurreikusten dituzuen eta nola soluzionatu dituzuen?

Sistema konkorrente batean hainbat erabiltzailek aldi berean egin ditzakete eragiketak (webetik zein terminaletik). Hori dela eta, 4 egoera nagusi aurreikusi eta ebatzi ditugu:

### 1.1. Erreserba Bikoitza (Double Booking / Race Condition)

- **Egoera / Arriskua:** Bi erabiltzaile aldi berean pista, data eta ordu bera erreserbatzen saiatzen dira. Transakziorik gabe, biek ordua libre ikusten dute eta bi txertaketa egiten dira une berean.
- **Nola soluzionatu dugu?:**
  1. **Datu-base mailan:** `UNIQUE KEY (pista_id, data, ordua)` murrizketa ezarri dugu. Gatazka badago, MySQL-k `1062` errorea jaurtitzen du.
  2. **Transakzioa eta Blokeo Pesimista (`FOR UPDATE`):** Erreserba sortu aurretik, hutsunea egiaztatu eta blokeatu egiten dugu:

     ```sql
     SELECT COUNT(*) FROM erreserba
     WHERE pista_id = @pista AND data = @data AND ordua = @ordua AND ezabatua = FALSE
     FOR UPDATE;
     ```

     Horrela, bigarren eskaerak itxaron egin behar du lehen transakzioa amaitu arte.

  3. **Rollback kudeaketa:** Pista jada hartuta badago edo MySQL 1062 errorea gertatzen bada, transakzioa desegiten da (`ROLLBACK`) eta bezeroari gatazka-mezua (`409 Conflict`) bidaltzen zaio.

---

### 1.2. Bonoen Saldo Negatiboa (Overdraft)

- **Egoera / Arriskua:** Bazkide bati saio bakarra geratzen zaionean bonoan (`saioak = 1`), bi gailutatik batera erreserba eginez gero, biak ontzat eman eta saldoa `-1` balioan geratzeko arriskua zegoen.
- **Nola soluzionatu dugu?:**
  - Bonoaren saldoaren irakurketa eta deskontua transakzio beraren barruan blokeatu ditugu (`FOR UPDATE` bidez):
    ```sql
    SELECT saioak FROM bonoak WHERE emaila = @email FOR UPDATE;
    ```
  - Saio nahikorik ez badago (`saioak <= 0`), transakzioa bertan behera utzi eta atzera egiten da (`ROLLBACK`).
  - Saioa badago, erreserba sartu eta bonoaren saio bat kentzen da atomikoki: bi eragiketak batera burutzen dira, edo bat huts eginez gero, ezer ez da gordetzen.

---

### 1.3. Elkar-blokeoak (Deadlock-ak - MySQL 1213)

- **Egoera / Arriskua:** Bi transakziok baliabide berak alderantzizko ordenean blokeatu nahi dituztenean (adibidez: 1. transakzioak Pista blokeatu eta Bonoa behar du; 2. transakzioak Bonoa blokeatu eta Pista behar du). Biak elkarri begira geldituko lirateke betiko.
- **Nola soluzionatu dugu?:**
  1. **Blokeo-ordena finkoa:** Proiektuko ataza guztietan baliabideak ordena berdinean blokeatzen dira beti:
     $$
     \text{Pista} \longrightarrow \text{Bonoa} \longrightarrow \text{Erreserba}
     $$
  2. **Deadlock salbuespena harrapatzea:** MySQL-k elkar-blokeoa antzematen badu (`MySQL 1213`), kodeak errorea harrapatu, transakzioa garbi desegin (`ROLLBACK`) eta erabiltzaileari berriro saiatzeko eskatzen dio.

---

### 1.4. Desgaitutako Pistan Erreserbatzea

- **Egoera / Arriskua:** Mantentze-lanetan edo desgaituta (`ezabatua = TRUE`) dagoen pista batean norbaitek erreserba bat sartu ahal izatea.
- **Nola soluzionatu dugu?:**
  - Erreserba prozesuaren barruan pistaren egoera egiaztatzen da blokeoarekin:
    ```sql
    SELECT ezabatua FROM pista WHERE id = @id FOR UPDATE;
    ```
  - Pista aktibo ez badago, transakzioa berehala desegiten da (`ROLLBACK`) eta mezua itzultzen da.

---

## 2. Zein DELETE MOTA aukeratu dugu erlazioetan (pista eta erreserba artean) eta zergatik?

Gure sisteman bi mailatan hartu dugu erabakia: **Aplikazio/Negozio mailan** eta **Datu-base mailan**.

### 2.1. Aplikazio Mailan: SOFT DELETE (Ezabaketa Logikoa)

Erabaki nagusia **Soft Delete** erabiltzea izan da. Hau da, erregistroak fisikoki ezabatu beharrean, `ezabatua = TRUE` eta `ezabaketa_data = NOW()` ezartzen dira.

**Zergatik aukeratu dugu Soft Delete?:**

1. **Datuen Historikoa eta Auditoretza:** Kiroldegiko instalazioetan funtsezkoa da iraganeko erreserben datuak ez galtzea: erabilera estatistikak egiteko, ordutegi jendetsuenak aztertzeko eta kobrantza/fakturazio erreklamazioei erantzuteko.
2. **Kaskadako Desgaitzea (Cascade Disabling):** Pista bat desgaitzen denean (`Soft Delete`), transakzio bakar baten barruan harekin erlazionatutako erreserba aktibo guztiak ere desgaitu bezala markatzen dira:
   ```sql
   UPDATE pista SET ezabatua = TRUE, ezabaketa_data = NOW() WHERE id = @id;
   UPDATE erreserba SET ezabatua = TRUE, ezabaketa_data = NOW() WHERE pista_id = @id AND ezabatua = FALSE;
   ```
3. **Akatsak Berreskuragarriak Izatea (Restore):** Erabiltzaile edo langile batek pista edo erreserba bat nahi gabe desgaitzen badu, aplikaziotik zuzenean leheneratu daiteke (`PUT /restore`), datu-galerarik gabe.

---

### 2.2. Datu-Base Mailan: ON DELETE RESTRICT

Datu-baseko atzerriko gakoan (`FOREIGN KEY`), `ON DELETE RESTRICT` araua ezarri dugu:

```sql
CONSTRAINT fk_erreserba_pista FOREIGN KEY (pista_id) REFERENCES pista (id) ON DELETE RESTRICT;
```

**Zergatik RESTRICT eta zergatik EZ CASCADE?:**

- **RESTRICT zergatik?:** Segurtasun-sare gisa funtzionatzen du. Norbaitek zuzenean datu-basean `DELETE FROM pista WHERE id = 1` exekutatuko balu, MySQL-k eragotzi egingo du (`MySQL Error 1451`), pista horrek erreserbak dituen bitartean ezin delako fisikoki ezabatu.
- **EZ CASCADE zergatik?:** `ON DELETE CASCADE` jarriko bagenu, pista bat ezabatzean erlazionatutako erreserba guztiak **fisikoki eta betiko** desagertuko lirateke datu-basetik, informazio historiko guztia galduz.

---

## 3. Laburpena

| Kontzeptua                      | Aukeratutako Soluzioa                      | Arrazoi Nagusia                                                         |
| ------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| **Erreserba Bikoitzak**         | `SELECT ... FOR UPDATE` + `UNIQUE KEY`     | Hutsunea blokeatu eta aldi bereko gainjartzeak eragotzi.                |
| **Bonoen Kudeaketa**            | Transakzio atomikoa + `FOR UPDATE`         | Saldo negatiboak (`overdraft`) saihestu.                                |
| **Elkar-blokeoak**              | Blokeo-ordena uniformea + 1213 harrapaketa | Sistema ez gelditzea eta baliabideak ordenan askatzea.                  |
| **Ezabaketa Mota (Aplikazioa)** | **SOFT DELETE**                            | Historikoa mantendu, akatsak berreskuratu eta kaskadan desgaitu.        |
| **Ezabaketa Mota (Datu-basea)** | **ON DELETE RESTRICT**                     | Babes-neurria: erreserbak dituen pista bat fisikoki ezabatzea eragotzi. |
