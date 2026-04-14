from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.api.routers import auth, hr, apply, templates, ai, queue, organization
from app.api.dependencies import get_current_user
from app.config import settings
from app.limiter import limiter

def create_app() -> FastAPI:
    app = FastAPI(title="ATS Platform API")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    
    # Allow routers to be added
    app.include_router(auth.router, prefix="/auth", tags=["Auth"])
    
    # Public Apply Router
    app.include_router(apply.router, prefix="/api/apply", tags=["Apply"])
    
    # Global protection for HR routes injected as dependencies
    app.include_router(
        hr.router, 
        prefix="/hr", 
        tags=["HR"], 
        dependencies=[Depends(get_current_user)]
    )
    app.include_router(
        templates.router, 
        prefix="/hr/templates", 
        tags=["Templates"], 
        dependencies=[Depends(get_current_user)]
    )
    
    app.include_router(
        organization.router,
        prefix="/hr",
        tags=["Organization"],
        dependencies=[Depends(get_current_user)]
    )
    
    app.include_router(
        ai.router,
        prefix="/ai",
        tags=["AI Service"],
        dependencies=[Depends(get_current_user)]
    )

    app.include_router(
        queue.router,
        prefix="/hr/queue",
        tags=["Email Queue Monitor"],
        dependencies=[Depends(get_current_user)]
    )
    
    @app.get("/health")
    def health_check():
        return {"status": "ok"}
        
    return app

app = create_app()

# Uvicorn auto-reload trigger
