# Re-export router from api.chat for compatibility with expected routes layout
from api.chat import router

__all__ = ["router"]
