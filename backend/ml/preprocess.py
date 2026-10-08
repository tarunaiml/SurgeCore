import pandas as pd
import numpy as np

def load_and_preprocess(filepath):
    # 1. Load dataset
    df = pd.read_csv(filepath)
    
    # 2. Inspect data (simulated print)
    print("Dataset Shape:", df.shape)
    print("Missing Values:\\n", df.isnull().sum())
    
    # 3. Handle missing values
    df.fillna(df.mean(numeric_only=True), inplace=True)
    
    # 4. Remove duplicate records
    df.drop_duplicates(inplace=True)
    
    # 5. Feature Engineering
    # Derived features as requested
    df['cpu_memory_pressure'] = df['cpu_utilization'] * df['memory_utilization']
    df['database_pressure'] = df['db_query_time'] * df['traffic_volume']
    df['users_per_request_capacity'] = df['active_users'] / (df['traffic_volume'] + 1)
    
    return df

if __name__ == "__main__":
    df = load_and_preprocess("data/server_metrics.csv")
    print(df.head())
