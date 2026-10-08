import re

class QueryAnalyzer:
    @staticmethod
    def normalize(query: str) -> str:
        """
        Deterministic query normalization BEFORE any LLM-based rewriting.
        - trim leading/trailing whitespace
        - normalize repeated whitespace
        - preserve capitalization of technical identifiers where useful
        - preserve acronyms
        """
        if not query:
            return ""
            
        # Trim leading/trailing whitespace
        normalized = query.strip()
        
        # Replace multiple spaces with a single space
        normalized = re.sub(r'\s+', ' ', normalized)
        
        # Clean up repeated punctuation like "??" or "!!" but keep at least one
        normalized = re.sub(r'([?!.])\1+', r'\1', normalized)
        
        return normalized
