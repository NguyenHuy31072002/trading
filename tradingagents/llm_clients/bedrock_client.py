import os
from typing import Any, Optional

from langchain_aws import ChatBedrockConverse

from .base_client import BaseLLMClient, normalize_content
from .validators import validate_model

_PASSTHROUGH_KWARGS = (
    "temperature", "max_tokens", "timeout", "max_retries",
    "callbacks", "stop_sequences",
)


class NormalizedChatBedrockConverse(ChatBedrockConverse):
    """ChatBedrockConverse with normalized content output.

    Claude on Bedrock returns content as a list of typed blocks for
    tool use or extended thinking. This normalizes to string for
    consistent downstream handling, matching NormalizedChatAnthropic.
    """

    def invoke(self, input, config=None, **kwargs):
        return normalize_content(super().invoke(input, config, **kwargs))


class BedrockClient(BaseLLMClient):
    """Client for Anthropic Claude models served via AWS Bedrock.

    Authentication picks up `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
    and `AWS_REGION_NAME` (or `AWS_DEFAULT_REGION`) from the environment
    when not supplied via kwargs.
    """

    def __init__(self, model: str, base_url: Optional[str] = None, **kwargs):
        super().__init__(model, base_url, **kwargs)

    def get_llm(self) -> Any:
        region = (
            self.kwargs.get("region_name")
            or os.getenv("AWS_REGION_NAME")
            or os.getenv("AWS_DEFAULT_REGION")
            or "us-east-1"
        )

        llm_kwargs: dict = {
            "model": self.model,
            "region_name": region,
            # Bedrock + Opus can be slow with large context; default to 10 min.
            # Override via kwargs["timeout"] if needed.
            "timeout": self.kwargs.get("timeout", 600),
        }

        access_key = self.kwargs.get("aws_access_key_id") or os.getenv("AWS_ACCESS_KEY_ID")
        secret_key = self.kwargs.get("aws_secret_access_key") or os.getenv("AWS_SECRET_ACCESS_KEY")
        session_token = self.kwargs.get("aws_session_token") or os.getenv("AWS_SESSION_TOKEN")

        if access_key and secret_key:
            llm_kwargs["aws_access_key_id"] = access_key
            llm_kwargs["aws_secret_access_key"] = secret_key
            if session_token:
                llm_kwargs["aws_session_token"] = session_token

        for key in _PASSTHROUGH_KWARGS:
            if key in self.kwargs:
                llm_kwargs[key] = self.kwargs[key]

        return NormalizedChatBedrockConverse(**llm_kwargs)

    def validate_model(self) -> bool:
        return validate_model("bedrock", self.model)
