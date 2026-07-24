from abc import ABC, abstractmethod
from typing import Any

class BaseStorageProvider(ABC):
    @abstractmethod
    async def upload_file(self, file_path: str, destination: str) -> str:
        pass

    @abstractmethod
    async def get_file_url(self, file_path: str) -> str:
        pass
