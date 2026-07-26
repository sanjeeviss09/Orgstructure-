from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseAuthProvider(ABC):
    @abstractmethod
    async def verify_token(self, token: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        pass
