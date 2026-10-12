# Déploiement FEDPAWA Light

## Configuration serveur requise

### 1. Racine web (critique)
La racine du serveur web (DocumentRoot) **doit pointer sur `public/`**, jamais sur la racine du projet :

```apache
# Apache (vhost)
DocumentRoot "/var/www/fedpawa_light/public"
<Directory "/var/www/fedpawa_light/public">
    AllowOverride All
    Require all granted
</Directory>
```

Nginx (.htaccess y est inopérant — interdire explicitement l'accès aux dossiers sensibles) :

```nginx
# Nginx
root /var/www/fedpawa_light/public;
location ~* ^/(storage|src|templates|vendor)/ { deny all; return 404; }
location / { try_files $uri $uri/ /index.php?$query_string; }
```

Le dossier `storage/` (base SQLite, logs, uploads, backups, documents) est hors de la racine web et protégé par `storage/.htaccess` (Apache) — il ne doit **jamais** être servi directement. Les fichiers sont servis uniquement via l'endpoint authentifié `/api/document`.

### 2. PHP
- `memory_limit >= 256M` (génération PDF multi-pages)
- `upload_max_filesize` / `post_max_size` >= 10M
- Extensions : `pdo_sqlite`, `gd`, `curl`, `fileinfo`

### 3. Environnement (.env, non versionné)
```env
APP_DEBUG=false            # true uniquement en développement local
CRON_SECRET=<chaîne aléatoire longue>
CAMPAY_USER=<identifiants demo Campay>
CAMPAY_PASSWORD=<mot de passe demo Campay>
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
SMTP_PORT=587
MAIL_FROM=contact@fedpawa.com
```

### 4. Tâches planifiées (crontab)
```cron
# Backup quotidien de la base (3h30)
30 3 * * * /bin/bash /var/www/fedpawa_light/scripts/backup_database.sh >> /var/www/fedpawa_light/storage/logs/backup.log 2>&1

# Rappels d'abonnement (4h) - préférer le CLI (aucun secret requis)
0 4 * * * /usr/bin/php /var/www/fedpawa_light/public/cron.php
# Alternative HTTP si CLI indisponible :
# 0 4 * * * wget -qO- 'https://site/cron.php?key=CRON_SECRET'
```

### 5. Après le déploiement
- Vérifier que `https://site/storage/logs/campay.log` renvoie 404.
- Vérifier que `https://site/cron.php` (sans clé) renvoie 403.
- Les backups sont dans `storage/backups/` (rotation 14 jours).
