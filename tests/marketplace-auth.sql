\set ON_ERROR_STOP on
begin;
insert into auth.users(id) values ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002'), ('00000000-0000-0000-0000-000000000003');
insert into public.market_lots(id,seller_id,variety,quantity_kg,district,ready_date,published) values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Potato',100,'Rangpur',current_date,true);
do $$ begin
  if has_function_privilege('anon','public.market_respond_offer(uuid,text,integer,jsonb)','execute') then raise exception 'anonymous execute allowed'; end if;
  if has_column_privilege('authenticated','public.market_lots','reserved_kg','update') or has_column_privilege('authenticated','public.market_lots','version','update') then raise exception 'restricted columns writable'; end if;
end $$;
set local role anon;
do $$ begin
  begin perform public.market_respond_offer('00000000-0000-0000-0000-000000000001','accept',1,'{}'); raise exception 'anonymous execute succeeded'; exception when insufficient_privilege then null; end;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
do $$ begin
  begin perform public.market_send_offer('10000000-0000-0000-0000-000000000001',null,10,10,current_date,'buyer','pickup','cash',now()+interval '1 day','{}','{}','anon'); raise exception 'null auth allowed'; exception when raise_exception then if sqlerrm <> 'not allowed' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
select (public.market_send_offer('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002',50,20,current_date,'buyer','pickup','cash',now()+interval '1 day','{}','{}','test')).id as offer_id \gset
select set_config('test.offer_id', :'offer_id', true);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
do $$ declare target uuid := current_setting('test.offer_id')::uuid; begin
  begin perform public.market_respond_offer(target,'accept',1,'{}'); raise exception 'third party accepted'; exception when raise_exception then if sqlerrm <> 'not allowed' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select (public.market_respond_offer(:'offer_id','counter',1,'{"quantity_kg":40,"price_kg":25}')).id;
do $$ declare o public.market_offers; begin
  select * into o from public.market_offers limit 1;
  if o.quantity_kg<>40 or o.price_kg<>25 then raise exception 'counter terms not updated'; end if;
  begin perform public.market_respond_offer(o.id,'accept',2,'{}'); raise exception 'self-accept succeeded'; exception when raise_exception then if sqlerrm <> 'not allowed' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
select (public.market_respond_offer(:'offer_id','accept',2,'{}')).status;
do $$ declare o public.market_offers; l public.market_lots; begin
  select * into o from public.market_offers limit 1;
  select * into l from public.market_lots limit 1;
  if o.status<>'agreed' or l.reserved_kg<>40 then raise exception 'agreement or reservation failed'; end if;
  begin perform public.market_respond_offer(o.id,'reject',3,'{}'); raise exception 'rejected after agreement'; exception when raise_exception then if sqlerrm <> 'not allowed' then raise; end if; end;
end $$;
do $$ begin
  begin perform public.market_send_offer('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002',80,20,current_date,'buyer','pickup','cash',now()+interval '1 day','{}','{}','excess'); raise exception 'over-reservation allowed'; exception when raise_exception then if sqlerrm <> 'lot unavailable' then raise; end if; end;
end $$;
rollback;
