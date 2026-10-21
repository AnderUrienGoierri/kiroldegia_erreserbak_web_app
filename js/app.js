// =============================================================================
// ORDIZIAKO KIROLDEGIKO ERRESERBAK - APLIKAZIOAREN HASIERATZEA ETA GERTAERAK
// =============================================================================

$(function() {
    // 1. APIaren hasierako konfigurazioa
    $("#apiUrlInput").val(apiUrl);

    // 2. Erreserben data lehenetsia: gaurko eguna
    const gaur = new Date().toISOString().split("T")[0];
    if (!$("#inputData").val()) {
        $("#inputData").val(gaur);
    }

    // 3. Pestainen nabigazioa
    $(".tab-btn").on("click", function() {
        const targetTab = $(this).data("tab");
        $(".tab-btn").removeClass("active");
        $(".tab-pane").removeClass("active");
        $(this).addClass("active");
        $(`#${targetTab}`).addClass("active");

        // Datuak freskatu dagokion pestainara aldatzean
        if (targetTab === "tab-erreserbak") {
            kargatuHautagarriak();
            kargatuErreserbak();
        } else if (targetTab === "tab-pistak") {
            kargatuPistak();
        } else if (targetTab === "tab-bonoak") {
            kargatuBonoak();
        } else if (targetTab === "tab-bazkideak") {
            kargatuBazkideakKudeaketa();
        }
    });

    // 4. API barraren gertaerak
    $("#btnCheckApi").on("click", () => eguneratuApiUrl($("#apiUrlInput").val().trim()));
    $("#apiUrlInput").on("change", () => eguneratuApiUrl($("#apiUrlInput").val().trim()));
    $("#btnPort5089").on("click", () => eguneratuApiUrl("http://localhost:5089"));

    // 5. Erreserben gertaerak
    $("#btnRefresh").on("click", () => {
        kargatuHautagarriak();
        kargatuErreserbak();
    });
    $("#checkEzabatuak").on("change", kargatuErreserbak);
    $("#btnGarbitu").on("click", garbituErreserbaGuztiak);
    $("#erreserbaForm").on("submit", sortuErreserba);
    $("#selectBazkidea").on("change", eguneratuBazkideBonoInfo);

    // 6. Pisten gertaerak
    $("#btnRefreshPistak").on("click", kargatuPistak);
    $("#checkPistakEzabatuak").on("change", kargatuPistak);
    $("#pistaForm").on("submit", sortuPista);

    // 7. Bonoen gertaerak
    $("#btnRefreshBonoak").on("click", kargatuBonoak);
    $("#bonoForm").on("submit", sortuBonoa);

    // 8. Bazkideen gertaerak
    $("#btnRefreshBazkideak").on("click", () => {
        kargatuBazkideakKudeaketa();
        erakutsiMezua("info", "Bazkideak eguneratu dira.");
    });
    $("#checkBazkideakEzabatuak").on("change", kargatuBazkideakKudeaketa);
    $("#bazkideForm").on("submit", sortuBazkidea);

    // 9. Datu guztiak hasieratu
    egiaztatuApiKonexioa();
    kargatuHautagarriak();
    kargatuErreserbak();
    kargatuPistak();
    kargatuBonoak();
    kargatuBazkideakKudeaketa();
});
