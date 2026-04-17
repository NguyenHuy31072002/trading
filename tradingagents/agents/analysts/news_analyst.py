from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
import time
import json
from tradingagents.agents.utils.agent_utils import (
    build_instrument_context,
    get_global_news,
    get_news,
    search_web,
)
from tradingagents.dataflows.config import get_config


def create_news_analyst(llm):
    def news_analyst_node(state):
        current_date = state["trade_date"]
        instrument_context = build_instrument_context(state["company_of_interest"])

        tools = [
            get_news,
            get_global_news,
            search_web,
        ]

        system_message = (
            "You are a news researcher tasked with analyzing recent news and trends over the past week. Please write a comprehensive report of the current state of the world that is relevant for trading and macroeconomics. "
            "Use the available tools: get_news(query, start_date, end_date) for company-specific or targeted news searches, get_global_news(curr_date, look_back_days, limit) for broader macroeconomic news, and search_web(query) to search the internet for the latest real-time information about the company, its competitors, industry trends, regulatory changes, or any relevant topic. "
            "IMPORTANT: You MUST use search_web to research the company on the internet before writing your report. Search for recent news, earnings, analyst opinions, and any significant events. "
            "Provide specific, actionable insights with supporting evidence to help traders make informed decisions."
            "\n\n"
            "CITATION REQUIREMENTS — MANDATORY:\n"
            "1. Every factual claim, statistic, quote, or news event you mention MUST be attributed to its source.\n"
            "2. When the tool output includes a publisher name and a URL (Link/URL field), you MUST include both inline in your prose, formatted as: [Tên nguồn](URL) — e.g., 'Theo [Reuters](https://reuters.com/article/xyz), giá cổ phiếu đã tăng 5%...'. If no URL is available, still cite the publisher name.\n"
            "3. Never fabricate URLs or sources. If a tool did not return a URL for a piece of information, omit the link but keep the publisher name.\n"
            "4. At the END of the report, you MUST add a section titled '## Nguồn tham khảo' containing a numbered list of every unique source actually used, formatted as: '1. Tên nguồn — [tiêu đề bài](URL) — ngày đăng (nếu có)'.\n"
            "5. The key-points markdown table at the end should also have a column named 'Nguồn' with the publisher name for each point.\n"
            "\n"
            "IMPORTANT: You MUST write your entire response in Vietnamese (tiếng Việt)."
        )

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are a helpful AI assistant, collaborating with other assistants."
                    " Use the provided tools to progress towards answering the question."
                    " If you are unable to fully answer, that's OK; another assistant with different tools"
                    " will help where you left off. Execute what you can to make progress."
                    " If you or any other assistant has the FINAL TRANSACTION PROPOSAL: **BUY/HOLD/SELL** or deliverable,"
                    " prefix your response with FINAL TRANSACTION PROPOSAL: **BUY/HOLD/SELL** so the team knows to stop."
                    " You have access to the following tools: {tool_names}.\n{system_message}"
                    "For your reference, the current date is {current_date}. {instrument_context}",
                ),
                MessagesPlaceholder(variable_name="messages"),
            ]
        )

        prompt = prompt.partial(system_message=system_message)
        prompt = prompt.partial(tool_names=", ".join([tool.name for tool in tools]))
        prompt = prompt.partial(current_date=current_date)
        prompt = prompt.partial(instrument_context=instrument_context)

        chain = prompt | llm.bind_tools(tools)
        result = chain.invoke(state["messages"])

        report = ""

        if len(result.tool_calls) == 0:
            report = result.content

        return {
            "messages": [result],
            "news_report": report,
        }

    return news_analyst_node
