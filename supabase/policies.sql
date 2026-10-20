DROP POLICY IF EXISTS productos_public_select ON public.productos;
DROP POLICY IF EXISTS productos_public_insert ON public.productos;
DROP POLICY IF EXISTS productos_public_update ON public.productos;
DROP POLICY IF EXISTS productos_public_delete ON public.productos;

CREATE POLICY productos_public_select
ON public.productos
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY productos_public_insert
ON public.productos
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY productos_public_update
ON public.productos
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY productos_public_delete
ON public.productos
FOR DELETE
TO anon, authenticated
USING (true);
