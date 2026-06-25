@app.get("/")
def home():
    return {
        "message": "ADA online"
    }