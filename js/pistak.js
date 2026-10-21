// =============================================================================
// PISTEN KUDEAKETA: KARGATU, SORTU, SOFT/HARD DELETE ETA RESTORE
// =============================================================================

async function kargatuPistak() {
    const barneEzabatuak = $("#checkPistakEzabatuak").prop("checked");
    $("#pistakTbody").html('<tr><td colspan="5" class="text-center">Pistak kargatzen...</td></tr>');

    try {
        const raw = await $.ajax({
            url: `${apiUrl}/api/pistak?barneEzabatuak=${barneEzabatuak}`,
            method: "GET"
        });
        const zerrenda = unwrapData(raw);
        renderPistakTable(zerrenda);
    } catch (err) {
        $("#pistakTbody").html(`<tr><td colspan="5" class="text-center" style="color: #c62828;">Errorea pistak kargatzean: ${err.statusText || err.message}</td></tr>`);
        $("#pistaKopuruText").text("Errorea");
    }
}

function renderPistakTable(zerrenda) {
    const $tbody = $("#pistakTbody");
    if (!zerrenda || zerrenda.length === 0) {
        $tbody.html('<tr><td colspan="5" class="text-center" style="color: #777;">Ez dago pistarik.</td></tr>');
        $("#pistaKopuruText").text("0 pista");
        return;
    }

    $("#pistaKopuruText").text(`${zerrenda.length} pista`);
    $tbody.empty();

    zerrenda.forEach(p => {
        const $tr = $("<tr>");
        if (p.ezabatua) $tr.addClass("row-soft-deleted");

        const egoeraHtml = p.ezabatua
            ? `<span class="badge badge-warning">Desgaituta (Soft-Delete)</span>`
            : `<span class="badge badge-success">Aktiboa</span>`;

        const ekintzakHtml = p.ezabatua
            ? `<div class="action-group">
                   <button class="btn btn-sm btn-restore" onclick="berreskuratuPista(${p.id})">Berreskuratu</button>
                   <button class="btn btn-sm btn-hard" onclick="ezabatuPista(${p.id}, true)">Hard Delete</button>
               </div>`
            : `<div class="action-group">
                   <button class="btn btn-sm btn-soft" onclick="ezabatuPista(${p.id}, false)" title="Pista eta bere erreserbak desgaitu">Soft Delete</button>
                   <button class="btn btn-sm btn-hard" onclick="ezabatuPista(${p.id}, true)">Hard Delete</button>
               </div>`;

        $tr.html(`
            <td><strong>#${p.id}</strong></td>
            <td><strong>${eskapatuHtml(p.izena)}</strong></td>
            <td><span class="sport-tag">${eskapatuHtml(p.kirola)}</span></td>
            <td>${egoeraHtml}</td>
            <td class="text-right">${ekintzakHtml}</td>
        `);

        $tbody.append($tr);
    });
}

async function sortuPista(e) {
    e.preventDefault();
    const izena = $("#inputPistaIzena").val().trim();
    const kirola = $("#inputPistaKirola").val().trim();
    if (!izena || !kirola) return;

    const $btn = $("#btnSortuPista");
    $btn.prop("disabled", true);
    try {
        const resData = await $.ajax({
            url: `${apiUrl}/api/pistak`,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ izena, kirola })
        });
        const msg = lortuMezua(resData, "Pista ondo sortu da");
        erakutsiMezua("success", msg);
        $("#inputPistaIzena").val("");
        $("#inputPistaKirola").val("");
        kargatuPistak();
        kargatuHautagarriak();
    } catch (xhr) {
        const resData = xhr.responseJSON || {};
        const msg = lortuMezua(resData, xhr.statusText || "Errorea");
        erakutsiMezua("danger", msg);
    } finally {
        $btn.prop("disabled", false);
    }
}

async function ezabatuPista(id, isHard) {
    const mezua = isHard
        ? `KONTUZ: #${id} pista eta bere erreserbak FISIKOKI BEHIN BETIKO ezabatu nahi dituzu?`
        : `ADI: #${id} pista SOFT DELETE egitean, PISTAREKIN ERLAZIONATUTAKO ERRESERBA GUZTIAK DESGAITU bezala geratuko dira. Jarraitu?`;

    if (!confirm(mezua)) return;

    try {
        const resData = await $.ajax({
            url: `${apiUrl}/api/pistak/${id}?hard=${isHard}`,
            method: "DELETE"
        });
        const msg = lortuMezua(resData, "Pista ezabatu da");
        erakutsiMezua("success", msg);
        kargatuPistak();
        kargatuErreserbak();
        kargatuHautagarriak();
    } catch (xhr) {
        const resData = xhr.responseJSON || {};
        const msg = lortuMezua(resData, xhr.statusText || "Errorea");
        erakutsiMezua("danger", msg);
    }
}

async function berreskuratuPista(id) {
    try {
        const resData = await $.ajax({
            url: `${apiUrl}/api/pistak/${id}/restore`,
            method: "PUT"
        });
        const msg = lortuMezua(resData, "Pista berreskuratu da");
        erakutsiMezua("success", msg);
        kargatuPistak();
        kargatuHautagarriak();
    } catch (xhr) {
        const resData = xhr.responseJSON || {};
        const msg = lortuMezua(resData, xhr.statusText || "Errorea");
        erakutsiMezua("warning", msg);
    }
}
