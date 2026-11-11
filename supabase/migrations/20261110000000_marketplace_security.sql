-- This migration must be tested on an isolated Supabase instance before deployment.
alter table public.market_offers add column if not exists countered_by uuid references auth.users(id);

create or replace function public.market_send_offer(lot_id uuid, buyer_id uuid, quantity_kg numeric, price_kg numeric, pickup_date date, pickup_responsibility text, payment_timing text, payment_method text, expires_at timestamptz, terms jsonb, buyer_costs jsonb, idempotency_key text)
returns public.market_offers language plpgsql security definer set search_path = public as $$
declare lot public.market_lots; result public.market_offers;
begin
  if auth.uid() is null or buyer_id is distinct from auth.uid() then raise exception 'not allowed'; end if;
  if quantity_kg is null or quantity_kg <= 0 or quantity_kg > 1000000 or price_kg is null or price_kg < 0 or price_kg > 100000 or idempotency_key is null or length(idempotency_key) not between 1 and 64 then raise exception 'invalid offer'; end if;
  select * into lot from public.market_lots l where l.id=market_send_offer.lot_id and l.published for share;
  if not found or lot.seller_id=auth.uid() or lot.quantity_kg-lot.reserved_kg < quantity_kg then raise exception 'lot unavailable'; end if;
  insert into public.market_offers(lot_id,buyer_id,seller_id,quantity_kg,price_kg,pickup_date,pickup_responsibility,payment_timing,payment_method,expires_at,terms,buyer_costs,idempotency_key)
  values(lot.id,auth.uid(),lot.seller_id,quantity_kg,price_kg,pickup_date,pickup_responsibility,payment_timing,payment_method,expires_at,coalesce(terms,'{}'),coalesce(buyer_costs,'{}'),idempotency_key)
  on conflict on constraint market_offers_buyer_id_idempotency_key_key do update set updated_at=public.market_offers.updated_at returning * into result;
  return result;
end $$;

create or replace function public.market_respond_offer(p_offer_id uuid, p_action text, p_version integer, p_terms jsonb default '{}'::jsonb)
returns public.market_offers language plpgsql security definer set search_path = public as $$
declare offer public.market_offers; lot public.market_lots; proposed_quantity numeric; proposed_price numeric;
begin
  if auth.uid() is null then raise exception 'not allowed'; end if;
  select * into offer from public.market_offers where id=p_offer_id for update;
  if not found or auth.uid() not in (offer.buyer_id,offer.seller_id) then raise exception 'not allowed'; end if;
  if offer.version is distinct from p_version then raise exception 'stale offer'; end if;
  if offer.status not in ('pending','counter') or (offer.expires_at is not null and offer.expires_at <= now()) then raise exception 'not allowed'; end if;
  if p_action='accept' then
    if not ((offer.status='pending' and auth.uid()=offer.seller_id) or (offer.status='counter' and offer.countered_by is not null and auth.uid()<>offer.countered_by)) then raise exception 'not allowed'; end if;
    select * into lot from public.market_lots where id=offer.lot_id for update;
    if not found or not lot.published or lot.quantity_kg-lot.reserved_kg < offer.quantity_kg then raise exception 'lot unavailable'; end if;
    update public.market_lots set reserved_kg=reserved_kg+offer.quantity_kg, version=version+1, updated_at=now() where id=lot.id;
    update public.market_offers set status='agreed',version=version+1,updated_at=now() where id=offer.id returning * into offer;
    insert into public.market_purchases(offer_id,lot_id,buyer_id,seller_id,agreed_quantity_kg,price_kg,terms) values(offer.id,offer.lot_id,offer.buyer_id,offer.seller_id,offer.quantity_kg,offer.price_kg,jsonb_build_object('offer',to_jsonb(offer)));
  elsif p_action='reject' then
    if (offer.status='pending' and auth.uid()<>offer.seller_id) or (offer.status='counter' and (offer.countered_by is null or auth.uid()=offer.countered_by)) then raise exception 'not allowed'; end if;
    update public.market_offers set status='rejected',version=version+1,updated_at=now() where id=offer.id returning * into offer;
  elsif p_action='withdraw' then
    if auth.uid()<>offer.buyer_id then raise exception 'not allowed'; end if;
    update public.market_offers set status='withdrawn',version=version+1,updated_at=now() where id=offer.id returning * into offer;
  elsif p_action='counter' then
    if (offer.status='pending' and auth.uid()<>offer.seller_id) or (offer.status='counter' and (offer.countered_by is null or auth.uid()=offer.countered_by)) or jsonb_typeof(p_terms)<>'object' then raise exception 'not allowed'; end if;
    begin proposed_quantity=(p_terms->>'quantity_kg')::numeric; proposed_price=(p_terms->>'price_kg')::numeric; exception when others then raise exception 'invalid offer'; end;
    if proposed_quantity is null or proposed_quantity <= 0 or proposed_quantity > 1000000 or proposed_price is null or proposed_price < 0 or proposed_price > 100000 then raise exception 'invalid offer'; end if;
    update public.market_offers set status='counter',quantity_kg=proposed_quantity,price_kg=proposed_price,terms=p_terms,countered_by=auth.uid(),version=version+1,updated_at=now() where id=offer.id returning * into offer;
  else raise exception 'invalid action'; end if;
  return offer;
end $$;

-- Other historical RPCs remain unavailable until their own authorization tests pass.
revoke execute on function public.market_send_offer(uuid,uuid,numeric,numeric,date,text,text,text,timestamptz,jsonb,jsonb,text), public.market_respond_offer(uuid,text,integer,jsonb), public.market_report_collection(uuid,numeric,numeric,text,integer), public.market_confirm_collection(uuid), public.market_report_payment(uuid,numeric,text,text), public.market_confirm_payment(uuid), public.market_record_disagreement(uuid,text,numeric,numeric) from public, anon, authenticated;
grant execute on function public.market_send_offer(uuid,uuid,numeric,numeric,date,text,text,text,timestamptz,jsonb,jsonb,text), public.market_respond_offer(uuid,text,integer,jsonb) to authenticated;
revoke insert, update, delete on public.market_offers, public.market_purchases, public.market_collection_reports, public.market_payment_reports, public.market_history, public.market_disagreements from public, anon, authenticated;
revoke insert, update, delete on public.market_lots from public, anon, authenticated;
grant insert (seller_id,variety,quantity_kg,district,upazila,ready_date,purpose,notes,photos,asking_price,published) on public.market_lots to authenticated;
grant update (variety,quantity_kg,district,upazila,ready_date,purpose,notes,photos,asking_price,published) on public.market_lots to authenticated;
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='public.market_lots'::regclass and conname='market_lots_reserved_within_quantity') then
    alter table public.market_lots add constraint market_lots_reserved_within_quantity check (reserved_kg <= quantity_kg);
  end if;
end $$;
