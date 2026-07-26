from fastapi import APIRouter
from api.health import router as health_router

api_router = APIRouter()

# Register modular routes
api_router.include_router(health_router, tags=["system"])

# Modules to be added later:
# api_router.include_router(organization_router, prefix="/org", tags=["organization"])
# api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
