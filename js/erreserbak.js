// =============================================================================
// ERRESERBAK: HAUTAGARRIAK, ZERRENDA ETA TRANSAKZIO ATOMIKOA
// =============================================================================

async function kargatuHautagarriak() {
    try {
        // 1. Bonoak kargatu kaxarako
        try {
            const rawBonoak = await $.ajax({ url: `${apiUrl}/api/bonoak`, method: "GET" });
            cacheBonoak = unwrapData(rawBonoak);
        } catch (_) {}

        // 2. Bazkideak kargatu select-erako (soilik aktiboak)
        try {
            const rawB = await $.ajax({ url: `${apiUrl}/api/bazkideak?barneEzabatuak=false`, method: "GET" });
            cacheBazkideak = unwrapData(rawB);
            const $selectBazkideak = $("#selectBazkidea");
            $selectBazkideak.empty().append('<option value="">-- Hautatu bazkidea --</option>');
            
            cacheBazkideak.forEach(b => {
                const bono = cacheBonoak.find(x => x.emaila.toLowerCase() === (b.emaila || "").toLowerCase());
                const saioak = bono ? bono.saioak : (b.bonoSaioak || 0);
                $("<option>")
                    .val(b.id)
                    .text(`[${b.id}] ${b.izena} ${b.abizena || ''} (${b.emaila || 'ez du emailik'}) [${saioak} saio]`)
                    .appendTo($selectBazkideak);
            });
            if (cacheBazkideak.length > 0) $selectBazkideak.prop("selectedIndex", 1);
            eguneratuBazkideBonoInfo();
        } catch (_) {}

        // 3. Pistak (soilik aktiboak erreserbatzeko) // 
        try {
            const rawP = await $.ajax({ url: `${apiUrl}/api/pistak?barneEzabatuak=false`, method: "GET" });
            cachePistak = unwrapData(rawP);
            const $selectP = $("#selectPista");
            $selectP.empty().append('<option value="">-- Hautatu pista --</option>');
            
            cachePistak.forEach(p => {
                $("<option>")
                    .val(p.id)
                    .text(`[${p.id}] ${p.izena} (${p.kirola})`)
                    .appendTo($selectP);
            });
            if (cachePistak.length > 0) $selectP.prop("selectedIndex", 1);
        } catch (_) {}
    } catch (err) {
        console.warn("Ezin izan dira hautagaiak kargatu:", err);
    }
}

function eguneratuBazkideBonoInfo() {
    const bazkId = parseInt($("#selectBazkidea").val());
    const bazkide = cacheBazkideak.find(b => b.id === bazkId);
    if (!bazkide || !bazkide.emaila) {
        $("#bazkideBonoInfo").text("Bazkideak ez dauka emailik edo bonorik.");
        return;
    }
    const bono = cacheBonoak.find(x => x.emaila.toLowerCase() === bazkide.emaila.toLowerCase());
    const saioak = bono ? bono.saioak : (bazkide.bonoSaioak || 0);
    $("#bazkideBonoInfo").text(`Bonoaren egoera: ${bazkide.emaila} -> ${saioak} saio erabilgarri.`);
}

async function kargatuErreserbak() {
    const barneEzabatuak = $("#checkEzabatuak").prop("checked");
    $("#erreserbakTbody").html('<tr><td colspan="6" class="text-center">Erreserbak kargatzen...</td></tr>');

    try {
        const raw = await $.ajax({
            url: `${apiUrl}/api/erreserbak?barneEzabatuak=${barneEzabatuak}`,
            method: "GET"
        });
        const erreserbak = unwrapData(raw);
        renderErreserbakTable(erreserbak);
    } catch (err) {
        $("#erreserbakTbody").html(`<tr><td colspan="6" class="text-center" style="color: var(--danger, #c62828);">Ezin izan da APIarekin konektatu: ${err.statusText || err.message}</td></tr>`);
        $("#erreserbaKopuruText").text("Errorea");
    }
}

function renderErreserbakTable(zerrenda) {
    const $tbody = $("#erreserbakTbody");
    if (!zerrenda || zerrenda.length === 0) {
        $tbody.html('<tr><td colspan="6" class="text-center" style="color: #777; padding: 24px;">Ez dago erreserbarik taulan une honetan.</td></tr>');
        $("#erreserbaKopuruText").text("0 erreserba");
        return;
    }

    const aktiboKopurua = zerrenda.filter(e => !e.ezabatua).length;
    $("#erreserbaKopuruText").text(`${zerrenda.length} erreserba (${aktiboKopurua} aktibo)`);
    $tbody.empty();

    zerrenda.forEach(e => {
        const $tr = $("<tr>");
        if (e.ezabatua) $tr.addClass("row-soft-deleted");

        let egoeraHtml = "";
        let ekintzakHtml = "";

        if (e.ezabatua) {
            const ezabDataStr = e.ezabaketaData ? new Date(e.ezabaketaData).toLocaleString("eu") : "";
            egoeraHtml = `<span class="badge badge-warning" title="${ezabDataStr}">Soft-Deleted</span>`;
            ekintzakHtml = `
                <div class="action-group">
                    <button class="btn btn-sm btn-restore" onclick="berreskuratuErreserba(${e.id})" title="Berrezarri erreserba">Berreskuratu</button>
                    <button class="btn btn-sm btn-hard" onclick="ezabatuErreserba(${e.id}, true)" title="Fisikoki behin betiko ezabatu">Hard Delete</button>
                </div>
            `;
        } else {
            egoeraHtml = `<span class="badge badge-success">Aktiboa</span>`;
            ekintzakHtml = `
                <div class="action-group">
                    <button class="btn btn-sm btn-soft" onclick="ezabatuErreserba(${e.id}, false)" title="Logikoki ezabatu (pista askatu)">Soft Delete</button>
                    <button class="btn btn-sm btn-hard" onclick="ezabatuErreserba(${e.id}, true)" title="Fisikoki behin betiko ezabatu">Hard Delete</button>
                </div>
            `;
        }

        const pistaIzena = e.pistaIzena || e.lekua || "Pista";
        const kirolMota = e.kirola ? `<span class="sport-tag">${eskapatuHtml(e.kirola)}</span>` : '';
        const bazkideIzena = e.bazkideaIzena || e.emaila || "Bazkidea";
        const emailInfo = e.bazkideaEmaila || (e.emaila && e.emaila !== bazkideIzena ? e.emaila : '');

        $tr.html(`
            <td><strong>#${e.id}</strong></td>
            <td>
                <strong>${eskapatuHtml(pistaIzena)}</strong>
                ${kirolMota}
            </td>
            <td>
                <strong>${eskapatuHtml(bazkideIzena)}</strong>
                ${emailInfo ? `<br><small style="color:#666">${eskapatuHtml(emailInfo)}</small>` : ''}
            </td>
            <td>
                <span>${e.data}</span>
                <span style="display:block; color: #666; font-size: 0.775rem;">${e.ordua}</span>
            </td>
            <td>${egoeraHtml}</td>
            <td class="text-right">${ekintzakHtml}</td>
        `);

        $tbody.append($tr);
    });
}

async function sortuErreserba(e) {
    e.preventDefault();

    const pistaId = parseInt($("#selectPista").val());
    const bazkideaId = parseInt($("#selectBazkidea").val());
    const data = $("#inputData").val().trim();
    const ordua = $("#selectOrdua").val().trim();
    const erabiliBonoa = $("#checkErabiliBonoa").prop("checked");
    const simulatuBlokeoa = $("#checkSimulatuBlokeoa").prop("checked");
    const itxaronMs = simulatuBlokeoa ? 5000 : 0;

    if (!pistaId || !bazkideaId || !data || !ordua) {
        erakutsiMezua("warning", "Mesedez bete formularioaren eremu guztiak.");
        return;
    }

    const pistaObj = cachePistak.find(p => p.id === pistaId);
    const bazkideObj = cacheBazkideak.find(b => b.id === bazkideaId);

    const $btn = $("#btnErreserbatu");
    $btn.prop("disabled", true);
    $btn.text(simulatuBlokeoa ? "Transakzioa blokeatuta (5s itxaroten)..." : "Transakzioa exekutatzen...");

    const hasieraDenbora = Date.now();

    try {
        const payload = {
            pistaId,
            lekua: pistaObj ? pistaObj.izena : "",
            bazkideaId,
            emaila: bazkideObj ? bazkideObj.emaila : "",
            data,
            ordua,
            erabiliBonoa,
            itxaron: itxaronMs
        };

        let url = `${apiUrl}/api/erreserbak/transakzioa`;
        if (itxaronMs > 0) {
            url += `?itxaron=${itxaronMs}`;
        }

        const dataRes = await $.ajax({
            url: url,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload)
        });

        const msg = lortuMezua(dataRes, "Erreserba burutu da");
        const iraupena = ((Date.now() - hasieraDenbora) / 1000).toFixed(1);
        const iraupenMezua = iraupena >= 1.0 ? ` (Denbora: ${iraupena}s)` : "";

        erakutsiMezua("success", `[ARRAKASTA] ${msg}!${iraupenMezua}`);
        await kargatuHautagarriak();
        await kargatuErreserbak();
        await kargatuBonoak();
        await kargatuBazkideakKudeaketa();
    } catch (xhr) {
        const dataRes = xhr.responseJSON || {};
        const msg = lortuMezua(dataRes, xhr.statusText || "Errorea");
        const iraupena = ((Date.now() - hasieraDenbora) / 1000).toFixed(1);
        const iraupenMezua = iraupena >= 1.0 ? ` (Denbora: ${iraupena}s)` : "";

        if (xhr.status === 409) {
            const mota = dataRes.mota || "";
            let etiketa = "[PISTA OKUPATUTA]";
            if (mota === "KONKURRENTZIA" || msg.includes("1062") || msg.includes("1213") || msg.includes("1205") || msg.toLowerCase().includes("deadlock") || msg.toLowerCase().includes("timeout")) {
                etiketa = "[KONKURRENTZIA / BLOKEOA]";
            } else if (mota === "BONO_SALDOA" || msg.toLowerCase().includes("saio") || msg.toLowerCase().includes("bono")) {
                etiketa = "[BONO SALDOA]";
            } else if (mota === "PISTA_DESGAITUTA" || msg.toLowerCase().includes("desgaituta") || msg.toLowerCase().includes("soft-delete")) {
                etiketa = "[PISTA DESGAITUTA]";
            }
            erakutsiMezua("warning", `${etiketa} ${msg}${iraupenMezua}`);
        } else {
            erakutsiMezua("danger", `[ERROREA ${xhr.status || ""}] ${msg}${iraupenMezua}`);
        }
    } finally {
        $btn.prop("disabled", false);
        $btn.text("Erreserba Gorde");
    }
}

async function ezabatuErreserba(id, isHard) {
    const mota = isHard ? "HARD DELETE (behin betiko)" : "SOFT DELETE (logikoa)";
    const berretsi = confirm(`Ziur zaude #${id} erreserba ezabatu nahi duzula? (${mota})`);
    if (!berretsi) return;

    try {
        const resData = await $.ajax({
            url: `${apiUrl}/api/erreserbak/${id}?hard=${isHard}`,
            method: "DELETE"
        });
        const msg = lortuMezua(resData, "Ezabaketa burutu da");
        erakutsiMezua("success", msg);
        kargatuErreserbak();
    } catch (xhr) {
        const resData = xhr.responseJSON || {};
        const msg = lortuMezua(resData, xhr.statusText || "Errorea");
        erakutsiMezua("danger", "Sare-errorea ezabatzean: " + msg);
    }
}

async function berreskuratuErreserba(id) {
    try {
        const resData = await $.ajax({
            url: `${apiUrl}/api/erreserbak/${id}/restore`,
            method: "PUT"
        });
        const msg = lortuMezua(resData, "Erreserba berreskuratu da");
        erakutsiMezua("success", msg);
        kargatuErreserbak();
    } catch (xhr) {
        const resData = xhr.responseJSON || {};
        const msg = lortuMezua(resData, xhr.statusText || "Errorea");
        erakutsiMezua("warning", msg);
    }
}

async function garbituErreserbaGuztiak() {
    const berretsi = confirm("KONTUZ: Taulako erreserba GUZTIAK ezabatu nahi dituzu (probak hutsetik hasteko)?");
    if (!berretsi) return;

    try {
        const resData = await $.ajax({
            url: `${apiUrl}/api/erreserbak/garbitu`,
            method: "DELETE"
        });
        const msg = lortuMezua(resData, "Erreserba guztiak garbitu dira");
        erakutsiMezua("success", msg);
        kargatuErreserbak();
    } catch (xhr) {
        const resData = xhr.responseJSON || {};
        const msg = lortuMezua(resData, xhr.statusText || "Errorea");
        erakutsiMezua("danger", msg);
    }
}
