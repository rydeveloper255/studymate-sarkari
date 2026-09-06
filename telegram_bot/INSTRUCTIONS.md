# 🚀 StudyMate Sarkari - Telegram Bot & Auto-Scraper Setup Guide (हिंदी + English)

Yeh guide aapko step-by-step sikhata hai ki kaise **Telegram Bot** ko set up karein, **Government Websites** se automatically har 1 ghante data scrape karein, **Supabase** me save karein, aur website par live display karein.

---

## 📋 Table of Contents
1. **Telegram Bot Token Kaise Banayein (BotFather)**
2. **Telegram Channel / Group me Bot Add Karein**
3. **Supabase Database Setup (Free)**
4. **Python Bot Run Karne Ka Tareeka (Local / Cloud)**
5. **Naye Government Website Links Kaise Add Karein**
6. **24/7 Free Hosting (Render / Railway / Replit / VPS)**

---

## 1️⃣ Step 1: Telegram Bot Token Banayein

1. Telegram app open karein aur search karein: **`@BotFather`** (Blue verified badge wala).
2. Bot ko `/start` bhejein, fir type karein:
   ```text
   /newbot
   ```
3. BotFather aapse **Bot ka Name** puchega (jaise: `StudyMate Sarkari Alert`).
4. Fir **Username** puchega jo `bot` se end hona chahiye (jaise: `studymate_sarkari_alert_bot`).
5. BotFather aapko ek **API Token** dega, jaise:
   `7382910482:AAH9f7s_dK91k2sL4j_example`
   *(Isko copy karke save kar lein).*

---

## 2️⃣ Step 2: Channel me Bot Add Karein

1. Apna Telegram Channel ya Group banayein (ya existing channel open karein).
2. Channel **Settings -> Administrators -> Add Administrator** me jayein.
3. Apne banaye bot ka username search karke **Admin** bana dein (aur *Post Messages* permission ON rakhein).
4. Aapka Channel ID ya Username note karein (jaise: `@StudyMateSarkariLive`).

---

## 3️⃣ Step 3: Supabase Database Setup

1. **[https://supabase.com](https://supabase.com)** par free account banayein aur **New Project** create karein.
2. Project banne ke baad left sidebar se **SQL Editor** me jayein.
3. Hamari file `supabase_schema.sql` ka poora code copy karke paste karein aur **Run** dabayein.
4. **Project Settings -> API** me jayein aur yeh dono cheezein copy karein:
   - **Project URL** (jaise: `https://xyzabcdef.supabase.co`)
   - **Project API Key** (`anon` `public` key ya `service_role` key)

---

## 4️⃣ Step 4: Python Bot Run Karein

Apne computer ya terminal me `telegram_bot` folder me jayein:

```bash
# 1. Folder me jayein
cd telegram_bot

# 2. Dependencies install karein
pip install -r requirements.txt

# 3. Environment Variables set karein (.env file banayein)
```

Apni `.env` file banayein:
```env
TELEGRAM_BOT_TOKEN="7382910482:AAH9f7s_dK91k2sL4j_example"
TELEGRAM_CHANNEL_ID="@StudyMateSarkariLive"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-supabase-key"
SCRAPING_INTERVAL_HOURS=1
```

Bot start karein:
```bash
python bot.py
```

🎉 **Aapka Bot start ho chuka hai!**
- Yeh har 1 ghante sabhi Central & State Government portals check karega.
- Naya notification aate hi Supabase database me store karega.
- Telegram Channel par instant direct link ke sath sundar Markdown post karega!

---

## 5️⃣ Step 5: Naye Government Website Links Kaise Add Karein?

Aapko website links add karne ke 2 aasan tareeqe milte hain:

### Tareeqa A: Website Portal Se (Live UI)
Aap is website ke **"Telegram Bot & Scraper"** tab me ja kar directly form fill karke naye Central ya State portal ka URL add kar sakte hain.

### Tareeqa B: `config.py` File Me:
`telegram_bot/config.py` file open karein aur `CENTRAL_GOVT_LINKS` ya `STATE_WISE_GOVT_LINKS` me link add kar dein:

```python
{
    "name": "Bihar Police CSBC",
    "url": "https://csbc.bih.nic.in",
    "notices_url": "https://csbc.bih.nic.in",
    "department": "CSBC Bihar",
    "state": "Bihar",
}
```

---

## 6️⃣ Step 6: 24/7 Free Cloud Hosting (Bot ko hamesha ON rakhne ke liye)

Aap bot ko Render.com ya Railway.app par Free me 24/7 chala sakte hain:

1. Apne code ko GitHub repository me push karein.
2. **[Render.com](https://render.com)** -> **New Background Worker** select karein.
3. Build Command: `pip install -r telegram_bot/requirements.txt`
4. Start Command: `python telegram_bot/bot.py`
5. Environment Variables me apna `TELEGRAM_BOT_TOKEN`, `SUPABASE_URL`, etc. daal dein.
6. **Deploy** par click karein. Bot 24 ghante nonstop chalega!

---
*Developed for StudyMate Sarkari - India's 100% Verified Govt Career Gateway.*
