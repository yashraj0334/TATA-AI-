from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.upload import router as upload_router
from api.human_approval import router as human_approval_router


app = FastAPI(
    title="Tata Legal AI Backend",
    description="Backend API for AI-powered legal contract analysis",
    version="1.0.0"
)


# ---------------------------------------------------------
# CORS configuration
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Upload API
# ---------------------------------------------------------

app.include_router(upload_router)


# ---------------------------------------------------------
# Human Approval API
# ---------------------------------------------------------

app.include_router(human_approval_router)


# ---------------------------------------------------------
# Home endpoint
# ---------------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Tata Legal AI Backend is running"
    }


# ---------------------------------------------------------
# Health check endpoint
# ---------------------------------------------------------

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "Tata Legal AI Backend"
    }