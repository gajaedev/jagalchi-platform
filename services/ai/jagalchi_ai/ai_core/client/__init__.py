"""External AI service clients."""

from jagalchi_ai.ai_core.client.deepseek_client import (
    DeepSeekAPIError,
    DeepSeekClient,
    DeepSeekConfigurationError,
    DeepSeekError,
    DeepSeekModel,
    GenerationConfig,
    get_default_client as get_default_deepseek_client,
    quick_generate,
)
from jagalchi_ai.ai_core.client.deepseek_response import (
    DeepSeekResponse,
    create_empty_response,
    create_error_response,
)
from jagalchi_ai.ai_core.client.exa_client import (
    ContentType,
    ExaSearchClient,
    ExaSearchOptions,
    SearchType,
    get_default_client as get_default_exa_client,
    quick_search as exa_quick_search,
)
from jagalchi_ai.ai_core.client.exa_result import (
    ExaResult,
    deduplicate_results,
    filter_results_by_domain,
    filter_results_by_score,
    results_to_context,
    sort_results,
)
from jagalchi_ai.ai_core.client.tavily_client import (
    SearchDepth,
    SearchTopic,
    TavilySearchClient,
    TavilySearchOptions,
)
from jagalchi_ai.ai_core.client.tavily_result import TavilyResult

__all__ = [
    "DeepSeekAPIError", "DeepSeekClient", "DeepSeekConfigurationError",
    "DeepSeekError", "DeepSeekModel", "DeepSeekResponse", "GenerationConfig",
    "get_default_deepseek_client", "quick_generate", "create_empty_response",
    "create_error_response", "TavilySearchClient", "TavilySearchOptions",
    "TavilyResult", "SearchDepth", "SearchTopic", "ExaSearchClient",
    "ExaSearchOptions", "ExaResult", "SearchType", "ContentType",
    "get_default_exa_client", "exa_quick_search", "filter_results_by_score",
    "filter_results_by_domain", "deduplicate_results", "sort_results",
    "results_to_context",
]

__version__ = "1.1.0"
__author__ = "Jagalchi AI Team"
