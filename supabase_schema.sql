-- =============================================
-- SPORTEX - Esquema de Base de Datos
-- Prefijo: sportex_
-- Idioma: Español
-- =============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA: sportex_usuarios
-- Información extendida de usuarios (complementa auth.users)
-- =============================================
CREATE TABLE sportex_usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    nombre_empresa TEXT,
    telefono TEXT,
    logo_url TEXT,
    configuracion JSONB DEFAULT '{}',
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: sportex_etapas_leads
-- Etapas configurables del funnel de leads
-- =============================================
CREATE TABLE sportex_etapas_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES sportex_usuarios(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    orden INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: sportex_etapas_pedidos
-- Estados configurables de los pedidos
-- =============================================
CREATE TABLE sportex_etapas_pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES sportex_usuarios(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    color TEXT DEFAULT '#10B981',
    orden INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: sportex_clientes
-- Base de datos de clientes
-- =============================================
CREATE TABLE sportex_clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES sportex_usuarios(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    nombre_club TEXT,
    email TEXT,
    telefono TEXT,
    direccion TEXT,
    notas TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: sportex_leads
-- Leads/Prospectos
-- =============================================
CREATE TABLE sportex_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES sportex_usuarios(id) ON DELETE CASCADE,
    etapa_id UUID REFERENCES sportex_etapas_leads(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    nombre_club TEXT,
    email TEXT,
    telefono TEXT,
    valor_estimado DECIMAL(12,2) DEFAULT 0,
    notas TEXT,
    orden_en_etapa INTEGER DEFAULT 0,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: sportex_leads_historial
-- Historial de movimientos de leads
-- =============================================
CREATE TABLE sportex_leads_historial (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES sportex_leads(id) ON DELETE CASCADE,
    etapa_anterior_id UUID REFERENCES sportex_etapas_leads(id),
    etapa_nueva_id UUID REFERENCES sportex_etapas_leads(id),
    cambiado_en TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: sportex_pedidos
-- Pedidos principales
-- =============================================
CREATE TABLE sportex_pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES sportex_usuarios(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES sportex_clientes(id) ON DELETE SET NULL,
    etapa_id UUID REFERENCES sportex_etapas_pedidos(id) ON DELETE SET NULL,
    numero_pedido TEXT NOT NULL,
    fecha_pedido DATE DEFAULT CURRENT_DATE,
    fecha_entrega DATE,
    precio_total DECIMAL(12,2) DEFAULT 0,
    costo_total DECIMAL(12,2) DEFAULT 0,
    boceto_url TEXT,
    talles JSONB DEFAULT '[]',
    notas TEXT,
    orden_en_etapa INTEGER DEFAULT 0,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: sportex_pedidos_items
-- Items/Productos de cada pedido
-- =============================================
CREATE TABLE sportex_pedidos_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES sportex_pedidos(id) ON DELETE CASCADE,
    tipo_producto TEXT NOT NULL,
    descripcion TEXT,
    cantidad INTEGER DEFAULT 1,
    precio_unitario DECIMAL(12,2) DEFAULT 0,
    costo_unitario DECIMAL(12,2) DEFAULT 0,
    talles JSONB DEFAULT '[]',
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: sportex_pedidos_historial
-- Historial de cambios de estado de pedidos
-- =============================================
CREATE TABLE sportex_pedidos_historial (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES sportex_pedidos(id) ON DELETE CASCADE,
    etapa_anterior_id UUID REFERENCES sportex_etapas_pedidos(id),
    etapa_nueva_id UUID REFERENCES sportex_etapas_pedidos(id),
    cambiado_en TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: sportex_transacciones
-- Ingresos y egresos financieros
-- =============================================
CREATE TABLE sportex_transacciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES sportex_usuarios(id) ON DELETE CASCADE,
    pedido_id UUID REFERENCES sportex_pedidos(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    monto DECIMAL(12,2) NOT NULL,
    categoria TEXT,
    descripcion TEXT,
    fecha_transaccion DATE DEFAULT CURRENT_DATE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES para mejor performance
-- =============================================
CREATE INDEX idx_clientes_usuario ON sportex_clientes(usuario_id);
CREATE INDEX idx_leads_usuario ON sportex_leads(usuario_id);
CREATE INDEX idx_leads_etapa ON sportex_leads(etapa_id);
CREATE INDEX idx_pedidos_usuario ON sportex_pedidos(usuario_id);
CREATE INDEX idx_pedidos_cliente ON sportex_pedidos(cliente_id);
CREATE INDEX idx_pedidos_etapa ON sportex_pedidos(etapa_id);
CREATE INDEX idx_pedidos_fecha_entrega ON sportex_pedidos(fecha_entrega);
CREATE INDEX idx_transacciones_usuario ON sportex_transacciones(usuario_id);
CREATE INDEX idx_transacciones_fecha ON sportex_transacciones(fecha_transaccion);
CREATE INDEX idx_transacciones_tipo ON sportex_transacciones(tipo);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- Cada usuario solo ve sus propios datos
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE sportex_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sportex_etapas_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sportex_etapas_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sportex_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sportex_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sportex_leads_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE sportex_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sportex_pedidos_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sportex_pedidos_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE sportex_transacciones ENABLE ROW LEVEL SECURITY;

-- Políticas para sportex_usuarios
CREATE POLICY "Usuarios ven su propio perfil" ON sportex_usuarios
    FOR ALL USING (auth.uid() = id);

-- Políticas para sportex_etapas_leads
CREATE POLICY "Usuarios gestionan sus etapas de leads" ON sportex_etapas_leads
    FOR ALL USING (auth.uid() = usuario_id);

-- Políticas para sportex_etapas_pedidos
CREATE POLICY "Usuarios gestionan sus etapas de pedidos" ON sportex_etapas_pedidos
    FOR ALL USING (auth.uid() = usuario_id);

-- Políticas para sportex_clientes
CREATE POLICY "Usuarios gestionan sus clientes" ON sportex_clientes
    FOR ALL USING (auth.uid() = usuario_id);

-- Políticas para sportex_leads
CREATE POLICY "Usuarios gestionan sus leads" ON sportex_leads
    FOR ALL USING (auth.uid() = usuario_id);

-- Políticas para sportex_leads_historial
CREATE POLICY "Usuarios ven historial de sus leads" ON sportex_leads_historial
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sportex_leads 
            WHERE sportex_leads.id = sportex_leads_historial.lead_id 
            AND sportex_leads.usuario_id = auth.uid()
        )
    );

-- Políticas para sportex_pedidos
CREATE POLICY "Usuarios gestionan sus pedidos" ON sportex_pedidos
    FOR ALL USING (auth.uid() = usuario_id);

-- Políticas para sportex_pedidos_items
CREATE POLICY "Usuarios gestionan items de sus pedidos" ON sportex_pedidos_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sportex_pedidos 
            WHERE sportex_pedidos.id = sportex_pedidos_items.pedido_id 
            AND sportex_pedidos.usuario_id = auth.uid()
        )
    );

-- Políticas para sportex_pedidos_historial
CREATE POLICY "Usuarios ven historial de sus pedidos" ON sportex_pedidos_historial
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sportex_pedidos 
            WHERE sportex_pedidos.id = sportex_pedidos_historial.pedido_id 
            AND sportex_pedidos.usuario_id = auth.uid()
        )
    );

-- Políticas para sportex_transacciones
CREATE POLICY "Usuarios gestionan sus transacciones" ON sportex_transacciones
    FOR ALL USING (auth.uid() = usuario_id);

-- =============================================
-- TRIGGER: Actualizar campo actualizado_en
-- =============================================
CREATE OR REPLACE FUNCTION update_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_usuarios_actualizado
    BEFORE UPDATE ON sportex_usuarios
    FOR EACH ROW EXECUTE FUNCTION update_actualizado_en();

CREATE TRIGGER tr_clientes_actualizado
    BEFORE UPDATE ON sportex_clientes
    FOR EACH ROW EXECUTE FUNCTION update_actualizado_en();

CREATE TRIGGER tr_leads_actualizado
    BEFORE UPDATE ON sportex_leads
    FOR EACH ROW EXECUTE FUNCTION update_actualizado_en();

CREATE TRIGGER tr_pedidos_actualizado
    BEFORE UPDATE ON sportex_pedidos
    FOR EACH ROW EXECUTE FUNCTION update_actualizado_en();

-- =============================================
-- TRIGGER: Crear perfil de usuario automáticamente
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO sportex_usuarios (id, email)
    VALUES (NEW.id, NEW.email);
    
    -- Crear etapas de leads por defecto
    INSERT INTO sportex_etapas_leads (usuario_id, nombre, color, orden) VALUES
        (NEW.id, 'Nuevo Lead', '#6366F1', 0),
        (NEW.id, 'Contactado', '#3B82F6', 1),
        (NEW.id, 'Propuesta Enviada', '#F59E0B', 2),
        (NEW.id, 'Negociación', '#8B5CF6', 3),
        (NEW.id, 'Cerrado Ganado', '#10B981', 4),
        (NEW.id, 'Cerrado Perdido', '#EF4444', 5);
    
    -- Crear etapas de pedidos por defecto
    INSERT INTO sportex_etapas_pedidos (usuario_id, nombre, color, orden) VALUES
        (NEW.id, 'Nuevo', '#6366F1', 0),
        (NEW.id, 'En Diseño', '#3B82F6', 1),
        (NEW.id, 'En Producción', '#F59E0B', 2),
        (NEW.id, 'Control de Calidad', '#8B5CF6', 3),
        (NEW.id, 'Listo para Entregar', '#10B981', 4),
        (NEW.id, 'Entregado', '#059669', 5);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
