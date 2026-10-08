import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from preprocess import load_and_preprocess
from evaluate import evaluate_model

def train():
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'server_metrics.csv')
    
    # 1-5. Handled in preprocess
    df = load_and_preprocess(data_path)
    
    # 6. Define target
    X = df.drop(columns=['performance_state'])
    y = df['performance_state']
    
    feature_names = X.columns.tolist()
    
    # 7. Split into train/test sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Scale features (important for Logistic Regression)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 8. Train ML models (compare Random Forest with Logistic Regression)
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
    rf_model.fit(X_train_scaled, y_train)
    
    lr_model = LogisticRegression(random_state=42, max_iter=1000, class_weight='balanced')
    lr_model.fit(X_train_scaled, y_train)
    
    # 9. Evaluate model
    print("Evaluating Random Forest:")
    rf_metrics = evaluate_model(rf_model, X_test_scaled, y_test, "Random Forest")
    
    print("\\nEvaluating Logistic Regression (Baseline):")
    lr_metrics = evaluate_model(lr_model, X_test_scaled, y_test, "Logistic Regression")
    
    # Select the best model (Random Forest usually wins on this type of data)
    best_model = rf_model
    print("\\nSelected Model: Random Forest Classifier")
    
    # 10. Save trained model
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    joblib.dump(best_model, os.path.join(models_dir, 'rf_model.joblib'))
    joblib.dump(scaler, os.path.join(models_dir, 'scaler.joblib'))
    joblib.dump(feature_names, os.path.join(models_dir, 'feature_names.joblib'))
    
    print("Model, scaler, and feature names saved successfully in 'models/' directory.")

if __name__ == "__main__":
    train()
