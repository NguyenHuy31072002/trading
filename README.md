# TradingAgents — Hệ thống Phân tích Giao dịch Đa Tác tử AI

Hệ thống sử dụng **12 tác tử AI chuyên biệt** phối hợp phân tích thị trường, tranh luận chiến lược và đưa ra quyết định giao dịch. Hỗ trợ cả **giao diện web** và **CLI**.

---

## Yêu cầu hệ thống

- Python 3.11+
- Node.js 18+ (cho web app)
- API key từ ít nhất 1 nhà cung cấp LLM (OpenAI, Anthropic, Google, xAI, OpenRouter, hoặc Ollama local)

---

## Cài đặt

### 1. Clone repo

```bash
git clone https://github.com/NguyenHuy31072002/trading.git
cd trading
```

### 2. Tạo môi trường ảo

```bash
python -m venv .venv
source .venv/bin/activate        # Linux/Mac
# .venv\Scripts\activate         # Windows
```

Hoặc dùng conda:
```bash
conda create -n tradingagents python=3.13
conda activate tradingagents
```

### 3. Cài đặt dependencies Python

```bash
pip install .
```

### 4. Cấu hình API key

Tạo file `.env` từ template:
```bash
cp .env.example .env
```

Mở `.env` và điền API key của nhà cung cấp LLM bạn muốn dùng:
```env
# Điền ít nhất 1 key
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=
ANTHROPIC_API_KEY=
XAI_API_KEY=
OPENROUTER_API_KEY=
```

> Nếu dùng **Ollama** (chạy local, miễn phí), không cần API key — chỉ cần cài Ollama và pull model.

---

## Chạy Web App (khuyến nghị)

### 1. Cài dependencies frontend

```bash
cd web/frontend
npm install
```

### 2. Build frontend

```bash
npm run build
```

### 3. Chạy server

```bash
cd ../backend
python -m uvicorn main:app --host 0.0.0.0 --port 8889
```

### 4. Mở trình duyệt

Truy cập: **http://localhost:8889**

### Sử dụng:
1. Nhập **mã cổ phiếu** (VD: `AAPL`, `VNM.VN`, `FPT.VN`)
2. Chọn **ngày phân tích**
3. Chọn **đội phân tích** (Thị trường, Báo cáo Tài chính, Tin tức, Cơ bản)
4. Chọn **độ sâu nghiên cứu** (Thấp / Cao / Chuyên sâu)
5. Chọn **nhà cung cấp LLM** và model
6. Bấm **Bắt đầu Phân tích**
7. Theo dõi tiến trình real-time → xem kết quả với biểu đồ
8. Bấm **Tải báo cáo** để xuất file HTML

---

## Chạy CLI

```bash
# Cách 1: dùng lệnh đã cài
tradingagents

# Cách 2: chạy trực tiếp
python -m cli.main
```

CLI sẽ hướng dẫn bạn qua từng bước: nhập mã CP, chọn ngày, chọn đội phân tích, chọn LLM...

Kết quả được lưu tại thư mục `results/` với cấu trúc:
```
results/{ticker}_{date}/
├── 1_analysts/          # Báo cáo từng nhà phân tích
├── 2_research/          # Tranh luận Bull vs Bear
├── 3_trading/           # Kế hoạch giao dịch
├── 4_risk/              # Phân tích rủi ro
├── 5_portfolio/         # Quyết định cuối cùng
└── complete_report.md   # Báo cáo tổng hợp
```

---

## Sử dụng trong code Python

```python
from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG

config = DEFAULT_CONFIG.copy()
config["llm_provider"] = "openai"
config["deep_think_llm"] = "gpt-5.2"
config["quick_think_llm"] = "gpt-5-mini"
config["max_debate_rounds"] = 2          # Số vòng tranh luận

ta = TradingAgentsGraph(debug=True, config=config)
_, decision = ta.propagate("AAPL", "2026-04-01")
print(decision)  # Buy / Overweight / Hold / Underweight / Sell
```

---

## Nhà cung cấp LLM hỗ trợ

| Provider | Model nhanh | Model sâu | API Key |
|----------|------------|-----------|---------|
| **OpenAI** | GPT-5 Mini, GPT-4.1 | GPT-5.4, GPT-5.2 | `OPENAI_API_KEY` |
| **Anthropic** | Claude Sonnet 4.6, Haiku 4.5 | Claude Opus 4.6 | `ANTHROPIC_API_KEY` |
| **Google** | Gemini 3 Flash, 2.5 Flash | Gemini 3.1 Pro, 2.5 Pro | `GOOGLE_API_KEY` |
| **xAI** | Grok 4.1 Fast | Grok 4 | `XAI_API_KEY` |
| **OpenRouter** | Nemotron 3 Nano (free) | GLM 4.5 Air (free) | `OPENROUTER_API_KEY` |
| **Ollama** | Qwen3 (8B) | GLM-4.7-Flash (30B) | Không cần (local) |

---

## Kiến trúc hệ thống

```
Đội Phân tích (4 tác tử)
  → Thị trường | Báo cáo Tài chính | Tin tức | Cơ bản
        ↓
Đội Nghiên cứu (tranh luận Bull vs Bear → Quản lý tổng hợp)
        ↓
Giao dịch viên (kế hoạch giao dịch cụ thể)
        ↓
Quản lý Rủi ro (tranh luận Mạo hiểm vs Thận trọng vs Trung lập)
        ↓
Quản lý Danh mục → QUYẾT ĐỊNH: Buy/Overweight/Hold/Underweight/Sell
```

> Xem chi tiết kiến trúc tại [`docs/BAO-CAO-DU-AN.md`](docs/BAO-CAO-DU-AN.md)

---

## Cấu trúc thư mục

```
trading/
├── tradingagents/          # Framework lõi (agents, graph, dataflows)
├── cli/                    # Giao diện dòng lệnh
├── web/
│   ├��─ backend/            # FastAPI + WebSocket
│   └── frontend/           # React + Recharts
├── docs/                   # Tài liệu
├── .env.example            # Template API keys
└── pyproject.toml          # Python package config
```

---

## Lưu ý

- Hệ thống chỉ mang tính chất **tham khảo**, không phải lời khuyên đầu tư.
- Kết quả phân tích phụ thuộc vào model LLM, chất lượng dữ liệu, và nhiều yếu tố khác.
- Hậu tố mã cổ phiếu: `.VN` (Việt Nam), `.HK` (Hong Kong), `.T` (Tokyo), không có hậu tố = US.
