from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
import time
import json
from tradingagents.agents.utils.agent_utils import build_instrument_context, get_fundamentals, get_balance_sheet, get_cashflow, get_income_statement
from tradingagents.dataflows.config import get_config


def create_financial_reports_analyst(llm):
    def financial_reports_analyst_node(state):
        current_date = state["trade_date"]
        instrument_context = build_instrument_context(state["company_of_interest"])

        tools = [
            get_fundamentals,
            get_balance_sheet,
            get_cashflow,
            get_income_statement,
        ]

        system_message = (
            "You are a financial reports analyst tasked with analyzing the financial statements of a specific company over the past 4 consecutive years. You will be given a company's name and your objective is to write a comprehensive long report detailing your analysis of the company's financial health, trends, and key metrics over the last 4 years. "
            "Use the available tools to retrieve fundamental data, balance sheets, cash flow statements, and income statements. "
            "Your analysis should cover: "
            "1. Revenue and profit trends over 4 years "
            "2. Balance sheet health (assets, liabilities, equity changes) "
            "3. Cash flow analysis (operating, investing, financing activities) "
            "4. Key financial ratios and their trends (ROE, ROA, debt-to-equity, current ratio, etc.) "
            "5. Year-over-year growth rates and notable changes "
            "6. Overall assessment of financial health and sustainability "
            "Provide specific, actionable insights with supporting evidence to help traders make informed decisions."
            """ Make sure to append a Markdown table at the end of the report to organize key financial metrics across the 4 years, organized and easy to read."""
            """ IMPORTANT: You MUST write your entire response in Vietnamese (tiếng Việt)."""
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
            "financial_reports_report": report,
        }

    return financial_reports_analyst_node
