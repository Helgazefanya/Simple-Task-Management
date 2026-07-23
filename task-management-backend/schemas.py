from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: UUID4
    username: str

    class Config:
        from_attributes = True

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "Todo"
    deadline: datetime
    assignee_id: UUID4

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None
    assignee_id: Optional[UUID4] = None

class TaskResponse(BaseModel):
    id: UUID4
    title: str
    description: Optional[str] = None
    status: str
    deadline: datetime
    assignee: Optional[UserResponse] = None

    class Config:
        from_attributes = True