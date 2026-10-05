<?php
// Partiel partagé : squelette HTML + barre supérieure + header de navigation.
// Variables attendues (optionnelles) : $title, $description, $active, $extraCss (array)
$title       = $title ?? "FEDPAWA CORPORATE SOLUTIONS | Infrastructure d'affaires à Douala, Logpom";
$description = $description ?? "FEDPAWA CORPORATE SOLUTIONS — Infrastructure d'affaires et hub opérationnel à Douala, Logpom : domiciliation, création d'entreprise, fiscalité, OAPI, contrats et espace client 100 % en ligne.";
$active      = $active ?? '';
$extraCss    = $extraCss ?? [];
$servicesActive = in_array($active, ['services', 'domiciliation', 'creation', 'fiscalite', 'oapi', 'contrats'], true);
?>
<!DOCTYPE html>
<html lang="fr" data-theme="bordeaux" data-mode="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="<?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?>">
<title><?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?></title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Open+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
<link rel="stylesheet" href="assets/css/components.css">
<?php foreach ($extraCss as $css): ?>
<link rel="stylesheet" href="<?= htmlspecialchars($css, ENT_QUOTES, 'UTF-8') ?>">
<?php endforeach; ?>
</head>
<body>

<!-- ============== TOP BAR ============== -->
<div class="top-bar">
  <div class="container">
    <div class="top-bar-info">
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Immeuble Pharmacie de Logpom, Douala</span>
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Lun–Ven 8h00–18h00 · Sam 9h00–14h00</span>
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="m22 6-10 7L2 6"/></svg> contact@fedpawacorporatesolutions.com</span>
    </div>
  </div>
</div>

<!-- ============== HEADER ============== -->
<header class="site-header" id="siteHeader">
  <div class="container header-inner">
    <a class="brand" href="index.php" aria-label="FEDPAWA CORPORATE SOLUTIONS, accueil">
      <span class="brand-mark">F</span>
      <span class="brand-copy"><strong>FEDPAWA</strong><small>Corporate Solutions</small></span>
    </a>
    <button class="menu-toggle" id="menuToggle" aria-label="Ouvrir le menu"><span></span><span></span><span></span></button>
    <nav class="main-nav">
      <ul class="nav-list">
        <li><a class="nav-link <?= $active === 'index' ? 'is-active' : '' ?>" href="index.php">Accueil</a></li>
        <li class="nav-dropdown">
          <a class="nav-link <?= $servicesActive ? 'is-active' : '' ?>" href="#">Services ▾</a>
          <ul class="dropdown-menu">
            <li><a class="<?= $active === 'domiciliation' ? 'is-active' : '' ?>" href="domiciliation.php">Domiciliation</a></li>
            <li><a class="<?= $active === 'creation' ? 'is-active' : '' ?>" href="creation_entreprise.php">Création d'entreprise</a></li>
            <li><a class="<?= $active === 'fiscalite' ? 'is-active' : '' ?>" href="fiscalite.php">Conseils & Fiscalité</a></li>
            <li><a class="<?= $active === 'oapi' ? 'is-active' : '' ?>" href="oapi.php">Protection OAPI</a></li>
            <li><a class="<?= $active === 'contrats' ? 'is-active' : '' ?>" href="contrats.php">Contrats</a></li>
          </ul>
        </li>
        <li><a class="nav-link <?= $active === 'about' ? 'is-active' : '' ?>" href="index.php#difference">Qui sommes-nous</a></li>
        <li><a class="nav-link <?= $active === 'contact' ? 'is-active' : '' ?>" href="contact.php">Contact</a></li>
      </ul>
      <div class="nav-actions">
        <a class="nav-login" href="authentification.html">Se connecter</a>
        <a class="nav-cta" href="tunnel_souscription.php">Je m'abonne</a>
      </div>
    </nav>
  </div>
</header>

<div class="mobile-nav" id="mobileNav">
  <nav>
    <a href="index.php">Accueil</a>
    <a href="domiciliation.php">Domiciliation</a>
    <a href="creation_entreprise.php">Création d'entreprise</a>
    <a href="fiscalite.php">Conseils & Fiscalité</a>
    <a href="oapi.php">Protection OAPI</a>
    <a href="contrats.php">Contrats</a>
    <a href="index.php#difference">Qui sommes-nous</a>
    <a href="contact.php">Contact</a>
    <a href="authentification.html">Se connecter</a>
    <a class="mobile-cta" href="tunnel_souscription.php">Je m'abonne</a>
  </nav>
</div>

<main>
