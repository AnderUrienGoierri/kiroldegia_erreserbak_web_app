// =============================================================================
// API KONFIGURAZIOA, KONEXIOA ETA EGOERA OROKORRA
// =============================================================================

const DEFAULT_API_URL = "http://localhost:5089";
let apiUrl = localStorage.getItem("kiroldegia_api_url") || DEFAULT_API_URL;

// Cache orokorrak formularioak eta zerrendak sinkronizatzeko
let cacheBazkideak = [];
let cachePistak = [];
let cacheBonoak = [];

// API helbidea aldatu eta datu guztiak freskatu
function eguneratuApiUrl(helbideBerria) {
    if (!helbideBerria) helbideBerria = DEFAULT_API_URL;
    if (helbideBerria.endsWith("/")) helbideBerria = helbideBerria.slice(0, -1);
    apiUrl = helbideBerria;
    $("#apiUrlInput").val(apiUrl);
    localStorage.setItem("kiroldegia_api_url", apiUrl);

    egiaztatuApiKonexioa();
    kargatuHautagarriak();
    kargatuErreserbak();
    kargatuPistak();
    kargatuBonoak();
    kargatuBazkideakKudeaketa();
}

// API konexioa egiaztatu (ping /api/pistak bidez)
async function egiaztatuApiKonexioa() {
    $("#apiStatusBadge").attr("class", "status-indicator");
    $("#apiStatusText").text("Konektatzen...");

    try {
        await $.ajax({
            url: `${apiUrl}/api/pistak`,
            method: "GET",
            timeout: 5000
        });
        $("#apiStatusBadge").attr("class", "status-indicator online");
        $("#apiStatusText").text(`API Konektatuta (${apiUrl})`);
        return true;
    } catch (err) {
        $("#apiStatusBadge").attr("class", "status-indicator offline");
        $("#apiStatusText").text(`API Deskonektatuta (${apiUrl})`);
        return false;
    }
}
