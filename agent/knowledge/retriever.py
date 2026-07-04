from pathlib import Path
import re
import os

STOPWORDS = {
    "el", "la", "los", "las", "un", "una", "unos", "unas",
    "y", "e", "o", "u", "a", "ante", "bajo", "con", "de",
    "del", "desde", "en", "entre", "hacia", "hasta", "para",
    "por", "que", "segun", "sin", "sobre", "tras", "lo",
    "como", "mas", "pero", "sus", "le", "ya", "este", "esta",
    "esto", "ese", "esa", "eso", "aquel", "aquella", "es",
    "son", "fue", "ser", "ha", "han", "habia", "hay", "tiene",
    "puede", "su", "al", "no", "si", "te", "se", "me",
    "nos", "les", "the", "is", "are", "it", "for", "of",
    "in", "to", "and", "or", "be", "has", "have", "do",
    "does", "did", "can", "will", "would", "with", "this",
    "that", "from", "they", "you", "all", "when", "what",
    "how", "why", "each",
}

_chunks = []


def _load_knowledge() -> None:
    global _chunks
    dir_path = os.environ.get(
        "KNOWLEDGE_DIR",
        str(Path(__file__).resolve().parent),
    )
    kb_dir = Path(dir_path)
    _chunks = []

    if not kb_dir.exists():
        return

    for md_file in kb_dir.glob("*.md"):
        text = md_file.read_text(encoding="utf-8")
        paragraphs = re.split(r"\n\s*\n", text)
        for para in paragraphs:
            para = para.strip()
            if not para or len(para) < 20:
                continue
            tokens = {
                word for word in re.findall(r"\w+", para.lower())
                if word not in STOPWORDS and len(word) > 2
            }
            if tokens:
                _chunks.append((tokens, para))


def query(user_message: str, top_n: int = 2) -> str:
    if not _chunks:
        _load_knowledge()

    if not _chunks:
        return ""

    query_tokens = {
        word for word in re.findall(r"\w+", user_message.lower())
        if word not in STOPWORDS and len(word) > 2
    }

    if not query_tokens:
        return ""

    scored = []
    for tokens, para in _chunks:
        matches = len(query_tokens & tokens)
        if matches > 0:
            scored.append((matches, para))

    if not scored:
        return ""

    scored.sort(key=lambda x: x[0], reverse=True)
    return "\n\n".join(para for _, para in scored[:top_n])
