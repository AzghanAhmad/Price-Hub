/*
# Seed e-commerce catalog (categories, brands, products, discounts)

1. Inserts demo data
   - 8 categories: Smartphones, Laptops, Audio, Tablets, Accessories, Wearables, TVs, Gaming
   - 10 brands: Apple, Samsung, Xiaomi, OnePlus, Sony, JBL, Dell, HP, Lenovo, Boat
   - ~28 products across categories with prices in PKR, specs (jsonb), images (Pexels URLs),
     compare_at_price for discount display, stock, featured flags.
   - 3 discount codes: WELCOME10 (10%), MONSOON15 (15%), FLAT500 (Rs.500 off).

2. Notes
   - Uses ON CONFLICT DO NOTHING so re-running is safe.
   - Prices are in Pakistani Rupees to match PriceOye.pk style.
   - Product slugs are unique; specs stored as jsonb key/value.
*/

-- categories
insert into public.categories (name, slug, icon) values
  ('Smartphones','smartphones','Smartphone'),
  ('Laptops','laptops','Laptop'),
  ('Audio','audio','Headphones'),
  ('Tablets','tablets','Tablet'),
  ('Accessories','accessories','Cable'),
  ('Wearables','wearables','Watch'),
  ('TVs','tvs','Tv'),
  ('Gaming','gaming','Gamepad2')
on conflict (slug) do nothing;

-- brands
insert into public.brands (name, slug) values
  ('Apple','apple'),('Samsung','samsung'),('Xiaomi','xiaomi'),('OnePlus','oneplus'),
  ('Sony','sony'),('JBL','jbl'),('Dell','dell'),('HP','hp'),('Lenovo','lenovo'),('Boat','boat')
on conflict (slug) do nothing;

-- helper to fetch ids by slug
do $$
declare
  c_phone uuid; c_laptop uuid; c_audio uuid; c_tablet uuid; c_acc uuid; c_wear uuid; c_tv uuid; c_game uuid;
  b_apple uuid; b_samsung uuid; b_xiaomi uuid; b_oneplus uuid; b_sony uuid; b_jbl uuid; b_dell uuid; b_hp uuid; b_lenovo uuid; b_boat uuid;
begin
  select id into c_phone from public.categories where slug='smartphones';
  select id into c_laptop from public.categories where slug='laptops';
  select id into c_audio from public.categories where slug='audio';
  select id into c_tablet from public.categories where slug='tablets';
  select id into c_acc from public.categories where slug='accessories';
  select id into c_wear from public.categories where slug='wearables';
  select id into c_tv from public.categories where slug='tvs';
  select id into c_game from public.categories where slug='gaming';

  select id into b_apple from public.brands where slug='apple';
  select id into b_samsung from public.brands where slug='samsung';
  select id into b_xiaomi from public.brands where slug='xiaomi';
  select id into b_oneplus from public.brands where slug='oneplus';
  select id into b_sony from public.brands where slug='sony';
  select id into b_jbl from public.brands where slug='jbl';
  select id into b_dell from public.brands where slug='dell';
  select id into b_hp from public.brands where slug='hp';
  select id into b_lenovo from public.brands where slug='lenovo';
  select id into b_boat from public.brands where slug='boat';

  -- smartphones
  insert into public.products (name, slug, description, category_id, brand_id, price, compare_at_price, stock, images, specs, featured, active)
  values
  ('iPhone 15 Pro Max 256GB','iphone-15-pro-max-256gb','Titanium design, A17 Pro chip, 48MP main camera, USB-C. The ultimate iPhone.', c_phone, b_apple, 459999, 499999, 15,
    array['https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Display":"6.7-inch Super Retina XDR","Chip":"A17 Pro","RAM":"8GB","Storage":"256GB","Camera":"48MP+12MP+12MP","Battery":"4422mAh","OS":"iOS 17"}'::jsonb, true, true),

  ('Samsung Galaxy S24 Ultra 512GB','samsung-galaxy-s24-ultra-512gb','Galaxy AI, S Pen built-in, 200MP camera, titanium frame.', c_phone, b_samsung, 429999, 469999, 12,
    array['https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Display":"6.8-inch QHD+ AMOLED","Chip":"Snapdragon 8 Gen 3","RAM":"12GB","Storage":"512GB","Camera":"200MP+50MP+12MP+10MP","Battery":"5000mAh","OS":"Android 14"}'::jsonb, true, true),

  ('Xiaomi 14 Pro 256GB','xiaomi-14-pro-256gb','Leica optics, Snapdragon 8 Gen 3, 120W hypercharge.', c_phone, b_xiaomi, 179999, 199999, 20,
    array['https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Display":"6.73-inch AMOLED","Chip":"Snapdragon 8 Gen 3","RAM":"12GB","Storage":"256GB","Camera":"50MP+50MP+50MP","Battery":"4880mAh","OS":"HyperOS"}'::jsonb, true, true),

  ('OnePlus 12 256GB','oneplus-12-256gb','Hasselblad camera, 100W fast charging, Snapdragon 8 Gen 3.', c_phone, b_oneplus, 159999, 179999, 18,
    array['https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Display":"6.82-inch ProXDR AMOLED","Chip":"Snapdragon 8 Gen 3","RAM":"12GB","Storage":"256GB","Camera":"50MP+48MP+64MP","Battery":"5400mAh","OS":"OxygenOS 14"}'::jsonb, false, true),

  ('iPhone 15 128GB','iphone-15-128gb','Dynamic Island, 48MP camera, USB-C, A16 Bionic.', c_phone, b_apple, 329999, 359999, 25,
    array['https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Display":"6.1-inch Super Retina XDR","Chip":"A16 Bionic","RAM":"6GB","Storage":"128GB","Camera":"48MP+12MP","Battery":"3349mAh","OS":"iOS 17"}'::jsonb, false, true),

  ('Samsung Galaxy A55 5G 256GB','samsung-galaxy-a55-5g-256gb','Premium glass design, 50MP OIS camera, 5G.', c_phone, b_samsung, 99999, 109999, 30,
    array['https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Display":"6.6-inch FHD+ Super AMOLED","Chip":"Exynos 1480","RAM":"8GB","Storage":"256GB","Camera":"50MP+12MP+5MP","Battery":"5000mAh","OS":"Android 14"}'::jsonb, false, true),

  -- laptops
  ('MacBook Air M3 13-inch 256GB','macbook-air-m3-13-256gb','M3 chip, 18-hour battery, Liquid Retina, ultra-thin.', c_laptop, b_apple, 369999, 399999, 10,
    array['https://images.pexels.com/photos/812264/pexels-photo-812264.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Display":"13.6-inch Liquid Retina","Chip":"Apple M3","RAM":"8GB","Storage":"256GB","Battery":"18 hours","OS":"macOS"}'::jsonb, true, true),

  ('Dell XPS 13 Plus i7 16GB','dell-xps-13-plus-i7-16gb','13th Gen Intel Core i7, OLED touch, premium build.', c_laptop, b_dell, 289999, 319999, 8,
    array['https://images.pexels.com/photos/18105/pexels-photo-18105.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Display":"13.4-inch OLED","Chip":"Intel Core i7-1360P","RAM":"16GB","Storage":"512GB SSD","Battery":"12 hours","OS":"Windows 11"}'::jsonb, false, true),

  ('HP Pavilion 14 Ryzen 5 16GB','hp-pavilion-14-ryzen5-16gb','AMD Ryzen 5, 14-inch FHD, backlit keyboard.', c_laptop, b_hp, 149999, 169999, 14,
    array['https://images.pexels.com/photos/18105/pexels-photo-18105.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Display":"14-inch FHD IPS","Chip":"AMD Ryzen 5 7530U","RAM":"16GB","Storage":"512GB SSD","Battery":"10 hours","OS":"Windows 11"}'::jsonb, false, true),

  ('Lenovo ThinkPad X1 Carbon i5','lenovo-thinkpad-x1-carbon-i5','Ultralight business laptop, MIL-SPEC durability.', c_laptop, b_lenovo, 249999, 279999, 6,
    array['https://images.pexels.com/photos/812264/pexels-photo-812264.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Display":"14-inch WUXGA","Chip":"Intel Core i5-1335U","RAM":"16GB","Storage":"512GB SSD","Battery":"15 hours","OS":"Windows 11 Pro"}'::jsonb, false, true),

  -- audio
  ('Sony WH-1000XM5 Headphones','sony-wh-1000xm5-headphones','Industry-leading noise cancellation, 30-hour battery.', c_audio, b_sony, 59999, 69999, 20,
    array['https://images.pexels.com/photos/3394651/pexels-photo-3394651.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Type":"Over-ear","Noise Cancelling":"Yes","Battery":"30 hours","Connectivity":"Bluetooth 5.2","Weight":"250g"}'::jsonb, true, true),

  ('JBL Tune 760NC Headphones','jbl-tune-760nc-headphones','Active noise cancelling, 50-hour battery, JBL Pure Bass.', c_audio, b_jbl, 18999, 22999, 35,
    array['https://images.pexels.com/photos/3394651/pexels-photo-3394651.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Type":"Over-ear","Noise Cancelling":"Yes","Battery":"50 hours","Connectivity":"Bluetooth 5.0","Weight":"220g"}'::jsonb, false, true),

  ('Apple AirPods Pro 2nd Gen','apple-airpods-pro-2nd-gen','Adaptive Audio, USB-C, improved ANC.', c_audio, b_apple, 54999, 59999, 22,
    array['https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Type":"In-ear","Noise Cancelling":"Yes","Battery":"6 hours (30 with case)","Connectivity":"Bluetooth 5.3","Chip":"H2"}'::jsonb, true, true),

  ('Boat Airdopes 141 TWS','boat-airdopes-141-tws','42-hour playback, ENx technology, low latency.', c_audio, b_boat, 2999, 4499, 100,
    array['https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Type":"True Wireless","Battery":"42 hours total","Connectivity":"Bluetooth 5.1","Waterproof":"IPX4"}'::jsonb, false, true),

  -- tablets
  ('iPad Pro 12.9-inch M2 256GB','ipad-pro-12-9-m2-256gb','M2 chip, Liquid Retina XDR, ProMotion.', c_tablet, b_apple, 259999, 289999, 12,
    array['https://images.pexels.com/photos/1337576/pexels-photo-1337576.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Display":"12.9-inch Liquid Retina XDR","Chip":"Apple M2","RAM":"8GB","Storage":"256GB","Battery":"10 hours","OS":"iPadOS 17"}'::jsonb, false, true),

  ('Samsung Galaxy Tab S9 11-inch','samsung-galaxy-tab-s9-11','Snapdragon 8 Gen 2, S Pen included, AMOLED.', c_tablet, b_samsung, 159999, 179999, 9,
    array['https://images.pexels.com/photos/1337576/pexels-photo-1337576.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Display":"11-inch Dynamic AMOLED 2X","Chip":"Snapdragon 8 Gen 2","RAM":"8GB","Storage":"128GB","Battery":"8000mAh","OS":"Android 13"}'::jsonb, false, true),

  -- accessories
  ('Apple 20W USB-C Power Adapter','apple-20w-usb-c-adapter','Fast charging for iPhone and iPad.', c_acc, b_apple, 4999, 5999, 50,
    array['https://images.pexels.com/photos/4526473/pexels-photo-4526473.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Power":"20W","Connector":"USB-C","Compatibility":"iPhone, iPad"}'::jsonb, false, true),

  ('Samsung 25W Super Fast Charger','samsung-25w-fast-charger','Super Fast Charging 2.0 for Galaxy devices.', c_acc, b_samsung, 3499, 4499, 60,
    array['https://images.pexels.com/photos/4526473/pexels-photo-4526473.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Power":"25W","Connector":"USB-C","Compatibility":"Galaxy series"}'::jsonb, false, true),

  ('Anker PowerCore 10000mAh Power Bank','anker-powercore-10000','Slim 10000mAh, PowerIQ, USB-C input.', c_acc, b_samsung, 6999, 8999, 40,
    array['https://images.pexels.com/photos/4526473/pexels-photo-4526473.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Capacity":"10000mAh","Output":"18W","Ports":"1x USB-A, 1x USB-C","Weight":"180g"}'::jsonb, false, true),

  -- wearables
  ('Apple Watch Series 9 45mm','apple-watch-series-9-45mm','S9 chip, Double Tap gesture, always-on Retina.', c_wear, b_apple, 89999, 99999, 15,
    array['https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Display":"45mm Always-On Retina","Chip":"S9 SiP","Battery":"18 hours","Water Resistance":"50m","OS":"watchOS 10"}'::jsonb, true, true),

  ('Samsung Galaxy Watch 6 44mm','samsung-galaxy-watch-6-44mm','Sleep coaching, body composition, AMOLED.', c_wear, b_samsung, 64999, 72999, 18,
    array['https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Display":"44mm Super AMOLED","Chip":"Exynos W930","Battery":"40 hours","Water Resistance":"5ATM","OS":"Wear OS 4"}'::jsonb, false, true),

  ('Xiaomi Smart Band 8','xiaomi-smart-band-8','1.62-inch AMOLED, 16-day battery, 150+ modes.', c_wear, b_xiaomi, 8999, 10999, 50,
    array['https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Display":"1.62-inch AMOLED","Battery":"16 days","Water Resistance":"5ATM","Sensors":"Heart rate, SpO2"}'::jsonb, false, true),

  -- TVs
  ('Samsung 55-inch QLED 4K Smart TV','samsung-55-qled-4k','Quantum Dot, 120Hz, Tizen OS, Quantum HDR.', c_tv, b_samsung, 159999, 189999, 7,
    array['https://images.pexels.com/photos/333984/pexels-photo-333984.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Display":"55-inch QLED 4K","Refresh Rate":"120Hz","HDR":"Quantum HDR","OS":"Tizen","Ports":"3x HDMI, 2x USB"}'::jsonb, false, true),

  ('Sony 65-inch Bravia 4K Google TV','sony-65-bravia-4k-google-tv','XR Processor, Google TV, Dolby Vision.', c_tv, b_sony, 229999, 259999, 5,
    array['https://images.pexels.com/photos/333984/pexels-photo-333984.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Display":"65-inch LED 4K","Refresh Rate":"60Hz","HDR":"Dolby Vision","OS":"Google TV","Ports":"4x HDMI, 2x USB"}'::jsonb, false, true),

  -- gaming
  ('Sony PlayStation 5 Slim','sony-ps5-slim','Ultra-high speed SSD, 4K gaming, DualSense controller.', c_game, b_sony, 139999, 159999, 10,
    array['https://images.pexels.com/photos/19012051/pexels-photo-19012051.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Storage":"1TB SSD","Resolution":"4K","GPU":"AMD RDNA 2","CPU":"AMD Zen 2","Controller":"DualSense"}'::jsonb, true, true),

  ('Sony DualSense Controller','sony-dualsense-controller','Haptic feedback, adaptive triggers, USB-C.', c_game, b_sony, 16999, 19999, 30,
    array['https://images.pexels.com/photos/19012051/pexels-photo-19012051.jpeg?auto=compress&cs=tinysrgb&w=800'],
    '{"Features":"Haptic feedback, Adaptive triggers","Connectivity":"USB-C, Bluetooth","Battery":"8 hours","Compatibility":"PS5"}'::jsonb, false, true)
  on conflict (slug) do nothing;
end $$;

-- discounts
insert into public.discounts (code, description, type, value, cap, min_order, active, valid_until) values
  ('WELCOME10','10% off for new customers','percent',10,5000,0,true,now() + interval '365 days'),
  ('MONSOON15','15% off monsoon sale','percent',15,10000,10000,true,now() + interval '90 days'),
  ('FLAT500','Rs. 500 off on orders above Rs. 10,000','amount',500,null,10000,true,now() + interval '180 days')
on conflict (code) do nothing;
