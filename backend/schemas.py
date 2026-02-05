from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class ModelCreate(BaseModel):
    name: str
    region_id: str
    type: str = Field(..., description="e.g. 'Large', 'Small', 'Fine-tuned'")
    criticality: str = Field(..., pattern="^(Low|Medium|High)$")
    efficiency_score: int = Field(default=0, ge=0, le=100)

class PolicyCheckRequest(BaseModel):
    action: str
    model_id: str
    context: Optional[Dict[str, Any]] = {}

class PolicyCheckResponse(BaseModel):
    allowed: bool
    reason: str

class APIResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
