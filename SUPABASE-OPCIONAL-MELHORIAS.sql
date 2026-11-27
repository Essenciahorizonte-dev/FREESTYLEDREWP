-- FREESTYLE DREWP — melhorias OPCIONAIS (não destrutivas, podem ser executadas várias vezes).
-- NÃO é necessário executar nada se o SUPABASE-INSTALACAO-FINAL.sql já foi executado.
-- Não apaga tabelas, dados, imagens nem utilizadores.

-- 1) Índice para acelerar a consulta pública de imagens activas (inofensivo; só acelera leituras).
create index if not exists freestyle_images_active_lookup
  on public.freestyle_images (image_type, target_key, color_key)
  where is_active = true;

-- 2) (OPCIONAL, desligado) Esconder produtos inactivos da API pública.
-- Só tem efeito de segurança/privacidade: hoje a API pública consegue LER produtos ocultos
-- (nome, preço) por causa da política freestyle_products_public_status_read.
-- Com a versão optimizada do site (CONFIG.requireProductRow = true) essa política deixou de
-- ser necessária. Para a remover, retire os "--" das 2 linhas abaixo e execute:
--
-- drop policy if exists freestyle_products_public_status_read on public.freestyle_products;
--
-- (A política freestyle_products_public_read, que só mostra produtos activos, mantém-se.)
