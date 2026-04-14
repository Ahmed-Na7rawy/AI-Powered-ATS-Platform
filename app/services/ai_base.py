from abc import ABC, abstractmethod

class AIService(ABC):

    @abstractmethod
    async def generate_template(self, email_type: str, context: str) -> str:
        """Generates an email body based on type and context."""
        pass

    @abstractmethod
    async def improve_jd(self, job_description: str) -> str:
        """Cleans and improves a job description."""
        pass

    @abstractmethod
    async def summarize_resume(self, resume_text: str, job_context: str) -> dict:
        """Extracts bullet points and scores candidate against job context."""
        pass
