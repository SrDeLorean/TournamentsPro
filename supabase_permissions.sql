
-- =============================================================================
-- PERMISOS MÍNIMOS Y OPERACIONES ATÓMICAS PARA SUPABASE
-- Ejecutar con un rol propietario (postgres) desde SQL Editor.
-- La aplicación accede a datos exclusivamente desde el servidor con service_role.
-- =============================================================================

BEGIN;

-- Eliminar los grants globales históricos. Las claves públicas no deben poder
-- consultar tablas, secuencias ni rutinas del esquema de aplicación.
-- PUBLIC también importa: sus grants son heredados por anon y authenticated.
REVOKE ALL ON SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated;
-- El permiso EXECUTE para PUBLIC es global por defecto en PostgreSQL: el REVOKE
-- por esquema no basta para impedir que se conceda a futuras funciones.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

-- Incremento transaccional: elimina la carrera select -> update/insert del
-- limitador distribuido. p_now_ms permite pruebas deterministas.
CREATE OR REPLACE FUNCTION public.consume_security_rate_limit(
  p_rate_key TEXT,
  p_action_name TEXT,
  p_max_requests INTEGER,
  p_window_ms BIGINT,
  p_now_ms BIGINT
)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, reset_at BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := to_timestamp(p_now_ms / 1000.0);
  v_expires TIMESTAMPTZ := to_timestamp((p_now_ms + p_window_ms) / 1000.0);
  v_count INTEGER;
  v_reset TIMESTAMPTZ;
BEGIN
  IF p_max_requests < 1 OR p_window_ms < 1 THEN
    RAISE EXCEPTION 'Invalid rate limit configuration';
  END IF;

  INSERT INTO public.security_rate_limits (
    rate_key, action_name, request_count, window_started_at, expires_at, updated_at
  )
  VALUES (p_rate_key, p_action_name, 1, v_now, v_expires, v_now)
  ON CONFLICT (rate_key, action_name) DO UPDATE SET
    request_count = CASE
      WHEN security_rate_limits.expires_at <= v_now THEN 1
      ELSE security_rate_limits.request_count + 1
    END,
    window_started_at = CASE
      WHEN security_rate_limits.expires_at <= v_now THEN v_now
      ELSE security_rate_limits.window_started_at
    END,
    expires_at = CASE
      WHEN security_rate_limits.expires_at <= v_now THEN v_expires
      ELSE security_rate_limits.expires_at
    END,
    updated_at = v_now
  RETURNING request_count, expires_at INTO v_count, v_reset;

  RETURN QUERY SELECT
    v_count <= p_max_requests,
    GREATEST(0, p_max_requests - v_count),
    FLOOR(EXTRACT(EPOCH FROM v_reset) * 1000)::BIGINT;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_security_rate_limit(TEXT, TEXT, INTEGER, BIGINT, BIGINT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_security_rate_limit(TEXT, TEXT, INTEGER, BIGINT, BIGINT)
  TO service_role;

COMMIT;
