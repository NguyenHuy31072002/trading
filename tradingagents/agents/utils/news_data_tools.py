import os
from langchain_core.tools import tool
from typing import Annotated
from tradingagents.dataflows.interface import route_to_vendor
from tavily import TavilyClient

@tool
def get_news(
    ticker: Annotated[str, "Ticker symbol"],
    start_date: Annotated[str, "Start date in yyyy-mm-dd format"],
    end_date: Annotated[str, "End date in yyyy-mm-dd format"],
) -> str:
    """
    Retrieve news data for a given ticker symbol.
    Uses the configured news_data vendor.
    Args:
        ticker (str): Ticker symbol
        start_date (str): Start date in yyyy-mm-dd format
        end_date (str): End date in yyyy-mm-dd format
    Returns:
        str: A formatted string containing news data
    """
    return route_to_vendor("get_news", ticker, start_date, end_date)

@tool
def get_global_news(
    curr_date: Annotated[str, "Current date in yyyy-mm-dd format"],
    look_back_days: Annotated[int, "Number of days to look back"] = 7,
    limit: Annotated[int, "Maximum number of articles to return"] = 5,
) -> str:
    """
    Retrieve global news data.
    Uses the configured news_data vendor.
    Args:
        curr_date (str): Current date in yyyy-mm-dd format
        look_back_days (int): Number of days to look back (default 7)
        limit (int): Maximum number of articles to return (default 5)
    Returns:
        str: A formatted string containing global news data
    """
    return route_to_vendor("get_global_news", curr_date, look_back_days, limit)

@tool
def search_web(
    query: Annotated[str, "Search query in English for best results"],
    max_results: Annotated[int, "Maximum number of results to return"] = 5,
) -> str:
    """
    Search the internet for real-time information about a company, stock, or any topic.
    Use this to find the latest news, analysis, financial data, and company information
    that may not be available through other tools.
    Args:
        query (str): Search query (use English for best results)
        max_results (int): Maximum number of results (default 5)
    Returns:
        str: Formatted search results with titles, URLs, and content snippets
    """
    api_key = os.environ.get("TAVILY_API_KEY")
    if not api_key:
        return "Error: TAVILY_API_KEY not set."
    try:
        client = TavilyClient(api_key=api_key)
        response = client.search(query, max_results=max_results, include_answer=True)
        parts = []
        if response.get("answer"):
            parts.append(f"**Summary:** {response['answer']}\n")
        for i, r in enumerate(response.get("results", []), 1):
            title = r.get("title", "No title")
            url = r.get("url", "")
            content = r.get("content", "")
            parts.append(f"**[{i}] {title}**\nURL: {url}\n{content}\n")
        return "\n".join(parts) if parts else "No results found."
    except Exception as e:
        return f"Search error: {e}"


@tool
def get_insider_transactions(
    ticker: Annotated[str, "ticker symbol"],
) -> str:
    """
    Retrieve insider transaction information about a company.
    Uses the configured news_data vendor.
    Args:
        ticker (str): Ticker symbol of the company
    Returns:
        str: A report of insider transaction data
    """
    return route_to_vendor("get_insider_transactions", ticker)
