# BÁO CÁO CHI TIẾT DỰ ÁN TRADINGAGENTS

## Hệ thống Phân tích Giao dịch Tài chính Đa Tác tử AI

---

## I. TỔNG QUAN DỰ ÁN

### 1.1 Mục tiêu

TradingAgents là một hệ thống phân tích giao dịch tài chính sử dụng **12 tác tử AI chuyên biệt** phối hợp làm việc theo mô hình đa tác tử (multi-agent). Hệ thống mô phỏng quy trình ra quyết định đầu tư thực tế tại các công ty chứng khoán, với các đội phân tích, nghiên cứu, giao dịch, quản lý rủi ro và quản lý danh mục.

### 1.2 Công nghệ chính

| Thành phần | Công nghệ |
|-----------|-----------|
| Điều phối tác tử | LangGraph (đồ thị trạng thái) |
| Mô hình ngôn ngữ | OpenAI, Anthropic, Google, xAI, OpenRouter, Ollama |
| Dữ liệu tài chính | yfinance, Alpha Vantage |
| Backend web | FastAPI + WebSocket |
| Frontend web | React 19 + Tailwind CSS + Recharts |
| Giao diện CLI | Typer + Rich + Questionary |
| Bộ nhớ tác tử | BM25 (tìm kiếm tương tự) |

### 1.3 Cấu trúc thư mục

```
trading/
├── tradingagents/               # Framework lõi
│   ├── agents/                  # 12 tác tử AI
│   │   ├── analysts/            # Đội phân tích (4 tác tử)
│   │   ├── researchers/         # Đội nghiên cứu (2 tác tử)
│   │   ├── managers/            # Quản lý (2 tác tử)
│   │   ├── risk_mgmt/           # Quản lý rủi ro (3 tác tử)
│   │   ├── trader/              # Giao dịch viên (1 tác tử)
│   │   └── utils/               # Trạng thái, bộ nhớ, công cụ
│   ├── graph/                   # Đồ thị thực thi
│   │   ├── trading_graph.py     # Lớp chính điều phối
│   │   ├── setup.py             # Xây dựng đồ thị LangGraph
│   │   ├── conditional_logic.py # Logic điều hướng
│   │   ├── propagation.py       # Khởi tạo trạng thái
│   │   └── reflection.py        # Học từ kinh nghiệm
│   ├── dataflows/               # Lớp dữ liệu
│   │   ├── interface.py         # Định tuyến đến nhà cung cấp
│   │   ├── y_finance.py         # Triển khai yfinance
│   │   └── alpha_vantage.py     # Triển khai Alpha Vantage
│   ├── llm_clients/             # Kết nối LLM
│   └── default_config.py        # Cấu hình mặc định
├── cli/                         # Giao diện dòng lệnh
│   ├── main.py                  # Luồng chính CLI
│   ├── utils.py                 # Tiện ích nhập liệu
│   └── models.py                # Kiểu dữ liệu
├── web/                         # Ứng dụng web
│   ├── backend/main.py          # API FastAPI + WebSocket
│   └── frontend/src/            # Giao diện React
│       ├── App.jsx              # Điều phối trang
│       ├���─ components/          # Các thành phần UI
│       │   ├── ConfigPanel.jsx  # Trang cấu hình
│       │   ├── AnalysisView.jsx # Trang tiến trình
│       │   ├── ResultsView.jsx  # Trang kết quả
│       │   └── charts/          # Biểu đồ Recharts
│       └── utils/exportHtml.js  # Xuất báo cáo HTML
└── .env                         # API keys (không commit)
```

---

## II. KIẾN TRÚC HỆ THỐNG ĐA TÁC TỬ

### 2.1 Mô hình 5 đội — 12 tác tử

Hệ thống tổ chức thành **5 đội** thực thi tuần tự, mô phỏng quy trình ra quyết định đầu tư thực tế:

```
┌─────────────────────────────────────────────────────────────┐
│                    ĐỘI PHÂN TÍCH (Bước 1)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Thị      │ │ Báo cáo  │ │ Tin      │ │ Phân tích    │   │
│  │ trường   │→│ Tài chính│→│ tức      │→│ Cơ bản       ���   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  ĐỘI NGHIÊN CỨU (Bước 2)                   │
│       ┌──────────┐           ┌──────────┐                   │
│       │ Nhà NC   │◄────────►│ Nhà NC   │  ← Tranh luận    │
│       │ Tăng giá │  N vòng  │ Giảm giá │    Bull vs Bear   │
│       └────┬─────┘           └────┬─────┘                   │
│            └──────────┬───────────┘                          │
│                       ▼                                      │
│              ┌──────────────┐                                │
│              │ Quản lý      │ → Quyết định: MUA/GIỮ/BÁN    │
│              │ Nghiên cứu   │                                │
│              └──────────────┘                                │
└───��──────────────────────┬───────────────────────────────��──┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  GIAO DỊCH VIÊN (Bước 3)                    │
│              ┌──────────────┐                                │
│              │ Trader       │ → Kế hoạch giao dịch cụ thể  │
│              └──────────────┘                                │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                QUẢN LÝ RỦI RO (Bước 4)                     │
│  ┌───��──────┐ ┌──────────┐ ┌──────────┐                    │
│  │ Mạo      │◄──────────►│ Trung    │◄──────────►│ Thận  │ │
│  │ hiểm     │  N vòng    │ lập      │  tranh luận│ trọng │ │
│  └──────────┘             └──────────┘            └───────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              QUẢN LÝ DANH MỤC (Bước 5)                     │
│              ┌──────────────┐                                │
│              │ Portfolio    │ → QUYẾT ĐỊNH CUỐI CÙNG        │
│              │ Manager     │   (5 mức: Buy/Overweight/      │
│              └──────────────┘    Hold/Underweight/Sell)      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Chi tiết từng tác tử

#### Đội Phân tích (chạy song song về logic, tuần tự trong đồ thị)

| Tác tử | File | Vai trò | Công cụ sử dụng |
|--------|------|---------|-----------------|
| **Phân tích Thị trường** | `analysts/market_analyst.py` | Phân tích xu hướng giá, chỉ báo kỹ thuật | `get_stock_data`, `get_indicators` |
| **Phân tích Báo cáo Tài chính** | `analysts/financial_reports_analyst.py` | Phân tích BCTC 4 năm liên tiếp | `get_fundamentals`, `get_balance_sheet`, `get_cashflow`, `get_income_statement` |
| **Phân tích Tin tức** | `analysts/news_analyst.py` | Phân tích tin tức, sự kiện toàn cầu | `get_news`, `get_global_news`, `get_insider_transactions` |
| **Phân tích Cơ bản** | `analysts/fundamentals_analyst.py` | Phân tích chỉ số cơ bản công ty | `get_fundamentals`, `get_balance_sheet`, `get_cashflow`, `get_income_statement` |

Mỗi tác tử phân tích:
1. Nhận tên công ty và ngày phân tích
2. Gọi công cụ lấy dữ liệu (tool calls)
3. LLM xử lý dữ liệu và viết báo cáo chi tiết bằng tiếng Việt
4. Trả về báo cáo dạng Markdown

#### Đội Nghiên cứu (tranh luận Bull vs Bear)

| Tác tử | File | Vai trò |
|--------|------|---------|
| **Nhà NC Tăng giá** | `researchers/bull_researcher.py` | Lập luận ủng hộ đầu tư, nhấn mạnh tiềm năng tăng trưởng |
| **Nhà NC Giảm giá** | `researchers/bear_researcher.py` | Lập luận phản đối, nhấn mạnh rủi ro và thách thức |
| **Quản lý Nghiên cứu** | `managers/research_manager.py` | Trọng tài, tổng hợp và đưa ra quyết định |

Quy trình tranh luận:
- Bull trình bày → Bear phản biện → Bull phản bác → ... (lặp N vòng)
- Số vòng tranh luận = `max_debate_rounds` (cấu hình qua "Độ sâu nghiên cứu")
- Quản lý Nghiên cứu tổng hợp tất cả và đưa ra quyết định sơ bộ

#### Giao dịch viên

| Tác tử | File | Vai trò |
|--------|------|---------|
| **Trader** | `trader/trader.py` | Chuyển quyết định nghiên cứu thành kế hoạch giao dịch cụ thể |

Nhận: quyết định từ Quản lý NC + tất cả báo cáo phân tích
Trả về: kế hoạch giao dịch chi tiết (điểm vào/ra, stop-loss, target...)

#### Đội Quản lý Rủi ro (tranh luận 3 bên)

| Tác tử | File | Vai trò |
|--------|------|---------|
| **Phân tích Mạo hiểm** | `risk_mgmt/aggressive_debator.py` | Ủng hộ chiến lược cao rủi ro - cao lợi nhuận |
| **Phân tích Trung lập** | `risk_mgmt/neutral_debator.py` | Cân bằng giữa hai quan điểm |
| **Phân tích Thận trọng** | `risk_mgmt/conservative_debator.py` | Ưu tiên bảo toàn vốn, giảm rủi ro |

Quy trình: Aggressive → Conservative → Neutral → ... (lặp N vòng)

#### Quản lý Danh mục

| Tác tử | File | Vai trò |
|--------|------|---------|
| **Portfolio Manager** | `managers/portfolio_manager.py` | Ra quyết định cuối cùng theo thang 5 mức |

Thang đánh giá: **Buy → Overweight → Hold → Underweight → Sell**

---

## III. LUỒNG THỰC THI ĐỒ THỊ (LANGGRAPH)

### 3.1 Cách LangGraph hoạt động

LangGraph là framework xây dựng ứng dụng đa tác tử dựa trên **đồ thị trạng thái** (state graph). Mỗi node là một tác tử, mỗi cạnh là điều kiện chuyển tiếp.

**File:** `tradingagents/graph/setup.py`

```
START → Market Analyst ←→ tools_market → Msg Clear Market
                                              ↓
Financial Reports Analyst ←→ tools_financial_reports → Msg Clear Financial_reports
                                              ↓
News Analyst ←→ tools_news → Msg Clear News
                                              ↓
Fundamentals Analyst ←→ tools_fundamentals → Msg Clear Fundamentals
                                              ↓
Bull Researcher ←→ Bear Researcher (debate loop)
                                              ↓
Research Manager → Trader
                                              ↓
Aggressive Analyst ←→ Conservative Analyst ←→ Neutral Analyst (risk loop)
                                              ↓
Portfolio Manager → END
```

### 3.2 Trạng thái chia sẻ (AgentState)

**File:** `tradingagents/agents/utils/agent_states.py`

Tất cả tác tử chia sẻ một trạng thái chung:

```python
AgentState = {
    "messages": [],                    # Lịch sử tin nhắn
    "company_of_interest": "AAPL",     # Mã cổ phiếu
    "trade_date": "2026-04-01",        # Ngày phân tích

    # Báo cáo từ đội phân tích
    "market_report": "",               # Báo cáo thị trường
    "financial_reports_report": "",     # Báo cáo tài chính
    "news_report": "",                 # Báo cáo tin tức
    "fundamentals_report": "",         # Báo cáo cơ bản

    # Tranh luận nghiên cứu
    "investment_debate_state": {
        "bull_history": "",            # Lịch sử lập luận tăng giá
        "bear_history": "",            # Lịch sử lập luận giảm giá
        "judge_decision": "",          # Quyết định trọng tài
        "count": 0                     # Số vòng tranh luận
    },
    "investment_plan": "",             # Kế hoạch đầu tư

    # Tranh luận rủi ro
    "risk_debate_state": {
        "aggressive_history": "",
        "conservative_history": "",
        "neutral_history": "",
        "count": 0
    },
    "final_trade_decision": ""         # Quyết định cuối cùng
}
```

### 3.3 Logic điều hướng có điều kiện

**File:** `tradingagents/graph/conditional_logic.py`

Mỗi tác tử phân tích có vòng lặp tool:
- Nếu LLM gọi công cụ (tool_calls) → chuyển đến node công cụ → quay lại tác tử
- Nếu LLM hoàn thành → chuyển đến "Msg Clear" → sang tác tử tiếp theo

Tranh luận Bull/Bear:
- Nếu `count < 2 × max_debate_rounds` → tiếp tục tranh luận
- Nếu đủ vòng → chuyển đến Research Manager

---

## IV. LỚP DỮ LIỆU TÀI CHÍNH

### 4.1 Kiến trúc định tuyến nhà cung cấp

**File:** `tradingagents/dataflows/interface.py`

Hệ thống hỗ trợ nhiều nhà cung cấp dữ liệu với cơ chế fallback tự động:

```
Công cụ gọi dữ liệu
        ↓
route_to_vendor(method, *args)
        ↓
┌───────────────────────────────────┐
│ Tìm nhà cung cấp chính (config)  │
│ → yfinance hoặc alpha_vantage    │
└──────────┬────────────────────────┘
           ↓
┌──────────────────────────────────┐
│ Gọi nhà cung cấp chính          │
│ Nếu lỗi rate limit → fallback   │
│ sang nhà cung cấp phụ           │
└──────────────────────────────────┘
```

### 4.2 Các nguồn dữ liệu

| Danh mục | Công cụ | Dữ liệu trả về |
|----------|---------|-----------------|
| Giá cổ phiếu | `get_stock_data(symbol, start, end)` | OHLCV (Open, High, Low, Close, Volume) dạng CSV |
| Chỉ báo kỹ thuật | `get_indicators(symbol, indicator, date)` | RSI, MACD, SMA, EMA, Bollinger Bands, ATR, MFI... |
| Cơ bản | `get_fundamentals(ticker)` | PE, PEG, EPS, ROE, ROA, biên lợi nhuận... |
| Bảng cân đối | `get_balance_sheet(ticker, freq)` | Tài sản, nợ, vốn CSH theo năm/quý |
| Dòng tiền | `get_cashflow(ticker, freq)` | Dòng tiền hoạt động/đầu tư/tài chính |
| Báo cáo thu nhập | `get_income_statement(ticker, freq)` | Doanh thu, lợi nhuận, chi phí |
| Tin tức | `get_news(query, start, end)` | Tin tức công ty từ nhiều nguồn |
| Tin toàn cầu | `get_global_news()` | Tin tức thị trường thế giới |
| Giao dịch nội bộ | `get_insider_transactions(ticker)` | Giao dịch của ban lãnh đạo |

### 4.3 Cấu hình nhà cung cấp

**File:** `tradingagents/default_config.py`

```python
"data_vendors": {
    "core_stock_apis": "yfinance",       # Giá cổ phiếu
    "technical_indicators": "yfinance",   # Chỉ báo kỹ thuật
    "fundamental_data": "yfinance",       # Dữ liệu cơ bản
    "news_data": "yfinance",              # Tin tức
}
```

Có thể ghi đè theo từng công cụ cụ thể qua `tool_vendors`.

---

## V. HỆ THỐNG BỘ NHỚ TÁC TỬ

### 5.1 Ý tưởng

**File:** `tradingagents/agents/utils/memory.py`

Mỗi tác tử quan trọng có bộ nhớ riêng để **học từ kinh nghiệm**. Khi phân tích một cổ phiếu mới, tác tử sẽ tìm các tình huống tương tự trong quá khứ để tham khảo.

### 5.2 Cơ chế hoạt động

```
Tình huống hiện tại (báo cáo thị trường + tin tức + cơ bản)
                    ↓
         BM25 Similarity Search
                    ↓
    Top N tình huống tương tự nhất
         + bài học kinh nghiệm
                    ↓
      Tác tử sử dụng để ra quyết định tốt hơn
```

5 bộ nhớ độc lập:
- `bull_memory` — Nhà NC Tăng giá
- `bear_memory` — Nhà NC Giảm giá
- `trader_memory` — Giao dịch viên
- `invest_judge_memory` — Quản lý Nghiên cứu
- `portfolio_manager_memory` — Quản lý Danh mục

### 5.3 Cơ chế phản ánh (Reflection)

**File:** `tradingagents/graph/reflection.py`

Sau mỗi giao dịch, hệ thống đánh giá kết quả:
- Lời/lỗ thực tế so với quyết định
- Phân tích yếu tố nào đúng/sai
- Đề xuất cải thiện
- Lưu bài học vào bộ nhớ để dùng cho lần sau

---

## VI. GIAO DIỆN NGƯỜI DÙNG

### 6.1 Giao diện CLI

**File:** `cli/main.py` (1100+ dòng)

Luồng sử dụng:
```
Bước 1: Nhập mã cổ phiếu (VD: AAPL, VNM.VN, FPT.VN)
Bước 2: Nhập ngày phân tích (YYYY-MM-DD)
Bước 3: Chọn đội phân tích (checkbox đa chọn)
Bước 4: Chọn độ sâu nghiên cứu (Thấp / Cao / Chuyên sâu)
Bước 5: Chọn nhà cung cấp LLM
Bước 6: Chọn model tư duy nhanh + tư duy sâu
→ Hiển thị tiến trình real-time với bảng trạng thái
→ Xuất báo cáo hoàn chỉnh ra terminal + file Markdown
```

### 6.2 Giao diện Web

#### Backend (FastAPI)

**File:** `web/backend/main.py`

| Endpoint | Phương thức | Mô tả |
|----------|-------------|-------|
| `/api/config` | GET | Trả về cấu hình (providers, models, analysts, depth) |
| `/api/chart-data/{ticker}` | GET | Trả về dữ liệu biểu đồ có cấu trúc JSON |
| `/ws/analyze` | WebSocket | Phân tích real-time với streaming tiến trình |

Luồng WebSocket:
1. Client gửi cấu hình (ticker, date, analysts, provider, models, depth)
2. Server tạo `TradingAgentsGraph` và chạy phân tích
3. Stream từng chunk trạng thái qua WebSocket
4. Cập nhật trạng thái tác tử (pending → in_progress → completed)
5. Gửi kết quả hoàn chỉnh (báo cáo + quyết định + dữ liệu biểu đồ)

#### Frontend (React)

**3 trang chính:**

**Trang 1 — ConfigPanel** (`ConfigPanel.jsx`):
- Form nhập mã cổ phiếu, ngày phân tích
- Chọn đội phân tích (4 nút toggle)
- Chọn độ sâu nghiên cứu (Thấp / Cao / Chuyên sâu)
- Chọn nhà cung cấp LLM + model

**Trang 2 — AnalysisView** (`AnalysisView.jsx`):
- Thanh tiến trình tổng thể (%)
- 5 card đội, mỗi card hiển thị trạng thái từng tác tử
- Cập nhật real-time qua WebSocket

**Trang 3 — ResultsView** (`ResultsView.jsx`):
- Badge quyết định (MUA/GIỮ/BÁN) với màu sắc
- Các section báo cáo có thể mở/đóng (accordion)
- Biểu đồ Recharts tích hợp trong mỗi section
- Nút "Tải báo cáo" xuất file HTML

---

## VII. BIỂU ĐỒ PHÂN TÍCH

### 7.1 Nguồn dữ liệu biểu đồ

**Endpoint:** `GET /api/chart-data/{ticker}?date=YYYY-MM-DD`

Gọi yfinance trực tiếp, trả về JSON có cấu trúc:

```json
{
  "price": [{"date": "...", "open": 100, "high": 105, "low": 98, "close": 102, "volume": 50000}],
  "rsi": [{"date": "...", "value": 55.2}],
  "macd": [{"date": "...", "macd": 1.2, "signal": 0.8, "histogram": 0.4}],
  "income": [{"year": "2022", "revenue": 1e9, "net_income": 2e8, "gross_profit": 4e8}],
  "balance_sheet": [{"year": "2022", "total_assets": 5e9, "total_liabilities": 2e9, "equity": 3e9}],
  "cashflow": [{"year": "2022", "operating": 3e8, "investing": -1e8, "financing": -5e7}],
  "ratios": {"roe": 0.15, "roa": 0.08, "debt_to_equity": 0.6, "current_ratio": 1.5}
}
```

### 7.2 Biểu đồ theo section

| Section | Component | Biểu đồ |
|---------|-----------|----------|
| Phân tích Thị trường | `MarketCharts.jsx` | Giá đóng cửa + khối lượng (ComposedChart), RSI với ngưỡng 70/30 (LineChart), MACD + Signal + Histogram (ComposedChart) |
| Phân tích Báo cáo Tài chính | `FinancialReportsCharts.jsx` | Doanh thu/LN gộp/LN ròng 4 năm (BarChart), Dòng tiền HĐ/ĐT/TC 4 năm (BarChart) |
| Phân tích Cơ b���n | `FundamentalsCharts.jsx` | Tài sản/Nợ/Vốn CSH 4 năm (BarChart), Card chỉ số: ROE, ROA, Biên LN, P/E, Nợ/Vốn, Hệ số thanh toán |
| Phân tích Tin tức | Không có | Chỉ hiển thị nội dung text |

---

## VIII. XUẤT BÁO CÁO

### 8.1 Xuất HTML (Web)

**File:** `web/frontend/src/utils/exportHtml.js`

Khi người dùng bấm "Tải báo cáo":
1. Lấy dữ liệu từ tất cả section báo cáo
2. Chuyển Markdown → HTML (hỗ trợ bảng, heading, bold, list, code)
3. Thêm bảng dữ liệu số (giá, thu nhập, dòng tiền, bảng cân đối)
4. Thêm card chỉ số tài chính (ROE, ROA, P/E...)
5. Đóng gói thành file HTML với CSS inline
6. Download file: `{ticker}_{date}_report.html`

Đặc điểm:
- Giao diện sáng, chuyên nghiệp, dễ đọc
- Hỗ tr��� in ấn (Ctrl+P → PDF)
- Bao gồm header (tên CP, ngày), badge quyết định, footer disclaimer

### 8.2 Xuất Markdown (CLI)

**File:** `cli/main.py` — hàm `save_report_to_disk()`

Tạo cấu trúc thư mục:
```
results/{ticker}_{date}_{timestamp}/
├── 1_analysts/
│   ├── market.md
│   ├── financial_reports.md
│   ├── news.md
│   └── fundamentals.md
├── 2_research/
│   ├── bull.md
│   ├── bear.md
│   └── manager.md
├── 3_trading/trader.md
├── 4_risk/
│   ├── aggressive.md
│   ├── conservative.md
│   └── neutral.md
├── 5_portfolio/decision.md
└── complete_report.md          ← Báo cáo tổng hợp
```

---

## IX. CẤU HÌNH VÀ TÙY CHỈNH

### 9.1 Cấu hình mặc định

**File:** `tradingagents/default_config.py`

```python
DEFAULT_CONFIG = {
    # LLM
    "llm_provider": "openai",
    "deep_think_llm": "gpt-5.2",        # Model suy nghĩ sâu
    "quick_think_llm": "gpt-5-mini",     # Model suy nghĩ nhanh

    # Tranh luận
    "max_debate_rounds": 1,              # Vòng tranh luận Bull/Bear
    "max_risk_discuss_rounds": 1,        # Vòng tranh luận rủi ro

    # Dữ liệu
    "data_vendors": {
        "core_stock_apis": "yfinance",
        "technical_indicators": "yfinance",
        "fundamental_data": "yfinance",
        "news_data": "yfinance",
    }
}
```

### 9.2 Nhà cung cấp LLM hỗ trợ

| Provider | Model tư duy nhanh | Model tư duy sâu |
|----------|--------------------|--------------------|
| OpenAI | GPT-5 Mini, GPT-5 Nano, GPT-4.1 | GPT-5.4, GPT-5.2, GPT-5.4 Pro |
| Anthropic | Claude Sonnet 4.6, Claude Haiku 4.5 | Claude Opus 4.6, Claude Sonnet 4.6 |
| Google | Gemini 3 Flash, Gemini 2.5 Flash | Gemini 3.1 Pro, Gemini 2.5 Pro |
| xAI | Grok 4.1 Fast | Grok 4, Grok 4.1 Fast (Reasoning) |
| OpenRouter | Nemotron 3 Nano (free) | GLM 4.5 Air (free) |
| Ollama | Qwen3 (8B, local) | GLM-4.7-Flash (30B, local) |

### 9.3 Độ sâu nghiên cứu

| Mức | Giá trị | Ý nghĩa |
|-----|---------|---------|
| Thấp | 1 | 1 vòng tranh luận, phân tích nhanh |
| Cao | 3 | 3 vòng tranh luận, nghiên cứu kỹ lưỡng |
| Chuyên sâu | 5 | 5 vòng tranh luận, phân tích toàn diện |

---

## X. Ý TƯỞNG TRIỂN KHAI TỪNG PHẦN

### 10.1 Lớp tác tử (Agents)

**Ý tưởng:** Mỗi tác tử là một hàm Python nhận trạng thái và trả về cập nhật trạng thái. Tác tử sử dụng prompt engineering để chuyên môn hóa vai trò:

```python
def create_market_analyst(llm):
    def market_analyst_node(state):
        # 1. Xây dựng prompt với vai trò chuyên biệt
        system_message = "You are a market analyst..."
        # 2. Bind tools (get_stock_data, get_indicators)
        chain = prompt | llm.bind_tools(tools)
        # 3. Gọi LLM
        result = chain.invoke(state["messages"])
        # 4. Trả về cập nhật trạng thái
        return {"messages": [result], "market_report": report}
    return market_analyst_node
```

**Lý do thiết kế:**
- Mỗi tác tử độc lập, dễ thêm/bớt/sửa đổi
- Tool binding cho phép LLM tự quyết định khi nào cần gọi dữ liệu
- Prompt bằng tiếng Anh (LLM hiểu tốt hơn) nhưng yêu cầu output tiếng Việt

### 10.2 Lớp đồ thị (Graph)

**Ý tưởng:** Sử dụng LangGraph StateGraph để định nghĩa luồng thực thi như một đồ thị có hướng:

- **Node** = tác tử hoặc node công cụ
- **Edge** = luồng chuyển tiếp (tĩnh hoặc có điều kiện)
- **State** = trạng thái chia sẻ, cập nhật sau mỗi node

**Lý do thiết kế:**
- LangGraph xử lý tự động việc lưu trạng thái giữa các bước
- Conditional edges cho phép vòng lặp tranh luận linh hoạt
- Stream mode "values" cho phép theo dõi tiến trình real-time

### 10.3 Lớp dữ liệu (Dataflows)

**Ý tưởng:** Abstraction layer với vendor routing:

```
Tool (abstract) → Interface (router) → Vendor (implementation)
```

**Lý do thiết kế:**
- Dễ dàng thêm nhà cung cấp dữ liệu mới
- Fallback tự động khi nhà cung cấp chính gặp lỗi
- Cấu hình linh hoạt theo category hoặc từng tool cụ thể

### 10.4 Lớp giao diện web (Web)

**Ý tưởng:** Kiến trúc WebSocket real-time:

```
React Frontend ←WebSocket→ FastAPI Backend ←→ LangGraph Engine
```

**Lý do thiết kế:**
- WebSocket cho streaming real-time (không phải polling)
- Backend chạy LangGraph trong thread riêng, poll kết quả qua queue
- Frontend cập nhật UI ngay khi nhận chunk mới
- Chart data tách riêng endpoint REST (có thể cache)

### 10.5 Biểu đồ và Xuất báo cáo

**Ý tưởng biểu đồ:** Dữ liệu biểu đồ được fetch riêng (không qua LLM agent) vì:
- Dữ liệu số có cấu trúc, không cần LLM xử lý
- Nhanh hơn và đáng tin cậy hơn
- Có thể cache riêng

**Ý tưởng xuất HTML:** Chọn HTML thay vì PDF vì:
- Không phụ thuộc vào thư viện render phức tạp (html2canvas có nhiều lỗi)
- Người dùng có thể in ra PDF từ trình duyệt (Ctrl+P)
- Dễ tùy chỉnh, đọc được trên mọi thiết bị

---

## XI. SƠ ĐỒ TỔNG THỂ

```
                    ┌─────────────────┐
                    │   NGƯỜI DÙNG    │
                    └────────┬────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
          ┌──────▼──────┐       ┌────────▼────────┐
          │   CLI App   │       │    Web App       │
          │  (Typer +   │       │  (React +        │
          │   Rich)     │       │   FastAPI)       │
          └──────┬──────┘       └────────┬────────┘
                 │                       │
                 └───────────┬───────────┘
                             │
                   ┌─────────▼─────────┐
                   │ TradingAgentsGraph │
                   │   (LangGraph)     │
                   └─────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
    ┌───────▼───────┐ ┌─────▼─────┐ ┌────────▼────────┐
    │  12 AI Agents │ │  Memory   │ │   Data Layer    │
    │  (LangChain)  │ │  (BM25)   │ │  (yfinance/AV)  │
    └───────┬───────┘ └───────────┘ └────────┬────────┘
            │                                │
    ┌───────▼───────┐               ┌────────▼────────┐
    │  LLM Clients  │               │  Financial APIs │
    │  (OpenAI,     │               │  (Yahoo Finance,│
    │   Anthropic,  │               │   Alpha Vantage)│
    │   Google...)  │               └─────────────────┘
    └───────────────┘
```

---

*Tài liệu này mô tả phiên bản hiện tại của dự án TradingAgents tại ngày 06/04/2026.*
