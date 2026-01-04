from fastapi import FastAPI as f 
from fastapi.middleware.cors import CORSMiddleware
from app.routes.analyze import router

app = f()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message":"This is a fastapi backend for code analyzer application ✨"
    }
    
app.include_router(router,prefix="/api")