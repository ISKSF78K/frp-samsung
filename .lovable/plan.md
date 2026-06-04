## Objectif
Recréer toute la structure de la base de données (vide actuellement) pour le projet **Samsung Lock Tool**.

## Ce que je vais créer en une seule migration

### 1. Enum
- `app_role` : `'admin' | 'user'`

### 2. Tables (avec GRANT + RLS)
- **`profiles`** : `id`, `email`, `username`, `credits` (défaut 0)
- **`user_roles`** : `user_id`, `role` — séparée des profils pour la sécurité
- **`lock_operations`** : `user_id`, `device_model`, `device_imei`, `status`, `credits_spent`, `log`

### 3. Fonctions
- `has_role(_user_id, _role)` — SECURITY DEFINER, évite la récursion RLS
- `handle_new_user()` — trigger : crée le profil à l'inscription, donne le rôle **admin au 1er utilisateur**, `user` aux suivants
- `prevent_credit_self_update()` — empêche un user de modifier ses propres crédits (seul un admin peut)
- `perform_lock_operation(_device_model, _device_imei)` — débite **5 crédits** atomiquement et crée l'opération

### 4. Triggers
- `on_auth_user_created` sur `auth.users` → `handle_new_user()`
- `prevent_credit_self_update_trigger` sur `profiles` BEFORE UPDATE

### 5. Politiques RLS
- **profiles** : user voit/modifie le sien ; admin voit/modifie tous
- **user_roles** : user voit ses rôles ; admin gère tous
- **lock_operations** : user voit/insère les siennes ; admin voit toutes

## Après la migration
1. Tu vas sur `/auth` et tu crées **le premier compte** → tu deviens automatiquement admin
2. Tu te rends sur `/admin` pour recharger des crédits et tester
3. Je lance le linter Supabase pour vérifier qu'il n'y a aucune faille
