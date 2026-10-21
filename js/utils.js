// =============================================================================
// UTILITATEAK: ERANTZUNEN TRATAMENDUA, MEZUAK ETA SEGURITATEA
// =============================================================================

// APIren erantzun formatu desberdinak (dataList / data / array arrunta) normalizatzeko
function unwrapData(json) {
  if (!json)                                 return [];
  if (Array.isArray(json))                   return json;
  if (Array.isArray(json.dataList))          return json.dataList;
  if (json.data && Array.isArray(json.data)) return json.data;
  if (json.data)                             return json.data;
  return json;
}

// Erantzun JSONetik testu mezua erauzteko
function lortuMezua(data, defecto = "Eragiketa burutu da") {
  if (!data) return defecto;
  return data.message || data.mezua || data.detail || defecto;
}

// Alert mezua erakutsi goialdean animazioarekin
function erakutsiMezua(mota, testua) {
    const $container = $("#alertContainer");
    $container.empty();

    const $alert = $(`
        <div class="alert alert-${mota}" style="display:none;">
            <span>${eskapatuHtml(testua)}</span>
            <button class="alert-close">&times;</button>
        </div>
    `);

    $alert.find(".alert-close").on("click", function() {
        $alert.fadeOut(200, function() { $(this).remove(); });
    });

    $container.append($alert);
    $alert.fadeIn(300);

    setTimeout(() => {
        if ($alert.is(":visible")) {
            $alert.fadeOut(400, function() { $(this).remove(); });
        }
    }, 8000);
}

// XSS saihesteko HTML karaktere bereziak eskapatu
function eskapatuHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
