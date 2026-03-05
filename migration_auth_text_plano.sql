-- MIGración A AUTENTICACIÓN PERSONALIZADA (TEXTO PLANO)

-- 1. Quitar la referencia a Supabase Auth en la tabla de usuarios
ALTER TABLE sportex_usuarios DROP CONSTRAINT IF EXISTS sportex_usuarios_id_fkey;

-- 2. Asegurar que el ID sea autogenerado por la base de datos
ALTER TABLE sportex_usuarios ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Agregar campos para Login manual
ALTER TABLE sportex_usuarios ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE sportex_usuarios ADD COLUMN IF NOT EXISTS password TEXT;

-- 4. DESHABILITAR RLS (Row Level Security)
-- Como pediste texto plano y manejo simplificado, deshabilitamos RLS
-- para que el filtrado se haga directamente en los hooks de la app.
ALTER TABLE sportex_usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE sportex_clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE sportex_pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE sportex_leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE sportex_transacciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE sportex_etapas_leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE sportex_etapas_pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE sportex_pedidos_historial DISABLE ROW LEVEL SECURITY;
ALTER TABLE sportex_leads_historial DISABLE ROW LEVEL SECURITY;

-- 5. OPCIONAL: Limpiar datos de auth previos si lo deseas
-- DELETE FROM sportex_usuarios;
