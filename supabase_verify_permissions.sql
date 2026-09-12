-- Solo lectura. Ejecutar en el SQL Editor del proyecto Supabase de destino
-- después de aplicar supabase_permissions.sql.
-- Esperado: anon/authenticated = FALSE en todas las columnas;
-- service_role = TRUE para schema_usage y rate_limit_execute.
WITH principals(role_name) AS (
  VALUES ('anon'::name), ('authenticated'::name), ('service_role'::name)
)
SELECT
  role_name,
  has_schema_privilege(role_name, 'public', 'USAGE') AS schema_usage,
  EXISTS (
    SELECT 1
    FROM pg_class AS object
    JOIN pg_namespace AS namespace ON namespace.oid = object.relnamespace
    WHERE namespace.nspname = 'public'
      AND object.relkind IN ('r', 'p', 'v', 'm', 'f')
      AND (
        has_table_privilege(role_name, object.oid, 'SELECT')
        OR has_table_privilege(role_name, object.oid, 'INSERT')
        OR has_table_privilege(role_name, object.oid, 'UPDATE')
        OR has_table_privilege(role_name, object.oid, 'DELETE')
        OR has_table_privilege(role_name, object.oid, 'TRUNCATE')
        OR has_table_privilege(role_name, object.oid, 'REFERENCES')
        OR has_table_privilege(role_name, object.oid, 'TRIGGER')
      )
  ) AS any_table_access,
  EXISTS (
    SELECT 1
    FROM pg_class AS object
    JOIN pg_namespace AS namespace ON namespace.oid = object.relnamespace
    WHERE namespace.nspname = 'public'
      AND object.relkind = 'S'
      AND (
        has_sequence_privilege(role_name, object.oid, 'USAGE')
        OR has_sequence_privilege(role_name, object.oid, 'SELECT')
        OR has_sequence_privilege(role_name, object.oid, 'UPDATE')
      )
  ) AS any_sequence_access,
  EXISTS (
    SELECT 1
    FROM pg_proc AS routine
    JOIN pg_namespace AS namespace ON namespace.oid = routine.pronamespace
    WHERE namespace.nspname = 'public'
      AND has_function_privilege(role_name, routine.oid, 'EXECUTE')
  ) AS any_routine_execute,
  has_function_privilege(
    role_name,
    'public.consume_security_rate_limit(text,text,integer,bigint,bigint)'::regprocedure,
    'EXECUTE'
  ) AS rate_limit_execute
FROM principals;
