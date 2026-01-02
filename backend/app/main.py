from fastapi import FastAPI as f 
from app.routes.analyze import router
app = f()

@app.get("/")
async def root():
    return {
        "message":"This is a fastapi backend for code analyzer application ✨"
    }
    
app.include_router(router,prefix="/api")