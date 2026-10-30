// src/scripts/spm-lead-form.js
(function() {
  var mount = document.querySelector(".spm-lead-form-mount");
  if (!mount || mount.querySelector("form")) return;
  var fields = [
    ["spm-name", "Nom complet *", "text", "name", true, "Jean Dupont", false],
    ["spm-role", "Fonction *", "text", "organization-title", true, "Directrice des op\xE9rations", false],
    ["spm-phone", "T\xE9l\xE9phone", "tel", "tel", false, "+33 6 12 34 56 78", false],
    ["spm-email", "Email professionnel *", "email", "email", true, "nom@entreprise.com", false],
    ["spm-company", "Entreprise *", "text", "organization", true, "Votre soci\xE9t\xE9", true]
  ];
  var options = [
    "Externaliser mon service client",
    "Renforcer mon back-office",
    "D\xE9velopper mes ventes",
    "Recrutement & staffing",
    "Autre besoin"
  ];
  var esc = function(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };
  var html = "";
  fields.forEach(function(f) {
    html += '<div class="spm-field' + (f[6] ? " spm-field--full" : "") + '"><label for="' + f[0] + '">' + esc(f[1]) + '</label><input id="' + f[0] + '" name="' + f[0] + '" type="' + f[2] + '" autocomplete="' + f[3] + '" placeholder="' + esc(f[5]) + '"' + (f[4] ? " required" : "") + "></div>";
  });
  html += '<div class="spm-field spm-field--full"><label for="spm-need">Comment pouvons-nous aider ? *</label><select id="spm-need" name="need" required><option value="" selected disabled>S\xE9lectionnez une option</option>';
  options.forEach(function(o) {
    html += "<option>" + esc(o) + "</option>";
  });
  html += "</select></div>";
  html += '<button type="submit" class="ti-btn spm-lead-submit">Envoyer ma demande</button>';
  html += `<p class="spm-lead-legal">En envoyant ce formulaire, vous acceptez d'\xEAtre recontact\xE9 par les \xE9quipes SPM.</p>`;
  var form = document.createElement("form");
  form.className = "spm-lead-form";
  form.setAttribute("novalidate", "");
  form.innerHTML = html;
  mount.appendChild(form);
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    if (form.checkValidity && !form.checkValidity()) {
      if (form.reportValidity) form.reportValidity();
      return;
    }
    form.innerHTML = '<div class="spm-lead-done" role="status"><span class="spm-lead-check" aria-hidden="true">\u2713</span><h3>Merci, votre demande est bien re\xE7ue.</h3><p>Un expert SPM vous recontacte le jour m\xEAme.</p></div>';
  });
})();
