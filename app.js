(function () {
  var ids = ['income', 'expenses', 'tax', 'weeksOff', 'hours', 'buffer', 'projHours'];
  var el = {};
  ids.forEach(function (k) { el[k] = document.getElementById(k); });
  var $ = function (id) { return document.getElementById(id); };
  var money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  var money2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var num = function (k) { var v = parseFloat(el[k].value); return isFinite(v) ? v : 0; };

  // Load from query string
  var qs = new URLSearchParams(location.search);
  ids.forEach(function (k) { if (qs.has(k) && qs.get(k) !== '' && isFinite(parseFloat(qs.get(k)))) el[k].value = qs.get(k); });

  function calc(v) {
    var weeks = 52 - v.weeksOff;
    var hoursYear = weeks * v.hours;
    var t = v.tax / 100;
    if (hoursYear <= 0) return { error: 'Billable hours per year must be above zero. Check weeks off and hours per week.' };
    if (t >= 1) return { error: 'Tax rate must be below 100%.' };
    var revenue = v.income / (1 - t) + v.expenses;
    var min = revenue / hoursYear;
    var rec = min * (1 + v.buffer / 100);
    return {
      hoursYear: hoursYear, revenueMin: revenue, min: min, rec: rec, day: rec * 8,
      week: rec * v.hours, year: rec * hoursYear, month: rec * hoursYear / 12,
      pbase: v.projHours * rec, pquote: v.projHours * rec * 1.15
    };
  }

  function update() {
    var v = {}; ids.forEach(function (k) { v[k] = Math.max(0, num(k)); });
    var r = calc(v);
    var err = $('o-err');
    if (r.error) {
      err.textContent = r.error; err.hidden = false;
      ['o-rec', 'o-min', 'o-day', 'o-week', 'o-month', 'o-year', 'o-hrs', 'o-pbase', 'o-pquote'].forEach(function (i) { $(i).textContent = '–'; });
    } else {
      err.hidden = true;
      $('o-rec').textContent = money2.format(r.rec) + '/h';
      $('o-min').textContent = money2.format(r.min) + '/h';
      $('o-day').textContent = money.format(r.day);
      $('o-week').textContent = money.format(r.week);
      $('o-month').textContent = money.format(r.month);
      $('o-year').textContent = money.format(r.year);
      $('o-hrs').textContent = Math.round(r.hoursYear).toLocaleString('en-US');
      $('o-pbase').textContent = money.format(r.pbase);
      $('o-pquote').textContent = money.format(r.pquote);
    }
    var p = new URLSearchParams();
    ids.forEach(function (k) { p.set(k, el[k].value); });
    history.replaceState(null, '', location.pathname + '?' + p.toString());
  }

  ids.forEach(function (k) { el[k].addEventListener('input', update); });
  $('share').addEventListener('click', function () {
    var msg = $('share-msg');
    var done = function () { msg.textContent = 'Link copied'; setTimeout(function () { msg.textContent = ''; }, 2500); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(location.href).then(done, function () { msg.textContent = 'Copy the URL from your address bar'; });
    } else { msg.textContent = 'Copy the URL from your address bar'; }
  });
  update();
  if (typeof module !== 'undefined') module.exports = calc;
})();
