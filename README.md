# Sift

**Sift** is a full-stack, AI-powered data extraction and analysis platform. It scrapes structured data (tables, articles, etc.) from arbitrary web pages, lets users visualize and compare the data, and leverages LLMs for advanced insights—all with a modern, customizable UI.

---

## Features

- **Web Scraping**: Extracts tables and main content from any URL.
- **AI Analysis**: Optionally uses LLMs (via Groq API) for natural language Q&A and data insights.
- **Data Visualization**: Interactive charts, tables, and comparison tools.
- **Customizable**: Users can filter, sort, and select data points for analysis.
- **Modular Pipeline**: Easily extend or swap out pipeline stages (classification, matching, prompt building, etc.).
- **Modern UI**: Material design and React + NextJS components for a clean look.

---

## Use Cases

Sift is designed to handle a wide variety of structured web data and provide intelligent analysis. Here are some typical user scenarios:

- 🔍 **Scrape IMDb's top movies** and ask:  
  _“Which movies have ratings over 8.5 and released after 2015?”_

- 💼 **Scrape a job board** and ask:  
  _“Which remote Python jobs pay over $120k?”_

- 🛒 **Scrape product listings** and ask:  
  _“What are the most expensive laptops over 16GB RAM?”_

- 🏠 **Scrape real estate listings** and ask:  
  _“Which apartments under $2000 have more than 2 bedrooms?”_

- 📊 **Scrape academic datasets** and ask:  
  _“Which countries have the highest life expectancy over time?”_

---

## What It Can Extract

Sift can intelligently identify and extract multiple types of structured content, including:

- 📋 **Tables** – Statistics, pricing, listings, and more
- 📰 **Blog or News Articles** – Title, author, date, and content
- 🏷️ **Product Listings** – Names, prices, descriptions
- ⭐ **Reviews and Ratings** – Aggregated or individual opinions
- 🏡 **Real Estate/Classifieds** – Listings with attributes like price, location, size
- 📚 **Academic or Government Data** – Structured reports and datasets
- 💬 **Forums & Discussions** – Thread summaries, replies, and activity metadata

Sift falls back to raw content extraction for pages that don’t clearly match known types, ensuring broad adaptability.

---

## Architecture Overview

```
User
  │
  ▼
Frontend (Next.js + MUI)
  │
  ▼
Backend (FastAPI)
  │
  ├─> Scraping (BeautifulSoup, Pandas, Trafilatura)
  ├─> Table Profiling & Indexing
  ├─> Modular AI Pipeline (Intent → Match → Filter → Prompt)
  └─> LLM (Groq API)
```

- **Frontend**: User submits a URL and (optionally) a question. Data is visualized and compared interactively.
- **Backend**: Scrapes, profiles, and indexes tables. Runs a modular pipeline to answer user questions using LLMs.

---

## Backend (FastAPI)

### Endpoints

#### `POST /api/v1/scrape`

**Request:**
```json
{
  "url": "https://example.com",
  "question": "Which products have prices over 100?"
}
```

**Response:**
```json
{
  "tables": [ ... ],         // List of tables (as arrays of row objects)
  "main_content": "...",     // Main article/content (if any)
  "ai_response": "..."       // LLM answer (if question provided)
}
```

### AI Pipeline

**Pipeline Steps:**
1. **Classify Intent**: Detects if the query is a comparison, filter, summary, etc.
2. **Index Content**: Extracts and profiles all tables (columns, types, preview).
3. **Match Table/Columns**: Fuzzy-matches query keywords to table columns.
4. **Filter/Sort Table**: Applies threshold filters, sorts, and selects relevant rows/columns.
5. **Build Prompt**: Assembles a concise prompt for the LLM.
6. **LLM Call**: Sends prompt to Groq API and returns the answer.

**Key Files:**
- `api/v1/endpoints/scrape.py` — Main endpoint and pipeline orchestrator
- `core/query_classifier.py` — Intent and keyword extraction
- `core/content_indexer.py` — Table extraction and profiling
- `core/content_matcher.py` — Table/column matching
- `core/table_narrower.py` — Filtering and sorting
- `core/prompt_builder.py` — Prompt assembly
- `core/ai_client.py` — LLM API client

---

## Frontend (Next.js + MUI)

### Main Components

- **`ScrapeForm`**: User input for URL and question
- **`Dashboard`**: Main view, tabs for tables, charts, comparison, raw data
- **`EnhancedTableView`**: Interactive table with sorting, filtering, pagination
- **`EnhancedChartView`**: Customizable charts (bar, line, area, pie, scatter) with advanced data selection/filtering
- **`DataComparison`**: Compare columns (price, rating, etc.) with stats and trends
- **`AIInsights`**: Shows LLM-generated answers
- **`FeedbackModal`, `Footer`, `Header`**: UI/UX components

### Customization & Extensibility

- **Data Selection**: Users can filter, sort, and select which data points to visualize (no hardcoded limits)
- **Comparison Analysis**: Customizable comparison type, thresholds, and sorting
- **Easy to Add New Views**: Just add a new component and a tab in `Dashboard.tsx`

---

## Environment Variables

**Backend (`.env`):**
```
GROQ_API_KEY=your_groq_api_key_here
```

**Frontend (`.env.local`):**
```
NEXT_PUBLIC_API_URL=your_public_API_url_here
```

---

## Setup & Running

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python run.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔮 Future Implementations

- [✅] Export scraped data to CSV/Excel
- [ ] Image scraping support
- [ ] Multi-table joining & relational queries
- [ ] Custom prompt templates per domain (e.g. job boards vs product pages)
- [✅] Playwright-based scraping for JS-heavy websites
- [✅] Rate limiting and retry strategies to prevent bans
- [ ] Dataset versioning or history tracking 
- [ ] Support for periodical repeating jobs

---