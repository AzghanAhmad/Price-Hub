/*
# Product campaigns + promo codes

1. Adds `campaign` text column on products (e.g. "Valentine Sale", "Eid Mega Deal")
2. Tags selected products with campaign labels
3. Seeds campaign promo codes: VALENTINE20, EIDMEGA, FLASH50
*/

alter table public.products
  add column if not exists campaign text default null;

create index if not exists products_campaign_idx on public.products(campaign)
  where campaign is not null;

-- Valentine Sale — gift-friendly gadgets
update public.products set campaign = 'Valentine Sale'
where slug in (
  'iphone-15-128gb',
  'sony-wh-1000xm5-headphones',
  'apple-airpods-pro-2nd-gen',
  'xiaomi-smart-band-8',
  'jbl-tune-760nc-headphones',
  'apple-watch-series-9-45mm'
) and campaign is null;

-- Eid Mega Deal — big-ticket electronics
update public.products set campaign = 'Eid Mega Deal'
where slug in (
  'iphone-15-pro-max-256gb',
  'samsung-galaxy-s24-ultra-512gb',
  'macbook-air-m3-13-256gb',
  'samsung-55-qled-4k',
  'sony-ps5-slim',
  'ipad-pro-12-9-m2-256gb'
) and campaign is null;

-- Flash Friday — mid-range & accessories
update public.products set campaign = 'Flash Friday'
where slug in (
  'samsung-galaxy-a55-5g-256gb',
  'oneplus-12-256gb',
  'boat-airdopes-141-tws',
  'sony-dualsense-controller',
  'hp-pavilion-14-ryzen5-16gb',
  'anker-powercore-10000'
) and campaign is null;

-- Campaign promo codes
insert into public.discounts (code, description, type, value, cap, min_order, active, valid_until) values
  ('VALENTINE20', 'Valentine Sale — 20% off gifts', 'percent', 20, 15000, 5000, true, now() + interval '60 days'),
  ('EIDMEGA', 'Eid Mega Deal — 12% off big tickets', 'percent', 12, 25000, 20000, true, now() + interval '90 days'),
  ('FLASH50', 'Flash Friday — Rs. 2,000 off', 'amount', 2000, null, 15000, true, now() + interval '30 days')
on conflict (code) do nothing;
