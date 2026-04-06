"""TradingAgents Web API — FastAPI + WebSocket streaming."""

import sys
import os
import json
import asyncio
import datetime
import traceback
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

load_dotenv(PROJECT_ROOT / ".env")

from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG


# ---------------------------------------------------------------------------
# LLM provider metadata (mirrors cli/utils.py)
# ---------------------------------------------------------------------------

LLM_PROVIDERS = [
    {"id": "openai", "name": "OpenAI", "url": "https://api.openai.com/v1"},
    {"id": "google", "name": "Google", "url": "https://generativelanguage.googleapis.com/v1"},
    {"id": "anthropic", "name": "Anthropic", "url": "https://api.anthropic.com/"},
    {"id": "xai", "name": "xAI", "url": "https://api.x.ai/v1"},
    {"id": "openrouter", "name": "OpenRouter", "url": "https://openrouter.ai/api/v1"},
    {"id": "ollama", "name": "Ollama (Local)", "url": "http://localhost:11434/v1"},
]

QUICK_MODELS = {
    "openai": [
        {"id": "gpt-5-mini", "name": "GPT-5 Mini"},
        {"id": "gpt-5-nano", "name": "GPT-5 Nano"},
        {"id": "gpt-5.4", "name": "GPT-5.4"},
        {"id": "gpt-4.1", "name": "GPT-4.1"},
    ],
    "anthropic": [
        {"id": "claude-sonnet-4-6", "name": "Claude Sonnet 4.6"},
        {"id": "claude-haiku-4-5", "name": "Claude Haiku 4.5"},
        {"id": "claude-sonnet-4-5", "name": "Claude Sonnet 4.5"},
    ],
    "google": [
        {"id": "gemini-3-flash-preview", "name": "Gemini 3 Flash"},
        {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash"},
    ],
    "xai": [
        {"id": "grok-4-1-fast-non-reasoning", "name": "Grok 4.1 Fast"},
        {"id": "grok-4-fast-non-reasoning", "name": "Grok 4 Fast"},
    ],
    "openrouter": [
        {"id": "nvidia/nemotron-3-nano-30b-a3b:free", "name": "Nemotron 3 Nano (free)"},
    ],
    "ollama": [
        {"id": "qwen3:latest", "name": "Qwen3 (8B)"},
    ],
}

DEEP_MODELS = {
    "openai": [
        {"id": "gpt-5.4", "name": "GPT-5.4"},
        {"id": "gpt-5.2", "name": "GPT-5.2"},
        {"id": "gpt-5-mini", "name": "GPT-5 Mini"},
    ],
    "anthropic": [
        {"id": "claude-opus-4-6", "name": "Claude Opus 4.6"},
        {"id": "claude-sonnet-4-6", "name": "Claude Sonnet 4.6"},
        {"id": "claude-sonnet-4-5", "name": "Claude Sonnet 4.5"},
    ],
    "google": [
        {"id": "gemini-3.1-pro-preview", "name": "Gemini 3.1 Pro"},
        {"id": "gemini-2.5-pro", "name": "Gemini 2.5 Pro"},
    ],
    "xai": [
        {"id": "grok-4-0709", "name": "Grok 4"},
        {"id": "grok-4-1-fast-reasoning", "name": "Grok 4.1 Fast (Reasoning)"},
    ],
    "openrouter": [
        {"id": "z-ai/glm-4.5-air:free", "name": "GLM 4.5 Air (free)"},
    ],
    "ollama": [
        {"id": "glm-4.7-flash:latest", "name": "GLM-4.7-Flash (30B)"},
    ],
}

ANALYSTS = [
    {"id": "market", "name": "Phân tích Thị trường", "icon": "📈"},
    {"id": "financial_reports", "name": "Phân tích Báo cáo Tài chính", "icon": "📑"},
    {"id": "news", "name": "Phân tích Tin tức", "icon": "📰"},
    {"id": "fundamentals", "name": "Phân tích Cơ bản", "icon": "📊"},
]

DEPTH_OPTIONS = [
    {"id": 1, "name": "Thấp", "desc": "Nghiên cứu nhanh, ít vòng tranh luận"},
    {"id": 3, "name": "Cao", "desc": "Nghiên cứu kỹ lưỡng, nhiều vòng tranh luận"},
    {"id": 5, "name": "Chuyên sâu", "desc": "Nghiên cứu toàn diện, tranh luận chuyên sâu"},
]


# ---------------------------------------------------------------------------
# Agent status constants
# ---------------------------------------------------------------------------

ANALYST_ORDER = ["market", "financial_reports", "news", "fundamentals"]
ANALYST_AGENT_NAMES = {
    "market": "Market Analyst",
    "financial_reports": "Financial_reports Analyst",
    "news": "News Analyst",
    "fundamentals": "Fundamentals Analyst",
}
ANALYST_REPORT_MAP = {
    "market": "market_report",
    "financial_reports": "financial_reports_report",
    "news": "news_report",
    "fundamentals": "fundamentals_report",
}

AGENT_DISPLAY_NAMES = {
    "Market Analyst": "Phân tích Thị trường",
    "Financial_reports Analyst": "Phân tích Báo cáo Tài chính",
    "News Analyst": "Phân tích Tin tức",
    "Fundamentals Analyst": "Phân tích Cơ bản",
    "Bull Researcher": "Nhà nghiên cứu Tăng giá",
    "Bear Researcher": "Nhà nghiên cứu Giảm giá",
    "Research Manager": "Quản lý Nghiên cứu",
    "Trader": "Giao dịch viên",
    "Aggressive Analyst": "Phân tích Mạo hiểm",
    "Neutral Analyst": "Phân tích Trung lập",
    "Conservative Analyst": "Phân tích Thận trọng",
    "Portfolio Manager": "Quản lý Danh mục",
}

def _safe_num(val) -> float:
    """Convert a value to float safely, returning 0 for None/NaN."""
    import math
    if val is None:
        return 0
    try:
        f = float(val)
        return 0 if math.isnan(f) else round(f, 2)
    except (ValueError, TypeError):
        return 0


TEAM_NAMES = {
    "analyst": "Đội Phân tích",
    "research": "Đội Nghiên cứu",
    "trading": "Đội Giao dịch",
    "risk": "Quản lý Rủi ro",
    "portfolio": "Quản lý Danh mục",
}


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="TradingAgents API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# REST endpoints — configuration metadata
# ---------------------------------------------------------------------------

@app.get("/api/config")
async def get_config():
    """Return all configuration options for the frontend."""
    return {
        "providers": LLM_PROVIDERS,
        "quick_models": QUICK_MODELS,
        "deep_models": DEEP_MODELS,
        "analysts": ANALYSTS,
        "depth_options": DEPTH_OPTIONS,
    }


@app.get("/api/chart-data/{ticker}")
async def get_chart_data(ticker: str, date: str = None):
    """Fetch structured chart data for a ticker from yfinance."""
    import yfinance as yf
    import pandas as pd
    from datetime import datetime, timedelta

    ticker = ticker.strip().upper()
    analysis_date = date or datetime.now().strftime("%Y-%m-%d")
    analysis_dt = datetime.strptime(analysis_date, "%Y-%m-%d")

    result = {}

    try:
        yf_ticker = yf.Ticker(ticker)

        # --- Price data (last 6 months) ---
        price_start = (analysis_dt - timedelta(days=180)).strftime("%Y-%m-%d")
        hist = yf_ticker.history(start=price_start, end=analysis_date)
        if not hist.empty:
            if hist.index.tz is not None:
                hist.index = hist.index.tz_localize(None)
            price_records = []
            for idx, row in hist.iterrows():
                price_records.append({
                    "date": idx.strftime("%Y-%m-%d"),
                    "open": round(float(row.get("Open", 0)), 2),
                    "high": round(float(row.get("High", 0)), 2),
                    "low": round(float(row.get("Low", 0)), 2),
                    "close": round(float(row.get("Close", 0)), 2),
                    "volume": int(row.get("Volume", 0)),
                })
            result["price"] = price_records

            # --- Technical indicators from stockstats ---
            from stockstats import wrap as stockstats_wrap
            df = hist.reset_index().copy()
            df.columns = [c.lower() for c in df.columns]
            if "date" not in df.columns and df.index.name == "date":
                df = df.reset_index()
            ss = stockstats_wrap(df)

            # RSI
            try:
                ss["rsi"]
                rsi_data = []
                for _, row in ss.iterrows():
                    d = row.get("date", row.name)
                    if hasattr(d, "strftime"):
                        d = d.strftime("%Y-%m-%d")
                    val = row.get("rsi")
                    if pd.notna(val):
                        rsi_data.append({"date": str(d), "value": round(float(val), 2)})
                result["rsi"] = rsi_data
            except Exception:
                pass

            # MACD
            try:
                ss["macd"]
                ss["macds"]
                ss["macdh"]
                macd_data = []
                for _, row in ss.iterrows():
                    d = row.get("date", row.name)
                    if hasattr(d, "strftime"):
                        d = d.strftime("%Y-%m-%d")
                    m, s, h = row.get("macd"), row.get("macds"), row.get("macdh")
                    if pd.notna(m):
                        macd_data.append({
                            "date": str(d),
                            "macd": round(float(m), 4),
                            "signal": round(float(s), 4) if pd.notna(s) else 0,
                            "histogram": round(float(h), 4) if pd.notna(h) else 0,
                        })
                result["macd"] = macd_data
            except Exception:
                pass

        # --- Income statement (annual, last 4 years) ---
        try:
            inc = yf_ticker.income_stmt
            if inc is not None and not inc.empty:
                income_records = []
                for col in sorted(inc.columns):
                    year = col.strftime("%Y") if hasattr(col, "strftime") else str(col)[:4]
                    income_records.append({
                        "year": year,
                        "revenue": _safe_num(inc.at["Total Revenue", col]) if "Total Revenue" in inc.index else 0,
                        "net_income": _safe_num(inc.at["Net Income", col]) if "Net Income" in inc.index else 0,
                        "gross_profit": _safe_num(inc.at["Gross Profit", col]) if "Gross Profit" in inc.index else 0,
                    })
                result["income"] = income_records
        except Exception:
            pass

        # --- Balance sheet (annual, last 4 years) ---
        try:
            bs = yf_ticker.balance_sheet
            if bs is not None and not bs.empty:
                bs_records = []
                for col in sorted(bs.columns):
                    year = col.strftime("%Y") if hasattr(col, "strftime") else str(col)[:4]
                    bs_records.append({
                        "year": year,
                        "total_assets": _safe_num(bs.at["Total Assets", col]) if "Total Assets" in bs.index else 0,
                        "total_liabilities": _safe_num(bs.at["Total Liabilities Net Minority Interest", col]) if "Total Liabilities Net Minority Interest" in bs.index else 0,
                        "equity": _safe_num(bs.at["Stockholders Equity", col]) if "Stockholders Equity" in bs.index else 0,
                    })
                result["balance_sheet"] = bs_records
        except Exception:
            pass

        # --- Cash flow (annual, last 4 years) ---
        try:
            cf = yf_ticker.cashflow
            if cf is not None and not cf.empty:
                cf_records = []
                for col in sorted(cf.columns):
                    year = col.strftime("%Y") if hasattr(col, "strftime") else str(col)[:4]
                    cf_records.append({
                        "year": year,
                        "operating": _safe_num(cf.at["Operating Cash Flow", col]) if "Operating Cash Flow" in cf.index else 0,
                        "investing": _safe_num(cf.at["Investing Cash Flow", col]) if "Investing Cash Flow" in cf.index else 0,
                        "financing": _safe_num(cf.at["Financing Cash Flow", col]) if "Financing Cash Flow" in cf.index else 0,
                    })
                result["cashflow"] = cf_records
        except Exception:
            pass

        # --- Key ratios from info ---
        try:
            info = yf_ticker.info or {}
            result["ratios"] = {
                "roe": info.get("returnOnEquity"),
                "roa": info.get("returnOnAssets"),
                "debt_to_equity": info.get("debtToEquity"),
                "current_ratio": info.get("currentRatio"),
                "profit_margin": info.get("profitMargins"),
                "pe_ratio": info.get("trailingPE"),
            }
        except Exception:
            pass

    except Exception as e:
        return {"error": str(e)}

    return result


# ---------------------------------------------------------------------------
# WebSocket — run analysis with real-time streaming
# ---------------------------------------------------------------------------

@app.websocket("/ws/analyze")
async def websocket_analyze(ws: WebSocket):
    await ws.accept()

    try:
        # Receive configuration from client
        raw = await ws.receive_text()
        params = json.loads(raw)

        ticker = params["ticker"].strip().upper()
        analysis_date = params["date"]
        selected_analysts = params.get("analysts", ["market", "financial_reports", "news", "fundamentals"])
        provider = params.get("provider", "openai")
        quick_model = params.get("quick_model", "gpt-5-mini")
        deep_model = params.get("deep_model", "gpt-5.4")
        depth = params.get("depth", 1)

        # Build agent status list
        agent_status = {}
        for key in selected_analysts:
            if key in ANALYST_AGENT_NAMES:
                agent_status[ANALYST_AGENT_NAMES[key]] = "pending"
        for agent in ["Bull Researcher", "Bear Researcher", "Research Manager",
                       "Trader", "Aggressive Analyst", "Neutral Analyst",
                       "Conservative Analyst", "Portfolio Manager"]:
            agent_status[agent] = "pending"

        # Send initial status
        await _send(ws, "status", {
            "agents": {k: {"status": v, "name": AGENT_DISPLAY_NAMES.get(k, k)} for k, v in agent_status.items()},
            "message": f"Đang khởi tạo phân tích {ticker}...",
        })

        # Build config
        config = DEFAULT_CONFIG.copy()
        config["max_debate_rounds"] = depth
        config["max_risk_discuss_rounds"] = depth
        config["quick_think_llm"] = quick_model
        config["deep_think_llm"] = deep_model
        config["llm_provider"] = provider

        # Find backend_url for the provider
        for p in LLM_PROVIDERS:
            if p["id"] == provider:
                config["backend_url"] = p["url"]
                break

        # Create graph
        graph = TradingAgentsGraph(
            selected_analysts,
            config=config,
            debug=True,
        )

        init_state = graph.propagator.create_initial_state(ticker, analysis_date)
        args = graph.propagator.get_graph_args()

        # Stream analysis in a thread (LangGraph is synchronous)
        report_sections = {}

        def run_analysis():
            trace = []
            for chunk in graph.graph.stream(init_state, **args):
                trace.append(chunk)
            return trace

        loop = asyncio.get_event_loop()
        # Run in executor and poll for chunks
        import queue
        import threading

        chunk_queue = queue.Queue()
        error_holder = [None]

        def _run():
            try:
                for chunk in graph.graph.stream(init_state, **args):
                    chunk_queue.put(chunk)
                chunk_queue.put(None)  # sentinel
            except Exception as e:
                error_holder[0] = e
                chunk_queue.put(None)

        thread = threading.Thread(target=_run, daemon=True)
        thread.start()

        trace = []
        while True:
            # Poll queue with short timeout to keep WS responsive
            try:
                chunk = await asyncio.get_event_loop().run_in_executor(
                    None, lambda: chunk_queue.get(timeout=0.5)
                )
            except queue.Empty:
                continue

            if chunk is None:
                break

            trace.append(chunk)

            # --- Update analyst statuses ---
            found_active = False
            for analyst_key in ANALYST_ORDER:
                if analyst_key not in selected_analysts:
                    continue
                agent_name = ANALYST_AGENT_NAMES[analyst_key]
                report_key = ANALYST_REPORT_MAP[analyst_key]

                if chunk.get(report_key):
                    report_sections[report_key] = chunk[report_key]

                has_report = bool(report_sections.get(report_key))
                if has_report:
                    agent_status[agent_name] = "completed"
                elif not found_active:
                    agent_status[agent_name] = "in_progress"
                    found_active = True

            if not found_active and selected_analysts:
                if agent_status.get("Bull Researcher") == "pending":
                    agent_status["Bull Researcher"] = "in_progress"

            # --- Research team ---
            if chunk.get("investment_debate_state"):
                ds = chunk["investment_debate_state"]
                if ds.get("bull_history", "").strip() or ds.get("bear_history", "").strip():
                    for a in ["Bull Researcher", "Bear Researcher", "Research Manager"]:
                        if agent_status.get(a) == "pending":
                            agent_status[a] = "in_progress"
                if ds.get("bull_history", "").strip():
                    report_sections["bull_history"] = ds["bull_history"]
                if ds.get("bear_history", "").strip():
                    report_sections["bear_history"] = ds["bear_history"]
                if ds.get("judge_decision", "").strip():
                    report_sections["investment_plan"] = ds["judge_decision"]
                    for a in ["Bull Researcher", "Bear Researcher", "Research Manager"]:
                        agent_status[a] = "completed"
                    agent_status["Trader"] = "in_progress"

            # --- Trader ---
            if chunk.get("trader_investment_plan"):
                report_sections["trader_investment_plan"] = chunk["trader_investment_plan"]
                agent_status["Trader"] = "completed"
                agent_status["Aggressive Analyst"] = "in_progress"

            # --- Risk debate ---
            if chunk.get("risk_debate_state"):
                rs = chunk["risk_debate_state"]
                if rs.get("aggressive_history", "").strip():
                    report_sections["aggressive_history"] = rs["aggressive_history"]
                    if agent_status.get("Aggressive Analyst") != "completed":
                        agent_status["Aggressive Analyst"] = "in_progress"
                if rs.get("conservative_history", "").strip():
                    report_sections["conservative_history"] = rs["conservative_history"]
                    if agent_status.get("Conservative Analyst") != "completed":
                        agent_status["Conservative Analyst"] = "in_progress"
                if rs.get("neutral_history", "").strip():
                    report_sections["neutral_history"] = rs["neutral_history"]
                    if agent_status.get("Neutral Analyst") != "completed":
                        agent_status["Neutral Analyst"] = "in_progress"
                if rs.get("judge_decision", "").strip():
                    report_sections["final_trade_decision"] = rs["judge_decision"]
                    for a in ["Aggressive Analyst", "Conservative Analyst", "Neutral Analyst", "Portfolio Manager"]:
                        agent_status[a] = "completed"

            # Send progress update
            await _send(ws, "progress", {
                "agents": {k: {"status": v, "name": AGENT_DISPLAY_NAMES.get(k, k)} for k, v in agent_status.items()},
                "reports": {k: v[:200] + "..." if len(v) > 200 else v for k, v in report_sections.items()},
            })

        if error_holder[0]:
            await _send(ws, "error", {"message": str(error_holder[0])})
            return

        # Mark all completed
        for a in agent_status:
            agent_status[a] = "completed"

        # Process final decision
        final_state = trace[-1] if trace else {}
        decision = ""
        if final_state.get("final_trade_decision"):
            decision = graph.process_signal(final_state["final_trade_decision"])

        # Build complete report
        complete_report = _build_report(report_sections, final_state, selected_analysts)

        # Collect chart data
        chart_data = {}
        try:
            chart_result = await get_chart_data(ticker, analysis_date)
            if isinstance(chart_result, dict) and "error" not in chart_result:
                chart_data = chart_result
        except Exception:
            pass

        await _send(ws, "complete", {
            "decision": decision,
            "agents": {k: {"status": v, "name": AGENT_DISPLAY_NAMES.get(k, k)} for k, v in agent_status.items()},
            "reports": report_sections,
            "complete_report": complete_report,
            "ticker": ticker,
            "date": analysis_date,
            "chart_data": chart_data,
        })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await _send(ws, "error", {"message": str(e), "trace": traceback.format_exc()})
        except Exception:
            pass


async def _send(ws: WebSocket, event: str, data: dict):
    await ws.send_text(json.dumps({"event": event, **data}, ensure_ascii=False, default=str))


def _build_report(sections: dict, final_state: dict, selected_analysts: list) -> dict:
    """Structure the report for the frontend."""
    report = {}

    # Analyst reports
    if "market" in selected_analysts and sections.get("market_report"):
        report["market_report"] = {"title": "Phân tích Thị trường", "content": sections["market_report"]}
    if "financial_reports" in selected_analysts and sections.get("financial_reports_report"):
        report["financial_reports_report"] = {"title": "Phân tích Báo cáo Tài chính", "content": sections["financial_reports_report"]}
    if "news" in selected_analysts and sections.get("news_report"):
        report["news_report"] = {"title": "Phân tích Tin tức", "content": sections["news_report"]}
    if "fundamentals" in selected_analysts and sections.get("fundamentals_report"):
        report["fundamentals_report"] = {"title": "Phân tích Cơ bản", "content": sections["fundamentals_report"]}

    # Research
    if sections.get("investment_plan"):
        report["investment_plan"] = {"title": "Quyết định Đội Nghiên cứu", "content": sections["investment_plan"]}

    # Trader
    if sections.get("trader_investment_plan"):
        report["trader_plan"] = {"title": "Kế hoạch Giao dịch", "content": sections["trader_investment_plan"]}

    # Final decision
    if sections.get("final_trade_decision"):
        report["final_decision"] = {"title": "Quyết định Cuối cùng", "content": sections["final_trade_decision"]}

    return report


# ---------------------------------------------------------------------------
# Serve frontend static files in production
# ---------------------------------------------------------------------------

FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
