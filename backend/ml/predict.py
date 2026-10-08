import os
import joblib
import pandas as pd
import numpy as np

# Load models once when module is imported
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
try:
    model = joblib.load(os.path.join(MODELS_DIR, 'rf_model.joblib'))
    scaler = joblib.load(os.path.join(MODELS_DIR, 'scaler.joblib'))
    feature_names = joblib.load(os.path.join(MODELS_DIR, 'feature_names.joblib'))
except FileNotFoundError:
    model, scaler, feature_names = None, None, None
    print("Warning: Model files not found. Please run train.py first.")

def get_feature_importances():
    if model is None or not hasattr(model, 'feature_importances_'):
        return {}
    importances = model.feature_importances_
    return {feature_names[i]: float(importances[i]) for i in range(len(feature_names))}

def predict_state(metrics):
    if model is None:
        raise ValueError("Model not loaded. Train the model first.")
        
    # Create DataFrame from metrics to easily calculate derived features
    df = pd.DataFrame([metrics])
    
    # Feature Engineering (must match preprocess.py)
    df['cpu_memory_pressure'] = df['cpu_utilization'] * df['memory_utilization']
    df['database_pressure'] = df['db_query_time'] * df['traffic_volume']
    df['users_per_request_capacity'] = df['active_users'] / (df['traffic_volume'] + 1)
    
    # Ensure correct order of features
    X = df[feature_names]
    
    # Scale features
    X_scaled = scaler.transform(X)
    
    # Predict
    prediction = model.predict(X_scaled)[0]
    probabilities = model.predict_proba(X_scaled)[0]
    classes = model.classes_
    
    # Get probability for the predicted class
    pred_idx = np.where(classes == prediction)[0][0]
    confidence = float(probabilities[pred_idx])
    
    # Calculate Risk Score (0-100)
    # High load probability heavily weights risk
    if "HIGH_LOAD" in classes:
        high_load_idx = np.where(classes == "HIGH_LOAD")[0][0]
        high_load_prob = float(probabilities[high_load_idx])
        
        warning_prob = 0
        if "WARNING" in classes:
            warning_idx = np.where(classes == "WARNING")[0][0]
            warning_prob = float(probabilities[warning_idx])
            
        risk_score = int((high_load_prob * 100) + (warning_prob * 50))
        risk_score = min(100, max(0, risk_score))
    else:
        risk_score = 0
        
    # Recommended Action
    recommended_action = "NONE"
    if prediction == "HIGH_LOAD":
        if metrics.get('db_query_time', 0) > 400:
            recommended_action = "ENABLE_CACHE"
        elif metrics.get('cpu_utilization', 0) > 85:
            recommended_action = "DISABLE_HEAVY_COMPONENTS"
        else:
            recommended_action = "REDUCE_PAGINATION"
    elif prediction == "WARNING":
        if metrics.get('db_query_time', 0) > 200:
            recommended_action = "OPTIMIZE_DATABASE_QUERIES"
        else:
            recommended_action = "REDUCE_PAGINATION"
            
    return {
        "prediction": prediction,
        "probability": round(confidence, 2),
        "risk_score": risk_score,
        "recommended_action": recommended_action,
        "all_probabilities": {str(c): float(p) for c, p in zip(classes, probabilities)}
    }
