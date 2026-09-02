"""Small live release smoke for the configured external AI providers."""

from jagalchi_ai.ai_core.client import DeepSeekClient, ExaSearchClient, TavilySearchClient


def main() -> None:
    deepseek = DeepSeekClient()
    response = deepseek.generate_json('Return exactly {"ok": true}')
    if not response.is_valid or response.get("ok") is not True:
        raise SystemExit("DeepSeek live smoke failed")

    tavily = TavilySearchClient()
    if not tavily.available or not tavily.search("Python official documentation", max_results=1):
        raise SystemExit("Tavily live smoke failed")

    exa = ExaSearchClient()
    if not exa.available() or not exa.search("Python official documentation", max_results=1):
        raise SystemExit("Exa live smoke failed")

    print("external AI provider smoke passed")


if __name__ == "__main__":
    main()
