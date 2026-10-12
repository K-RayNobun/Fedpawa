CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    civilité TEXT,
    nom TEXT NOT NULL,
    entreprise TEXT NOT NULL,
    forme_juridique TEXT,
    rc TEXT,
    ifu TEXT,
    email TEXT NOT NULL UNIQUE,
    telephone TEXT,
    adresse TEXT,
    pays TEXT,
    activite TEXT,
    mot_de_passe TEXT NOT NULL,
    date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
    statut TEXT DEFAULT 'actif'
);

CREATE TABLE IF NOT EXISTS abonnements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    pack TEXT NOT NULL,
    prix REAL NOT NULL,
    engagement INTEGER DEFAULT 0,
    date_debut DATETIME NOT NULL,
    date_fin DATETIME,
    statut TEXT DEFAULT 'en_attente',
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS paiements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    montant REAL NOT NULL,
    mode_paiement TEXT NOT NULL,
    date DATETIME NOT NULL,
    statut TEXT DEFAULT 'en_attente',
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS factures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    numero TEXT NOT NULL UNIQUE,
    montant REAL NOT NULL,
    date DATETIME NOT NULL,
    lien_pdf TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS contrats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    fichier TEXT NOT NULL,
    date_signature DATETIME NOT NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS courriers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    date_reception DATETIME NOT NULL,
    scan TEXT,
    statut TEXT DEFAULT 'non_lu',
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS kyc (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    piece_identite TEXT,
    statuts TEXT DEFAULT 'en_cours',
    justificatif_domicile TEXT,
    description_activite TEXT,
    date_soumission DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);
