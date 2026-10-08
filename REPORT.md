# REPORT: Self-Optimizing Web Application Using Machine Learning

## 1. Introduction
Modern web applications face dynamic loads that can severely degrade performance. Traditional reactive scaling requires human intervention or slow infrastructure provisioning. This project introduces a predictive, self-optimizing architecture that leverages Machine Learning (ML) to anticipate bottlenecks.

## 2. Problem Statement
Most web applications act reactively. When traffic spikes, response times rise and databases bottleneck before administrators can resolve the issue, leading to poor user experience. The challenge is to build a system that identifies these patterns early and reconfigures itself automatically.

## 3. Objectives
- Monitor system metrics continuously.
- Predict high-load conditions using an ML model.
- Automatically optimize application configurations (e.g., caching, reducing pagination) prior to significant degradation.
- Recover to standard operations when metrics normalize.

## 4. Proposed Solution
A full-stack implementation composed of a Next.js frontend (simulating telemetry and acting as the dashboard) and a FastAPI Python backend serving a Random Forest ML model. The system creates a continuous `MONITOR -> PREDICT -> OPTIMIZE -> RECOVER` cycle.

## 5. System Architecture
- **Frontend Layer**: Next.js + Tailwind CSS. Responsible for visualization (Recharts) and telemetry simulation.
- **Backend API**: FastAPI serving REST endpoints for predictions and historical logging.
- **ML Engine**: Scikit-Learn based Random Forest Classifier deployed via `joblib`.

## 6. Dataset
A highly realistic synthetic dataset containing 5,000 records of server metrics (Traffic Volume, CPU, Memory, DB Query Time, Active Users, System Load). It models the complex relationships between traffic spikes and subsequent resource exhaustion.

## 7. Data Preprocessing
Missing values are handled via mean imputation. Duplicate records are removed. The data is normalized using `StandardScaler` to ensure features contribute equally to the model logic.

## 8. Feature Engineering
Derived features enhance predictive capability:
- `cpu_memory_pressure`
- `database_pressure`
- `users_per_request_capacity`

## 9. Machine Learning Model
Random Forest Classifier is chosen for its robustness, ability to model complex non-linear relationships without heavy tuning, and critical interpretability (via feature importances), allowing the system to logically assign mitigations based on feature weights.

## 10. Model Training
Trained using an 80/20 train-test split with `class_weight='balanced'` to prevent bias against the minority class (e.g., HIGH_LOAD anomalies). Compared against a Logistic Regression baseline, Random Forest provided superior predictive reliability.

## 11. Model Evaluation
Model performance is evaluated across Accuracy, Precision, Recall, and F1-Score. The Random Forest model achieved near-perfect synthetic classification accuracy due to the controlled nature of the dataset.

## 12. Monitoring Engine
Simulates real-time application behavior, updating metrics every second and tracking the trailing averages to simulate an active observability pipeline (like Datadog).

## 13. Prediction Engine
The frontend pushes state vectors to `/api/predict`. The backend processes the metrics, maps them through the scaler, and the model outputs the state (`NORMAL`, `WARNING`, `HIGH_LOAD`) along with a calculated risk probability.

## 14. Auto-Optimization Decision Engine
Triggered by sustained `WARNING` or `HIGH_LOAD` predictions (enforced by a Stability Guard), the controller moves beyond simple reactive rules. It acts as a closed-loop optimization controller:
1. **Bottleneck Analysis**: Identifies the primary stressor (e.g., Database vs CPU) by normalizing current metrics against expected baselines.
2. **Candidate Evaluation**: Generates a list of potential interventions (`ENABLE_CACHE`, `DISABLE_HEAVY_COMPONENTS`, etc.).
3. **Counterfactual Simulation**: Calculates the expected performance gain of each intervention.
4. **Scoring**: Ranks candidates based on expected gain minus the cost of user impact.
5. **Application & Verification**: Applies the winning action, waits for the system to stabilize, and measures the *actual* improvement against the *expected* improvement, logging the result to provide an observable feedback loop.

## 15. Recovery Engine
To prevent optimization thrashing, the system requires 5 consecutive `NORMAL` predictions with high confidence before safely verifying that the load has truly subsided. It then disables the optimizations and restores standard configuration.

## 16. The Intelligent Control Loop
This continuous cycle demonstrates a self-healing application architecture:
`MONITOR -> PREDICT -> ANALYZE BOTTLENECK -> EVALUATE -> OPTIMIZE -> MEASURE -> RECOVER`.

## 17. User Interface
Features a "Demo Controls" panel to artificially inject load scenarios, visualizing the resulting automated response via performance graphs and an event log.

## 18. Results
The system successfully demonstrates the targeted behavior: an artificial spike in load triggers the ML warning, which activates caching, causing the charts to stabilize until the manual reset triggers the recovery phase.

## 19. Limitations
- Telemetry is simulated rather than collected from live OS processes.
- Optimizations are application-state modifiers in the simulation, rather than real Linux/cloud commands.

## 20. Future Scope
Integration with eBPF for real kernel-level observability, and Kubernetes for genuine pod-autoscaling and resource throttling.

## 21. Conclusion
This project successfully demonstrates how integrating a lightweight ML prediction model into a web application's lifecycle can proactively prevent user-facing performance degradation.
