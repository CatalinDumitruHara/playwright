from fastapi import APIRouter

from apps.users.profile.router import router as profile_router

API_BASE_PATH = "/api"

api_router = APIRouter()
api_router.include_router(profile_router)
