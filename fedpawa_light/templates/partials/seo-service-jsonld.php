<?php
// Partiel SEO (BRIEF-S) : JSON-LD "Service" par page de service.
// Données réelles copiées des $title/$description de chaque page — ne rien inventer.
// Attendu : $serviceSeo = ['name' => ..., 'description' => ..., 'url' => ..., 'serviceType' => ...]
if (!empty($serviceSeo) && is_array($serviceSeo)) {
    $svc = [
        '@context'    => 'https://schema.org',
        '@type'       => 'Service',
        '@id'         => $serviceSeo['url'] . '#service',
        'name'        => $serviceSeo['name'],
        'description' => $serviceSeo['description'],
        'url'         => $serviceSeo['url'],
        'serviceType' => $serviceSeo['serviceType'] ?? $serviceSeo['name'],
        'provider'    => ['@id' => 'https://www.fedpawa.com/#organization'],
        'areaServed'  => [
            ['@type' => 'Country', 'name' => 'Cameroun'],
            ['@type' => 'City', 'name' => 'Douala'],
        ],
    ];
    echo '<script type="application/ld+json">'
        . json_encode($svc, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        . '</script>' . "\n";
}
