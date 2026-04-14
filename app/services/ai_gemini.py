import asyncio
import google.generativeai as genai
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from app.config import settings
from app.services.ai_base import AIService

class GeminiService(AIService):
    def __init__(self, api_key: str = None):
        # Configure SDK for the service
        actual_key = api_key or settings.GEMINI_API_KEY
        genai.configure(api_key=actual_key)
        
        # Dynamically find an available model that supports generation
        available_models = [
            m.name for m in genai.list_models() 
            if 'generateContent' in m.supported_generation_methods
        ]
        if not available_models:
            raise ValueError("No generative models available for this API key.")
            
        print(f"Available Gemini models: {available_models}")
        # Prioritize a standard text model if present, else pick the first available
        target_model = next((m for m in available_models if 'gemini-1.5' in m), available_models[0])
        print(f"Selected Gemini model: {target_model}")
        
        self.model = genai.GenerativeModel(target_model)

    @retry(
        wait=wait_exponential(multiplier=1, min=2, max=10),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(Exception),
        reraise=True
    )
    def _call_gemini_sync(self, prompt: str) -> str:
        response = self.model.generate_content(prompt)
        return response.text

    async def generate_template(self, email_type: str, context: str) -> str:
        prompt = f"Write a professional ATS email of type '{email_type}'. Context: {context}. Only return the email body."
        return await asyncio.to_thread(self._call_gemini_sync, prompt)

    async def improve_jd(self, job_description: str) -> str:
        prompt = f"Improve, format and clean the following job description to sound more professional and engaging:\n\n{job_description}"
        return await asyncio.to_thread(self._call_gemini_sync, prompt)

    async def summarize_resume(self, resume_text: str, job_context: str) -> dict:
        prompt = f"""
        Act as an expert technical recruiter. Evaluate the candidate's resume against the Job Context.
        
        Job Context:
        {job_context}
        
        Resume Text:
        {resume_text}
        
        Provide the result as a strict JSON object with exactly two keys:
        1. "score": An integer from 0 to 100.
        2. "summary": A string containing exactly 3 to 5 markdown bullet points highlighting strengths/weaknesses.
        """
        raw_text = await asyncio.to_thread(self._call_gemini_sync, prompt)
        clean_json = raw_text.replace('```json', '').replace('```', '').strip()
        try:
            import json
            data = json.loads(clean_json)
            return {
                "score": int(data.get("score", 0)),
                "content": str(data.get("summary", "No summary provided."))
            }
        except Exception as e:
            print(f"AI JSON Parse Error: {e} - Raw text: {raw_text}")
            return {"score": 0, "content": raw_text}
