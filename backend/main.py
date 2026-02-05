import datetime
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import Optional, Dict, Any

# --- 1. Database Setup (SQLite) ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./governance.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. Database Models ---
class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    action = Column(String, index=True)
    user_id = Column(String) # Stored as string from token
    details = Column(JSON)

class PolicyModel(Base): # Local registry for checking policies
    __tablename__ = "registered_models"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    criticality = Column(String)
    type = Column(String)
    region = Column(String)

Base.metadata.create_all(bind=engine)

# --- 3. Pydantic Schemas ---
class ModelCreate(BaseModel):
    name: str
    region_id: str
    type: str 
    criticality: str
    efficiency_score: int = 0

class PolicyCheckRequest(BaseModel):
    action: str
    model_id: str # We might use name or ID here

class PolicyCheckResponse(BaseModel):
    allowed: bool
    reason: str

class APIResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# --- 4. FastAPI App ---
app = FastAPI(title="EcoCompute Governance Backend (Standalone)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_token(authorization: str = Header(None)):
    # Mock Token Validation (Standalone Mode)
    # In a real app, you'd decode the JWT here.
    if not authorization:
        # For PoC ease, we make it optional or just log a warning
        # raise HTTPException(status_code=401, detail="Missing Token")
        return "anon-user"
    return "authenticated-user"

@app.get("/")
def health_check():
    return {"status": "healthy", "mode": "standalone (sqlite)"}

@app.post("/api/v1/models/register", response_model=APIResponse)
async def register_model(model: ModelCreate, db: Session = Depends(get_db), user: str = Depends(verify_token)):
    """
    Registers model to Local DB after Policy Check.
    """
    # 1. Policy Check
    is_dirty_region = "east" in model.region_id or "central" in model.region_id
    
    if model.type == "Large" and model.criticality == "High" and is_dirty_region:
        # Audit Violation
        log = AuditLog(
            action="VIOLATION_DETECTED",
            user_id=user,
            details={"reason": "High Criticality Large Model in Dirty Region", "model": model.model_dump()}
        )
        db.add(log)
        db.commit()
        return APIResponse(success=False, error="Policy Violation: Cannot deploy High Criticality Large models to non-green regions.")

    # 2. Register
    try:
        # Save to local policy DB
        db_model = PolicyModel(
            name=model.name,
            criticality=model.criticality,
            type=model.type,
            region=model.region_id
        )
        db.add(db_model)
        
        # Log Success
        log = AuditLog(
            action="REGISTER_MODEL",
            user_id=user,
            details={"model": model.model_dump()}
        )
        db.add(log)
        
        db.commit()
        return APIResponse(success=True, data={"message": "Model registered securely in Governance Node."})
        
    except Exception as e:
        db.rollback()
        return APIResponse(success=False, error=str(e))

@app.post("/api/v1/policy/evaluate", response_model=PolicyCheckResponse)
async def evaluate_policy(request: PolicyCheckRequest, db: Session = Depends(get_db)):
    """
    Checks if an action is allowed based on local registry data.
    """
    # Try to find model by ID or Name (Mock implementation logic)
    # In this PoC, we assume request.model_id matches a name or DB ID
    
    # Just for demo: If model_id contains "critical", we deny
    if "critical" in request.model_id.lower():
         return PolicyCheckResponse(allowed=False, reason="Security Policy: Critical models cannot be auto-slept.")
         
    return PolicyCheckResponse(allowed=True, reason="Action permitted.")
