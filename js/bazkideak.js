// =============================================================================
// BAZKIDEEN KUDEAKETA: KARGATU, SORTU, SOFT/HARD DELETE ETA RESTORE
// =============================================================================

async function kargatuBazkideakKudeaketa() {
    const $tbody = $("#bazkideakTbody");
    if (!$tbody.length) return;
    const barneEzabatuak = $("#checkBazkideakEzabatuak").prop("checked") ?? true;
    $tbody.html('<tr><td colspan="6" class="text-center">Bazkideak kargatzen...</td></tr>');

    try {
        const raw = await $.ajax({
            url: `${apiUrl}/api/bazkideak?barneEzabatuak=${barneEzabatuak}`,
            method: "GET"
        });
        const bazkideak = unwrapData(raw);

        $("#bazkideKopuruText").text(`${bazkideak.length} bazkide erregistratuta`);

        if (!bazkideak || bazkideak.length === 0) {
            $tbody.html('<tr><td colspan="6" class="text-center">Ez dago bazkiderik erregistratuta.</td></tr>');
            return;
        }

        $tbody.empty();

        bazkideak.forEach(b => {
            const bonoBadge = b.bonoSaioak > 0 
                ? `<span class="badge badge-success">${b.bonoSaioak} saio</span>` 
                : `<span class="badge badge-secondary">Bono gabe</span>`;

            const $tr = $("<tr>");
            if (b.ezabatua) $tr.addClass("row-soft-deleted");

            const egoeraHtml = b.ezabatua
                ? `<span class="badge badge-warning">Desgaituta (Soft-Delete)</span>`
                : `<span class="badge badge-success">Aktiboa</span>`;

            const ekintzakHtml = b.ezabatua
                ? `<div class="action-group">
                       <button class="btn btn-sm btn-restore" onclick="berreskuratuBazkidea(${b.id})">Berreskuratu</button>
                       <button class="btn btn-sm btn-hard" onclick="ezabatuBazkidea(${b.id}, '${eskapatuHtml(b.izena)} ${eskapatuHtml(b.abizena)}', true)">Hard Delete</button>
                   </div>`
                : `<div class="action-group">
                       <button class="btn btn-sm btn-soft" onclick="ezabatuBazkidea(${b.id}, '${eskapatuHtml(b.izena)} ${eskapatuHtml(b.abizena)}', false)" title="Bazkidea logikoki ezabatu">Soft Delete</button>
                       <button class="btn btn-sm btn-hard" onclick="ezabatuBazkidea(${b.id}, '${eskapatuHtml(b.izena)} ${eskapatuHtml(b.abizena)}', true)">Hard Delete</button>
                   </div>`;

            $tr.html(`
                <td><strong>#${b.id}</strong></td>
                <td><strong>${eskapatuHtml(b.izena)} ${eskapatuHtml(b.abizena)}</strong></td>
                <td>${eskapatuHtml(b.emaila || "-")}</td>
                <td>${bonoBadge}</td>
                <td>${egoeraHtml}</td>
                <td class="text-right">${ekintzakHtml}</td>
            `);
            $tbody.append($tr);
        });
    } catch (err) {
        $tbody.html(`<tr><td colspan="6" class="text-center text-danger">Errorea bazkideak kargatzean: ${err.statusText || err.message}</td></tr>`);
    }
}

async function sortuBazkidea(e) {
    e.preventDefault();

    const izena = $("#inputBazkideIzena").val().trim();
    const abizena = $("#inputBazkideAbizena").val().trim();
    const emaila = $("#inputBazkideEmaila").val().trim();
    const hasierakoBonoa = parseInt($("#inputBazkideHasierakoBonoa").val() || "0") || 0;

    if (!izena || !abizena || !emaila) {
        erakutsiMezua("warning", "Mesedez bete izena, abizena eta emaila.");
        return;
    }

    const $btn = $("#btnSortuBazkidea");
    $btn.prop("disabled", true).text("Gordetzen...");

    try {
        const resData = await $.ajax({
            url: `${apiUrl}/api/bazkideak`,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ izena, abizena, emaila, hasierakoBonoa })
        });
        const msg = lortuMezua(resData, "Bazkidea sortu da");

        erakutsiMezua("success", `[ARRAKASTA] ${msg}!`);
        $("#bazkideForm")[0].reset();
        $("#inputBazkideHasierakoBonoa").val("0");
        await kargatuHautagarriak();
        await kargatuBazkideakKudeaketa();
        await kargatuBonoak();
    } catch (xhr) {
        const resData = xhr.responseJSON || {};
        const msg = lortuMezua(resData, xhr.statusText || "Errorea");
        erakutsiMezua("warning", `[ERROREA] ${msg}`);
    } finally {
        $btn.prop("disabled", false).text("Bazkidea Gorde");
    }
}

async function ezabatuBazkidea(id, izena, isHard) {
    const mota = isHard ? "HARD DELETE (behin betiko)" : "SOFT DELETE (logikoa)";
    const mezua = isHard
        ? `KONTUZ: #${id} '${izena}' bazkidea FISIKOKI BEHIN BETIKO ezabatu nahi duzu?`
        : `ADI: #${id} '${izena}' bazkidea SOFT DELETE egitean, desgaituta geratuko da. Jarraitu?`;

    if (!confirm(mezua)) return;

    try {
        const resData = await $.ajax({
            url: `${apiUrl}/api/bazkideak/${id}?hard=${isHard}`,
            method: "DELETE"
        });
        const msg = lortuMezua(resData, "Bazkidea ezabatu da");
        erakutsiMezua("success", msg);
        await kargatuHautagarriak();
        await kargatuBazkideakKudeaketa();
    } catch (xhr) {
        const resData = xhr.responseJSON || {};
        const msg = lortuMezua(resData, xhr.statusText || "Errorea");
        erakutsiMezua("warning", `[KONTUZ] ${msg}`);
    }
}

async function berreskuratuBazkidea(id) {
    try {
        const resData = await $.ajax({
            url: `${apiUrl}/api/bazkideak/${id}/restore`,
            method: "PUT"
        });
        const msg = lortuMezua(resData, "Bazkidea berreskuratu da");
        erakutsiMezua("success", msg);
        await kargatuHautagarriak();
        await kargatuBazkideakKudeaketa();
    } catch (xhr) {
        const resData = xhr.responseJSON || {};
        const msg = lortuMezua(resData, xhr.statusText || "Errorea");
        erakutsiMezua("warning", msg);
    }
}
