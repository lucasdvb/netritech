/* hlab: Home Lab page only, inert on every other page */
(function () {
if (!document.querySelector('[class*="hlab-"]')) return;
// SPM lead-generation form — built in JS so Instatic's importer can't strip form fields.
(function () {
  var mount = document.querySelector('.hlab-spm-lead-form-mount');
  if (!mount || mount.querySelector('form')) return;

  // [id, label, type, autocomplete, required, placeholder, fullWidth]
  var fields = [
    ['spm-name', 'Nom complet *', 'text', 'name', true, 'Jean Dupont', false],
    ['spm-role', 'Fonction *', 'text', 'organization-title', true, 'Directrice des opérations', false],
    ['spm-phone', 'Téléphone', 'tel', 'tel', false, '+33 6 12 34 56 78', false],
    ['spm-email', 'Email professionnel *', 'email', 'email', true, 'nom@entreprise.com', false],
    ['spm-company', 'Entreprise *', 'text', 'organization', true, 'Votre société', true]
  ];
  var options = [
    'Externaliser mon service client',
    'Renforcer mon back-office',
    'Développer mes ventes',
    'Recrutement & staffing',
    'Autre besoin'
  ];

  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };

  var html = '';
  fields.forEach(function (f) {
    html += '<div class="hlab-spm-field' + (f[6] ? ' hlab-spm-field--full' : '') + '">' +
      '<label for="' + f[0] + '">' + esc(f[1]) + '</label>' +
      '<input id="' + f[0] + '" name="' + f[0] + '" type="' + f[2] + '" autocomplete="' + f[3] + '" placeholder="' + esc(f[5]) + '"' + (f[4] ? ' required' : '') + '></div>';
  });
  html += '<div class="hlab-spm-field hlab-spm-field--full"><label for="spm-need">Comment pouvons-nous aider ? *</label>' +
    '<select id="spm-need" name="need" required><option value="" selected disabled>Sélectionnez une option</option>';
  options.forEach(function (o) { html += '<option>' + esc(o) + '</option>'; });
  html += '</select></div>';
  html += '<button type="submit" class="hlab-ti-btn hlab-spm-lead-submit">Envoyer ma demande</button>';
  html += '<p class="hlab-spm-lead-legal">En envoyant ce formulaire, vous acceptez d\'être recontacté par les équipes SPM.</p>';

  var form = document.createElement('form');
  form.className = 'hlab-spm-lead-form';
  form.setAttribute('novalidate', '');
  form.innerHTML = html;
  mount.appendChild(form);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.checkValidity && !form.checkValidity()) {
      if (form.reportValidity) form.reportValidity();
      return;
    }
    form.innerHTML = '<div class="hlab-spm-lead-done" role="status">' +
      '<span class="hlab-spm-lead-check" aria-hidden="true">✓</span>' +
      '<h3>Merci, votre demande est bien reçue.</h3>' +
      '<p>Un expert SPM vous recontacte le jour même.</p></div>';
  });
})();

})();
