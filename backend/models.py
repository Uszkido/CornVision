from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from .database import Base

class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    line_id = Column(String)
    type = Column(String)  # burnt, broken, foreign, normal
    confidence = Column(Float)
    image_url = Column(String, nullable=True)

class StatsSnapshot(Base):
    __tablename__ = "stats_history"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    total_processed = Column(Integer)
    defects_count = Column(Integer)
    uptime_seconds = Column(Integer)
    efficiency = Column(Float)
