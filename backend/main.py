from fastapi import FastAPI as f 

app = f()

@app.get("/")
async def root():
    return {
        "message":"This is a fastapi backend for code analyzer application ✨"
    }