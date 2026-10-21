// =============================================================================
// BONOEN KUDEAKETA: KARGATU, SORTU ETA SAIOAK GEHITU
// =============================================================================

async function kargatuBonoak() {
    $("#bonoakTbody").html('<tr><td colspan="4" class="text-center">Bonoak kargatzen...</td></tr>');

    try {
        const raw = await $.ajax({
            url: `${apiUrl}/api/bonoak`,
            method: "GET"
        });
        cacheBonoak = unwrapData(raw);
        renderBonoakTable(cacheBonoak);
    } catch (err) {
        $("#bonoakTbody").html(`<tr><td colspan="4" class="text-center" style="color: #c62828;">Errorea bonoak kargatzean: ${err.statusText || err.message}</td></tr>`);
        $("#bonoKopuruText").text("Errorea");
    }
}

function renderBonoakTable(zerrenda) {
    const $tbody = $("#bonoakTbody");
    if (!zerrenda || zerrenda.length === 0) {
        $tbody.html('<tr><td colspan="4" class="text-center" style="color: #777;">Ez dago bonorik erregistratuta.</td></tr>');
        $("#bonoKopuruText").text("0 bono");
        return;
    }

    $("#bonoKopuruText").text(`${zerrenda.length} bono`);
    $tbody.empty();

    zerrenda.forEach(b => {
        const $tr = $("<tr>");
        const egoeraHtml = b.saioak > 0
            ? `<span class="badge badge-success">${b.saioak} Saio Libre</span>`
            : `<span class="badge badge-danger">Hutsik (0 Saio)</span>`;

        $tr.html(`
            <td><strong>${eskapatuHtml(b.emaila)}</strong></td>
            <td><strong>${b.saioak}</strong></td>
            <td>${egoeraHtml}</td>
            <td class="text-right">
                <div class="action-group">
                    <button class="btn btn-sm btn-recharge" onclick="kargatuBonoSaioak('${b.emaila}', 1)">+1 Saio</button>
                    <button class="btn btn-sm btn-recharge" onclick="kargatuBonoSaioak('${b.emaila}', 5)">+5 Saio</button>
                    <button class="btn btn-sm btn-recharge" onclick="kargatuBonoSaioak('${b.emaila}', 10)">+10 Saio</button>
                </div>
            </td>
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
        kargatuBonoak();
        kargatuHautagarriak();
        kargatuBazkideakKudeaketa();
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
        kargatuBonoak();
        kargatuHautagarriak();
        kargatuBazkideakKudeaketa();
    } catch (xhr) {
        const resData = xhr.responseJSON || {};
        const msg = lortuMezua(resData, xhr.statusText || "Errorea");
        erakutsiMezua("danger", "Errorea: " + msg);
    }
}
