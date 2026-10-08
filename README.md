# Self-Optimizing Web Application Using Machine Learning

## 1. Project Title
Self-Optimizing Web Application Using Machine Learning

## Live Demo
**Live Application:** [https://YOUR-DEPLOYED-URL.vercel.app](https://YOUR-DEPLOYED-URL.vercel.app)  
**GitHub Repository:** [https://github.com/tarunaiml/SurgeCore](https://github.com/tarunaiml/SurgeCore)

*(Note: The infrastructure telemetry in this recruitment prototype is simulated. The ML model, prediction pipeline, optimization decision logic, and closed-loop behavior are implemented as functional software.)*

## 2. Problem Statement
Most web applications are reactive. When traffic increases, applications slow down until developers identify and resolve the issue. This results in poor user experience. The objective is to build a web application that monitors its performance, predicts bottlenecks using Machine Learning, and automatically applies optimizations to prevent degradation.

## 3. Solution
This project implements a full-stack web application with an embedded ML-based monitoring engine. It tracks key metrics like traffic volume, CPU utilization, database query time, and active users. An ML model (Random Forest Classifier) predicts upcoming high-load conditions, and an auto-optimization engine automatically applies fixes (like enabling cache or reducing pagination) to prevent performance degradation. When the load normalizes, the system recovers to its standard configuration.

## 4. Key Features
- **Real-Time Monitoring**: Simulates and tracks system metrics.
- **Predictive Engine**: Uses a trained Random Forest model to predict performance state (NORMAL, WARNING, HIGH_LOAD).
- **Auto-Optimization Engine**: Applies strategies like 'ENABLE CACHE' or 'REDUCE PAGINATION' dynamically.
- **Auto-Recovery**: Restores standard configuration once metrics normalize.
- **Interactive Dashboard**: Next.js frontend with live charts to visualize the `MONITOR -> PREDICT -> OPTIMIZE -> RECOVER` cycle.

## 5. Architecture
This project is structured as an **ML-driven closed-loop optimization controller**, differing significantly from basic rule-based autoscalers.

```
MONITOR
  ↓
FEATURE PROCESSING
  ↓
ML PREDICTION (Degradation Risk)
  ↓
BOTTLENECK ANALYSIS (CPU vs DB vs Memory)
  ↓
CANDIDATE GENERATION (Possible Interventions)
  ↓
COUNTERFACTUAL EVALUATION (Simulated Impacts)
  ↓
OPTIMIZATION DECISION (Highest Score)
  ↓
APPLY ACTION
  ↓
MEASURE ACTUAL RESULT (Feedback Loop)
  ↓
RECOVER (When Stabilized)
```

## 6. How it Differs from Basic Autoscaling
A basic system simply states: *"If CPU > 80% → Scale Up."* 

This intelligent controller:
1. **Predicts** degradation using an ML model before hard thresholds are crossed.
2. **Identifies** the likely bottleneck (e.g., Database vs CPU).
3. **Evaluates** multiple candidate interventions based on their expected impact and user disruption cost.
4. **Selects** the optimal intervention automatically.
5. **Measures** the actual performance improvement to verify success.
6. **Enforces Stability Rules** to prevent thrashing, ensuring anomalies are sustained before acting.

## 7. Dataset & 8. Dataset Source
**Source**: A synthetic dataset (`server_metrics.csv`) was generated specifically to simulate realistic application telemetry.
*Note: Due to the lack of a standardized public dataset perfectly matching the required features for this exact demo, a highly realistic simulation dataset was generated. The script (`ml/data/generate_dataset.py`) ensures coherent relationships (e.g., high traffic correlates with high CPU and slow DB queries).*

## 9. Dataset Preprocessing
- Loaded using `pandas`.
- Missing values are imputed with column means.
- Duplicate records are removed.

## 10. Feature Engineering
The model relies on both direct and derived features:
- `cpu_memory_pressure` (cpu_utilization * memory_utilization)
- `database_pressure` (db_query_time * traffic_volume)
- `users_per_request_capacity` (active_users / traffic_volume)

## 11. ML Model & 12. Model Selection
- **Selected Model**: `RandomForestClassifier`
- **Why?**: It inherently handles non-linear relationships and interactions among metrics. It provides interpretable `feature_importances_`, making it easy to understand what drives high-load predictions. It significantly outperformed a simple Logistic Regression baseline in evaluation.

## 13. Model Evaluation
Evaluated metrics include Accuracy, Precision, Recall, F1-Score, and a Confusion Matrix. The dataset classes (`NORMAL`, `WARNING`, `HIGH_LOAD`) are handled using `class_weight='balanced'`.

## 14. Backend API
Built with Python + FastAPI. Endpoints include:
- `GET /api/model-info`: Provides feature importances and model metadata.
- `POST /api/predict`: Takes metrics and returns predictions and risk score.
- `POST /api/metrics`: Stores the latest state in the history.
- `POST /api/optimize` / `POST /api/recover`: Adjust system optimization state.

## 15. Frontend
Built using Next.js, TypeScript, Tailwind CSS, and Recharts. Features an interactive dashboard distinguishing between "REAL ML" data and "SIMULATION" controls.

## 16. Simulation Engine
The frontend maintains an internal state engine. Depending on the chosen scenario (e.g., "HIGH TRAFFIC"), it smoothly shifts metric values toward danger zones. When an optimization is triggered, it artificially dampens these values (e.g., caching lowers DB query time).

## 17. Optimization Engine
Responds to the ML prediction:
- If High CPU: Disables heavy components.
- If High DB Query Time: Enables Cache.
- If Warning: Reduces pagination limits.

## 18. Recovery Mechanism
A counter tracks consecutive `NORMAL` predictions. Once a threshold is reached, a REST call triggers `/api/recover` and the frontend simulation resets modifiers.

## 19. Installation
### Prerequisites
- Node.js (v18+)
- Python (3.9+)

## 20. Running Locally & Deployment
This project is configured to separate Local Development from Live Production.

### Environment Variables
For the **Frontend** (`frontend/.env.local` for local, or Vercel dashboard):
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```
*(In production/Vercel, set this to your deployed Python backend URL, e.g., `https://your-backend.onrender.com/api`)*

For the **Backend** (Host environment):
```env
ALLOW_ORIGINS=http://localhost:3000
```
*(In production, set this to your Vercel frontend URL, e.g., `https://your-frontend.vercel.app`)*

### Backend Setup (Local)
```bash
cd backend
python -m venv venv
# Windows:
.\\venv\\Scripts\\activate
# Mac/Linux:
source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 21. Training the Model
If you need to retrain or generate data:
```bash
cd ml
python data/generate_dataset.py
python train.py
```

## 22. Demo Instructions
1. Open the **live application**.
2. Start with **Normal Load**.
3. Select **High Traffic Spike**.
4. Observe performance metrics increase in real-time.
5. The ML model predicts **degradation** (WARNING or HIGH_LOAD).
6. The Bottleneck analyzer identifies the primary bottleneck (e.g., Database).
7. The Optimization Decision Engine evaluates candidate actions.
8. The best action is automatically selected based on expected impact vs. user disruption.
9. Optimization is applied and the system state updates.
10. Before/after performance is measured and logged.
11. Click **Normal Load** again, and the system enters recovery once conditions stabilize for several ticks.

## 23. Limitations
- Telemetry generation is simulated inside the browser rather than pulled from a real reverse-proxy (e.g., Nginx) or APM tool.
- The optimization actions modify the simulation state rather than executing real infrastructure commands (e.g., allocating actual AWS instances).

## 24. Future Improvements
- Integrate with real APM tools like Prometheus or Datadog.
- Implement an automated retraining pipeline triggered by data drift.
- Use Docker/Kubernetes to execute real scaling actions instead of simulated ones.
