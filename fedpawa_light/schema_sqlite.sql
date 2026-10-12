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
    transaction_id TEXT,
    date DATETIME NOT NULL,
    statut TEXT DEFAULT 'en_attente',
    FOREIGN KEY (client_id) REFERENCES clients(id)
);
CREATE INDEX IF NOT EXISTS idx_paiements_transaction ON paiements(transaction_id);

CREATE TABLE IF NOT EXISTS tickets_support (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    sujet TEXT NOT NULL,
    message TEXT NOT NULL,
    statut TEXT DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

CREATE TABLE IF NOT EXISTS contract_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contract_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    old_content TEXT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES contract_templates(id)
);

CREATE TABLE IF NOT EXISTS internal_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    sender_type TEXT NOT NULL,
    receiver_id INTEGER,
    receiver_type TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_messages_client ON internal_messages(sender_id, receiver_id);

CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    mot_de_passe TEXT NOT NULL
);
INSERT OR IGNORE INTO admins (email, mot_de_passe) VALUES ('mme.law@fedpawa.com', '$argon2id$v=19$m=65536,t=4,p=1$N2xoNG9TdjkzUmFycjJtOQ$4C4pxqp+cIJHYvdwy0akG9JSPQ9X59Cft3sGVgVc1Z8');

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    user_id INTEGER,
    user_type TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);

CREATE TABLE IF NOT EXISTS login_throttle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier TEXT NOT NULL,
    user_type TEXT NOT NULL,
    ip TEXT,
    attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    last_attempt_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_throttle_ident ON login_throttle(identifier, user_type);
