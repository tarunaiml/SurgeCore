from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os
from typing import List, Dict, Any

# Add ml folder to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'ml')))
try:
    from predict import predict_state, get_feature_importances
except ImportError:
    print("Warning: ml module not found. Make sure you're running from the correct directory.")

app = FastAPI(title="Self-Optimizing Web Application API")

# Enable CORS
# In production, set ALLOW_ORIGINS to the frontend domain (e.g., https://your-app.vercel.app)
# For local development, "*" is acceptable but specific origins are safer.
origins = os.environ.get("ALLOW_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for metrics history and status
history = []
MAX_HISTORY = 100
current_status = {
    "optimization_active": False,
    "current_optimization": "NONE",
    "activation_time": None
}

class Metrics(BaseModel):
    traffic_volume: float
    response_time: float
    cpu_utilization: float
    memory_utilization: float
    db_query_time: float
    active_users: int
    system_load: float

class OptimizationRequest(BaseModel):
    action: str

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/model-info")
def model_info():
    importances = get_feature_importances()
    return {
        "model_type": "Random Forest Classifier",
        "features": list(importances.keys()),
        "feature_importances": importances,
        "classes": ["NORMAL", "WARNING", "HIGH_LOAD"]
    }

@app.post("/api/predict")
def predict(metrics: Metrics):
    try:
        result = predict_state(metrics.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/metrics")
def add_metrics(metrics: Metrics):
    # Get prediction to store with history
    try:
        prediction_res = predict_state(metrics.dict())
    except Exception:
        prediction_res = {"prediction": "UNKNOWN", "risk_score": 0}
        
    record = {
        "metrics": metrics.dict(),
        "prediction": prediction_res,
        "optimization": current_status["current_optimization"]
    }
    
    history.append(record)
    if len(history) > MAX_HISTORY:
        history.pop(0)
        
    return {"status": "recorded", "prediction": prediction_res}

@app.post("/api/optimize")
def apply_optimization(req: OptimizationRequest):
    import datetime
    current_status["optimization_active"] = True
    current_status["current_optimization"] = req.action
    current_status["activation_time"] = datetime.datetime.now().isoformat()
    return {"status": "optimization_applied", "action": req.action}

@app.post("/api/recover")
def apply_recovery():
    current_status["optimization_active"] = False
    current_status["current_optimization"] = "NONE"
    current_status["activation_time"] = None
    return {"status": "recovered"}

@app.get("/api/status")
def get_status():
    return current_status

@app.get("/api/history")
def get_history():
    return history
