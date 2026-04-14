import pytest
from unittest.mock import patch, MagicMock
from app.services.ai_gemini import GeminiService

@pytest.mark.asyncio
async def test_gemini_retry_logic():
    svc = GeminiService()
    
    call_count = 0
    def mock_generate_content(prompt):
        nonlocal call_count
        call_count += 1
        if call_count < 3:
            raise Exception("Transient API error")
        mock_response = MagicMock()
        mock_response.text = "Mocked Success"
        return mock_response
        
    with patch.object(svc.model, 'generate_content', side_effect=mock_generate_content):
        result = await svc.generate_template("rejection", "No experience")
        # Assert the tenacity wrapper succeeded precisely on the 3rd allowed attempt
        assert result == "Mocked Success"
        assert call_count == 3
        
@pytest.mark.asyncio
async def test_gemini_tenacity_fails_after_3_attempts():
    svc = GeminiService()
    
    def mock_fail(prompt):
        raise Exception("Fatal Error")
        
    with patch.object(svc.model, 'generate_content', side_effect=mock_fail):
        # reraise=True means tenacity re-raises the original Exception, not RetryError
        with pytest.raises(Exception, match="Fatal Error"):
            await svc.generate_template("rejection", "No experience")
