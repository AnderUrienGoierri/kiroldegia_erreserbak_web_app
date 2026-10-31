// =============================================================================
// BONOEN KUDEAKETA: KARGATU, SORTU, SAIOAK GEHITU, SOFT/HARD DELETE ETA RESTORE
// =============================================================================

async function kargatuBonoak() {
    const barneEzabatuak = $("#checkBonoakEzabatuak").length ? $("#checkBonoakEzabatuak").prop("checked") : true;
    $("#bonoakTbody").html('<tr><td colspan="5" class="text-center">Bonoak kargatzen...</td></tr>');

    try {
        const raw = await $.ajax({
            url: `${apiUrl}/api/bonoak?barneEzabatuak=${barneEzabatuak}`,
            method: "GET"
        });
        cacheBonoak = unwrapData(raw);
        renderBonoakTable(cacheBonoak);
    } catch (err) {
        $("#bonoakTbody").html(`<tr><td colspan="5" class="text-center" style="color: #c62828;">Errorea bonoak kargatzean: ${err.statusText || err.message}</td></tr>`);
        $("#bonoKopuruText").text("Errorea");
    }
}

function renderBonoakTable(zerrenda) {
    const $tbody = $("#bonoakTbody");
    if (!zerrenda || zerrenda.length === 0) {
        $tbody.html('<tr><td colspan="5" class="text-center" style="color: #777;">Ez dago bonorik erregistratuta.</td></tr>');
        $("#bonoKopuruText").text("0 bono");
        return;
    }

    $("#bonoKopuruText").text(`${zerrenda.length} bono`);
    $tbody.empty();

    zerrenda.forEach(b => {
        const $tr = $("<tr>");
        if (b.ezabatua) $tr.addClass("row-soft-deleted");

        let egoeraHtml = "";
        if (b.ezabatua) {
            egoeraHtml = `<span class="badge badge-warning">Desgaituta (Soft-Delete)</span>`;
        } else if (b.saioak > 0) {
            egoeraHtml = `<span class="badge badge-success">${b.saioak} Saio Libre</span>`;
        } else {
            egoeraHtml = `<span class="badge badge-danger">Hutsik (0 Saio)</span>`;
        }

        const kargatuHtml = b.ezabatua
            ? `<span class="badge badge-secondary" style="color: #888;">Desgaituta</span>`
            : `<div class="action-group" style="justify-content: flex-start;">
                   <button class="btn btn-sm btn-recharge" onclick="kargatuBonoSaioak('${eskapatuHtml(b.emaila)}', 1)">+1 Saio</button>
                   <button class="btn btn-sm btn-recharge" onclick="kargatuBonoSaioak('${eskapatuHtml(b.emaila)}', 5)">+5 Saio</button>
                   <button class="btn btn-sm btn-recharge" onclick="kargatuBonoSaioak('${eskapatuHtml(b.emaila)}', 10)">+10 Saio</button>
               </div>`;

        const ekintzakHtml = b.ezabatua
            ? `<div class="action-group">
                   <button class="btn btn-sm btn-restore" onclick="berreskuratuBonoa('${eskapatuHtml(b.emaila)}')">Berreskuratu</button>
                   <button class="btn btn-sm btn-hard" onclick="ezabatuBonoa('${eskapatuHtml(b.emaila)}', true)">Hard Delete</button>
               </div>`
            : `<div class="action-group">
                   <button class="btn btn-sm btn-soft" onclick="ezabatuBonoa('${eskapatuHtml(b.emaila)}', false)" title="Bonoa logikoki desgaitu">Soft Delete</button>
                   <button class="btn btn-sm btn-hard" onclick="ezabatuBonoa('${eskapatuHtml(b.emaila)}', true)">Hard Delete</button>
               </div>`;

        $tr.html(`
            <td><strong>${eskapatuHtml(b.emaila)}</strong></td>
            <td><strong>${b.saioak}</strong></td>
            <td>${egoeraHtml}</td>
            <td>${kargatuHtml}</td>
            <td class="text-right">${ekintzakHtml}</td>
        `);

        $tbody.append($tr);
    });
}

async function sortuBonoa(e) {
    e.preventDefault();
    const emaila = $("#inputBonoEmaila").val().trim().toLowerCase();
    const saioak = parseInt($("#inputBonoSaioak").val());
    if (!emaila || isNaN(saioak)) return;

    const $btn = $("#btnSortuBonoa");
    $btn.prop("disabled", true);
    try {
        const resData = await $.ajax({
            url: `${apiUrl}/api/bonoak`,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ emaila, saioak })
        });
        const msg = lortuMezua(resData, "Bonoa gorde da");
        erakutsiMezua("success", msg);
        $("#inputBonoEmaila").val("");
        $("#inputBonoSaioak").val("5");
        await kargatuBonoak();
        await kargatuHautagarriak();
        await kargatuBazkideakKudeaketa();
    } catch (xhr) {
        const resData = xhr.responseJSON || {};
        const msg = lortuMezua(resData, xhr.statusText || "Errorea");
        erakutsiMezua("danger", msg);
    } finally {
        $btn.prop("disabled", false);
    }
}

async function kargatuBonoSaioak(emaila, kopurua) {
    try {
        const resData = await $.ajax({
            url: `${apiUrl}/api/bonoak/${encodeURIComponent(emaila)}/kargatu`,
            method: "PUT",
            contentType: "application/json",
            data: JSON.stringify({ saioak: kopurua })
        });
        const msg = lortuMezua(resData, `+${kopurua} saio kargatu dira`);
        erakutsiMezua("success", msg);
        await kargatuBonoak();
        await kargatuHautagarriak();
        await kargatuBazkideakKudeaketa();
    } catch (xhr) {
        const resData = xhr.responseJSON || {};
        const msg = lortuMezua(resData, xhr.statusText || "Errorea");
        erakutsiMezua("danger", "Errorea: " + msg);
    }
}

async function ezabatuBonoa(emaila, isHard) {
    const mezua = isHard
        ? `KONTUZ: '${emaila}' bonoa FISIKOKI BEHIN BETIKO ezabatu nahi duzu datu-basetik?`
        : `ADI: '${emaila}' bonoa SOFT DELETE egitean, desgaituta geratuko da. Jarraitu?`;

    if (!confirm(mezua)) return;

    try {
        const resData = await $.ajax({
            url: `${apiUrl}/api/bonoak/${encodeURIComponent(emaila)}?hard=${isHard}`,
            method: "DELETE"
        });
        const msg = lortuMezua(resData, "Bonoa ezabatu da");
        erakutsiMezua("success", msg);
        await kargatuBonoak();
        await kargatuHautagarriak();
        await kargatuBazkideakKudeaketa();
    } catch (xhr) {
        const resData = xhr.responseJSON || {};
        const msg = lortuMezua(resData, xhr.statusText || "Errorea");
        erakutsiMezua("danger", msg);
    }
}

async function berreskuratuBonoa(emaila) {
    try {
        const resData = await $.ajax({
            url: `${apiUrl}/api/bonoak/${encodeURIComponent(emaila)}/restore`,
            method: "PUT"
        });
        const msg = lortuMezua(resData, "Bonoa berreskuratu da");
        erakutsiMezua("success", msg);
        await kargatuBonoak();
        await kargatuHautagarriak();
        await kargatuBazkideakKudeaketa();
    } catch (xhr) {
        const resData = xhr.responseJSON || {};
        const msg = lortuMezua(resData, xhr.statusText || "Errorea");
        erakutsiMezua("warning", msg);
    }
}
