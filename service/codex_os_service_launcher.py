import uvicorn

def launch_service():
    uvicorn.run(
        "service.codex_os_service:app",
        host="0.0.0.0",
        port=8080,
        reload=False
    )

if __name__ == "__main__":
    launch_service()