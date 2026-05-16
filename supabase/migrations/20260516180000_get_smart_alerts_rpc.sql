-- Smart alerts computed server-side (replaces heavy client-side aggregation)
CREATE OR REPLACE FUNCTION public.get_smart_alerts()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH ws AS (
    SELECT public.current_workshop_id() AS id
  ),
  dismissed AS (
    SELECT da.client_id
    FROM public.dismissed_alerts da
    CROSS JOIN ws
    WHERE da.workshop_id = ws.id
      AND da.dispensado_em > now() - interval '30 days'
  ),
  retorno AS (
    SELECT jsonb_build_object(
      'tipo', 'retorno',
      'key', 'retorno:' || c.id::text,
      'clientId', c.id,
      'nome', c.nome,
      'telefone', c.telefone,
      'diasSemVisita', (current_date - last_os.data_entrada::date),
      'veiculo', nullif(trim(coalesce(last_os.marca, '') || ' ' || coalesce(last_os.modelo, '')), ''),
      'placa', last_os.placa
    ) AS alert
    FROM public.clients c
    CROSS JOIN ws
    JOIN LATERAL (
      SELECT
        so.data_entrada,
        v.placa,
        v.marca,
        v.modelo
      FROM public.service_orders so
      JOIN public.vehicles v ON v.id = so.vehicle_id
      WHERE so.client_id = c.id
        AND so.workshop_id = ws.id
      ORDER BY so.data_entrada DESC
      LIMIT 1
    ) last_os ON true
    WHERE c.workshop_id = ws.id
      AND last_os.data_entrada < now() - interval '90 days'
      AND NOT EXISTS (SELECT 1 FROM dismissed d WHERE d.client_id = c.id)
  ),
  revisao_km AS (
    SELECT jsonb_build_object(
      'tipo', 'revisao_km',
      'key', 'revkm:' || v.id::text,
      'clientId', v.client_id,
      'nome', c.nome,
      'telefone', c.telefone,
      'veiculo', coalesce(nullif(trim(coalesce(v.marca, '') || ' ' || coalesce(v.modelo, '')), ''), 'veículo'),
      'placa', v.placa,
      'kmAtual', v.km,
      'kmProxima', v.km_proxima_revisao
    ) AS alert
    FROM public.vehicles v
    JOIN public.clients c ON c.id = v.client_id
    CROSS JOIN ws
    WHERE v.workshop_id = ws.id
      AND v.km_proxima_revisao IS NOT NULL
      AND v.km IS NOT NULL
      AND v.km >= v.km_proxima_revisao - 500
      AND NOT EXISTS (SELECT 1 FROM dismissed d WHERE d.client_id = v.client_id)
  ),
  revisao_tempo AS (
    SELECT jsonb_build_object(
      'tipo', 'revisao_tempo',
      'key', 'revtempo:' || v.id::text,
      'clientId', v.client_id,
      'nome', c.nome,
      'telefone', c.telefone,
      'veiculo', coalesce(nullif(trim(coalesce(v.marca, '') || ' ' || coalesce(v.modelo, '')), ''), 'veículo'),
      'placa', v.placa,
      'mesesDesde', ((current_date - v.data_ultima_revisao) / 30)
    ) AS alert
    FROM public.vehicles v
    JOIN public.clients c ON c.id = v.client_id
    CROSS JOIN ws
    WHERE v.workshop_id = ws.id
      AND v.data_ultima_revisao IS NOT NULL
      AND v.intervalo_revisao_meses IS NOT NULL
      AND (current_date - v.data_ultima_revisao) >= (v.intervalo_revisao_meses * 30)
      AND NOT EXISTS (SELECT 1 FROM dismissed d WHERE d.client_id = v.client_id)
  ),
  aniversario AS (
    SELECT jsonb_build_object(
      'tipo', 'aniversario',
      'key', 'aniv:' || c.id::text,
      'clientId', c.id,
      'nome', c.nome,
      'telefone', c.telefone,
      'diasParaAniversario', (
        CASE
          WHEN make_date(
            extract(year FROM current_date)::int,
            extract(month FROM c.data_aniversario)::int,
            extract(day FROM c.data_aniversario)::int
          ) < current_date
          THEN make_date(
            extract(year FROM current_date)::int + 1,
            extract(month FROM c.data_aniversario)::int,
            extract(day FROM c.data_aniversario)::int
          )
          ELSE make_date(
            extract(year FROM current_date)::int,
            extract(month FROM c.data_aniversario)::int,
            extract(day FROM c.data_aniversario)::int
          )
        END - current_date
      )
    ) AS alert
    FROM public.clients c
    CROSS JOIN ws
    WHERE c.workshop_id = ws.id
      AND c.data_aniversario IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM dismissed d WHERE d.client_id = c.id)
      AND (
        CASE
          WHEN make_date(
            extract(year FROM current_date)::int,
            extract(month FROM c.data_aniversario)::int,
            extract(day FROM c.data_aniversario)::int
          ) < current_date
          THEN make_date(
            extract(year FROM current_date)::int + 1,
            extract(month FROM c.data_aniversario)::int,
            extract(day FROM c.data_aniversario)::int
          )
          ELSE make_date(
            extract(year FROM current_date)::int,
            extract(month FROM c.data_aniversario)::int,
            extract(day FROM c.data_aniversario)::int
          )
        END - current_date
      ) <= 7
  ),
  satisfacao AS (
    SELECT jsonb_build_object(
      'tipo', 'satisfacao',
      'key', 'sat:' || so.id::text,
      'clientId', so.client_id,
      'nome', c.nome,
      'telefone', c.telefone,
      'osId', so.id,
      'osNumero', so.numero,
      'diasDesdeEntrega', (current_date - so.atualizada_em::date)
    ) AS alert
    FROM public.service_orders so
    JOIN public.clients c ON c.id = so.client_id
    CROSS JOIN ws
    WHERE so.workshop_id = ws.id
      AND so.status = 'entregue'
      AND so.nota_satisfacao IS NULL
      AND so.atualizada_em >= now() - interval '7 days'
      AND so.atualizada_em <= now() - interval '1 day'
      AND NOT EXISTS (SELECT 1 FROM dismissed d WHERE d.client_id = so.client_id)
  ),
  all_alerts AS (
    SELECT alert FROM retorno
    UNION ALL SELECT alert FROM revisao_km
    UNION ALL SELECT alert FROM revisao_tempo
    UNION ALL SELECT alert FROM aniversario
    UNION ALL SELECT alert FROM satisfacao
  )
  SELECT coalesce(jsonb_agg(alert), '[]'::jsonb)
  FROM all_alerts;
$$;

GRANT EXECUTE ON FUNCTION public.get_smart_alerts() TO authenticated;
