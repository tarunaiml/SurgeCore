import pandas as pd
import numpy as np
import os

def generate_data(num_samples=5000):
    np.random.seed(42)
    
    data = []
    for _ in range(num_samples):
        # Determine state
        state_prob = np.random.random()
        if state_prob < 0.6:
            state = "NORMAL"
        elif state_prob < 0.85:
            state = "WARNING"
        else:
            state = "HIGH_LOAD"
            
        if state == "NORMAL":
            traffic = np.random.normal(100, 20)
            cpu = np.random.normal(30, 10)
            memory = np.random.normal(40, 10)
            db_query = np.random.normal(50, 15)
            active_users = int(np.random.normal(500, 100))
            sys_load = np.random.normal(0.5, 0.2)
            response = np.random.normal(200, 50)
        elif state == "WARNING":
            traffic = np.random.normal(300, 50)
            cpu = np.random.normal(65, 10)
            memory = np.random.normal(70, 10)
            db_query = np.random.normal(200, 50)
            active_users = int(np.random.normal(1500, 300))
            sys_load = np.random.normal(1.5, 0.4)
            response = np.random.normal(600, 150)
        else: # HIGH_LOAD
            traffic = np.random.normal(600, 100)
            cpu = np.random.normal(90, 5)
            memory = np.random.normal(90, 5)
            db_query = np.random.normal(500, 100)
            active_users = int(np.random.normal(3000, 500))
            sys_load = np.random.normal(3.5, 0.8)
            response = np.random.normal(1200, 300)
            
        # Clip values to realistic ranges
        traffic = max(10, traffic)
        cpu = min(100, max(1, cpu))
        memory = min(100, max(5, memory))
        db_query = max(5, db_query)
        active_users = max(10, active_users)
        sys_load = max(0.1, sys_load)
        response = max(20, response)
        
        data.append({
            "traffic_volume": round(traffic, 2),
            "response_time": round(response, 2),
            "cpu_utilization": round(cpu, 2),
            "memory_utilization": round(memory, 2),
            "db_query_time": round(db_query, 2),
            "active_users": active_users,
            "system_load": round(sys_load, 2),
            "performance_state": state
        })
        
    df = pd.DataFrame(data)
    
    # Save the dataset
    os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
    file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "server_metrics.csv")
    df.to_csv(file_path, index=False)
    print(f"Dataset generated at: {file_path}")

if __name__ == "__main__":
    generate_data()
