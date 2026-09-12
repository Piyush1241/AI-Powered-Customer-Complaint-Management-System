from sqlalchemy import Column, String, Integer, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_number = Column(String, unique=True, index=True, nullable=False)
    product_name = Column(String, index=True, nullable=True)
    product_type = Column(String, nullable=True) # API or FDF
    dosage_form = Column(String, nullable=True)
    strength = Column(String, nullable=True)
    batch_number = Column(String, index=True, nullable=True)
    quantity_affected = Column(String, nullable=True)
    reporter_name = Column(String, nullable=True)
    reporter_type = Column(String, nullable=True) # Hospital, Distributor, Pharmacy, Patient
    reporter_contact = Column(String, nullable=True)
    date_received = Column(String, nullable=True)
    complaint_description = Column(Text, nullable=True)
    status = Column(String, default="Logged") # Logged, Under Investigation, CAPA Pending, Closed
    
    # Store JSON representations of AI outputs
    risk_assessment = Column(JSON, nullable=True)
    completeness_check = Column(JSON, nullable=True)
    duplicate_info = Column(JSON, nullable=True)
    capa_recommendation = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    history = relationship("ComplaintHistory", back_populates="complaint", cascade="all, delete-orphan")


class ComplaintHistory(Base):
    __tablename__ = "complaint_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    action_type = Column(String, nullable=False) # LOGGED, EDITED, EXTRACTED_FROM_DOC
    input_prompt = Column(Text, nullable=True)
    form_snapshot = Column(JSON, nullable=False)
    risk_snapshot = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="history")
