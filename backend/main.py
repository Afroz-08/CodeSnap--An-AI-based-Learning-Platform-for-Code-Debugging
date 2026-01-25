from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ✅ IMPORT ROUTERS
from routes.explain import router as explain_router
from routes.tutor import router as tutor_router
from routes.run import router as run_router
from routes.report import router as report_router


load_dotenv(".env.local")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs on startup
    print("=== REGISTERED ROUTES ===")
    for r in app.routes:
        print(r.path, r.methods)
    yield
    # (optional) add shutdown logic here


app = FastAPI(title="CodeSnap API", version="0.1.0", lifespan=lifespan)

# ✅ Configure CORS (frontend → backend communication)
# Allow all origins for local development to avoid intermittent 400 preflight errors.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Register routes
app.include_router(explain_router, prefix="/api")
app.include_router(tutor_router, prefix="/api")
app.include_router(run_router, prefix="/api")
app.include_router(report_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "CodeSnap Backend is running"}


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}