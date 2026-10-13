<?php
// Partiel partagé : squelette HTML + barre supérieure + header de navigation.
// Variables attendues (optionnelles) : $title, $description, $active, $extraCss (array), $lang
$title       = $title ?? "FEDPAWA CORPORATE SOLUTIONS | Infrastructure d'affaires à Douala, Logpom";
$description = $description ?? "FEDPAWA CORPORATE SOLUTIONS — Infrastructure d'affaires et hub opérationnel à Douala, Logpom : domiciliation, création d'entreprise, fiscalité, OAPI, contrats et espace client 100 % en ligne.";
$active      = $active ?? '';
$lang        = $lang ?? 'fr';
$servicesActive = in_array($active, ['services', 'domiciliation', 'creation', 'fiscalite', 'oapi', 'contrats'], true);
$langPrefix = $lang === 'en' ? '/en' : '';
?>
<!DOCTYPE html>
<html lang="<?= $lang ?>" data-theme="navy" data-mode="dark"<?= isset($dataAuth) ? ' data-auth="' . $dataAuth . '"' : '' ?>>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="<?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?>">
<title><?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?></title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Open+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="<?= $langPrefix ?>assets/css/style.css?v=2">
<link rel="stylesheet" href="<?= $langPrefix ?>assets/css/components.css?v=2">
<?php foreach (($extraCss ?? []) as $css): ?><link rel="stylesheet" href="<?= htmlspecialchars($langPrefix . $css, ENT_QUOTES, 'UTF-8') ?>"><?php endforeach; ?>
</head>
<body>
<!-- ============== TOP BAR ============== -->
<div class="top-bar">
  <div class="container">
    <div class="top-bar-info">
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> <?= $lang === "en" ? "Logpom Pharmacy Building, Douala" : "Immeuble Pharmacie de Logpom, Douala" ?></span>
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> <?= $lang === "en" ? "Mon–Fri 8:00–18:00 · Sat 9:00–14:00" : "Lun–Ven 8h00–18h00 · Sam 9h00–14h00" ?></span>
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="m22 6-10 7L2 6"/></svg> contact@fedpawa.com</span>
    </div>
  </div>
</div>

<!-- ============== HEADER ============== -->
<header class="site-header" id="siteHeader">
  <div class="container header-inner">
    <a class="brand" href="<?= $langPrefix ?>index.php" aria-label="FEDPAWA CORPORATE SOLUTIONS">
      <img class="brand-logo" src="<?= $langPrefix ?>assets/images/logo.jpg" alt="Logo FEDPAWA Corporate Solutions">
      <span class="brand-copy"><strong>FEDPAWA</strong><small>Corporate Solutions</small></span>
    </a>
    <nav class="main-nav">
      <ul class="nav-list">
        <li><a class="nav-link <?= $active === 'index' ? 'is-active' : '' ?>" href="<?= $langPrefix ?>index.php"><?= $lang === "en" ? "Home" : "Accueil" ?></a></li>
        <li class="nav-dropdown">
          <a class="nav-link <?= $servicesActive ? 'is-active' : '' ?>" href="#"><?= $lang === "en" ? "Services ▾" : "Services ▾" ?></a>
          <ul class="dropdown-menu">
            <li><a class="<?= $active === 'domiciliation' ? 'is-active' : '' ?>" href="<?= $langPrefix ?>domiciliation.php">Domiciliation</a></li>
            <li><a class="<?= $active === 'creation' ? 'is-active' : '' ?>" href="<?= $langPrefix ?>creation_entreprise.php"><?= $lang === 'en' ? 'Company Formation' : "Création d'entreprise" ?></a></li>
            <li><a class="<?= $active === 'fiscalite' ? 'is-active' : '' ?>" href="<?= $langPrefix ?>fiscalite.php"><?= $lang === "en" ? "Tax & Legal Advisory" : "Conseils & Suivi Fiscal" ?></a></li>
            <li><a class="<?= $active === 'oapi' ? 'is-active' : '' ?>" href="<?= $langPrefix ?>oapi.php"><?= $lang === "en" ? "OAPI Protection" : "Protection OAPI" ?></a></li>
            <li><a class="<?= $active === 'contrats' ? 'is-active' : '' ?>" href="<?= $langPrefix ?>contrats.php"><?= $lang === "en" ? "Contracts" : "Contrats" ?></a></li>
          </ul>
        </li>
        <li><a class="nav-link <?= $active === 'about' ? 'is-active' : '' ?>" href="<?= $langPrefix ?>qui-sommes-nous.php"><?= $lang === "en" ? "About Us" : "Qui sommes-nous" ?></a></li>
        <li><a class="nav-link <?= $active === 'contact' ? 'is-active' : '' ?>" href="<?= $langPrefix ?>contact.php">Contact</a></li>
      </ul>
    </nav>
    <button class="menu-toggle" id="menuToggle" aria-label="Ouvrir le menu / Open menu" aria-expanded="false"><span></span><span></span><span></span></button>
    <div class="nav-actions" id="navActions">
      <!-- Connection state will be toggled by JS -->
      <!-- For non-connected users: settings button -->
      <!-- For connected users: Espace Client + Profile button -->
    </div>
  </div>
</header>

<!-- ============== MOBILE NAVIGATION ============== -->
<div class="mobile-nav" id="mobileNav">
  <nav>
    <a href="<?= $langPrefix ?>index.php"><?= $lang === "en" ? "Home" : "Accueil" ?></a>
    <a href="<?= $langPrefix ?>domiciliation.php">Domiciliation</a>
    <a href="<?= $langPrefix ?>creation_entreprise.php"><?= $lang === 'en' ? 'Company Formation' : "Création d'entreprise" ?></a>
    <a href="<?= $langPrefix ?>fiscalite.php"><?= $lang === "en" ? "Tax & Legal Advisory" : "Conseils & Suivi Fiscal" ?></a>
    <a href="<?= $langPrefix ?>oapi.php"><?= $lang === "en" ? "OAPI Protection" : "Protection OAPI" ?></a>
    <a href="<?= $langPrefix ?>contrats.php"><?= $lang === "en" ? "Contracts" : "Contrats" ?></a>
    <a href="<?= $langPrefix ?>qui-sommes-nous.php"><?= $lang === "en" ? "About Us" : "Qui sommes-nous" ?></a>
    <a href="<?= $langPrefix ?>contact.php">Contact</a>

    <a class="mobile-cta" href="<?= $langPrefix ?>tunnel_souscription.php"><?= $lang === 'en' ? 'Subscribe' : 'Je m\'abonne' ?></a>
    <!-- Toggles inside mobile menu -->
    <div class="mobile-nav-toggles">
      <button class="mode-toggle mobile-mode-toggle" id="mobileModeToggle" aria-label="Basculer en mode sombre/clair" title="Light / dark mode">
        <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
      <button class="lang-toggle mobile-lang-toggle" id="mobileLangToggle" aria-label="Switch language / Changer de langue" title="FR / EN"><?= $lang === "en" ? "FR" : "EN" ?></button>
      <button class="mobile-close-btn" aria-label="Fermer le menu" title="Fermer le menu">×</button>
    </div>
  </nav>
</div>

<main>
</main>
</body>
</html>