export default async function handler(request, response) {
    // 1. POST 요청만 허용
    if (request.method !== 'POST') {
        return response.status(405).json({
            error: 'Method Not Allowed'
        });
    }

    try {
        // 2. 요청 바디에서 content(일기 내용) 추출
        const { content } = request.body;

        if (!content) {
            return response.status(400).json({
                error: '일기 내용을 입력해주세요.'
            });
        }

        // 3. 환경 변수에서 API 키 가져오기
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            return response.status(500).json({
                error: 'API 키가 서버에 설정되지 않았습니다.'
            });
        }

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `너는 심리 상담가야. 사용자가 작성한 일기 내용을 읽고, 사용자의 감정을 한 단어(예: 기쁨, 슬픔, 분노, 불안, 평온)로 요약해줘. 그리고 그 감정에 공감해주고, 따뜻한 응원의 메시지를 2~3문장으로 작성해줘. 답변 형식은 반드시 '감정: [요약된 감정]\n\n[응원 메시지]' 와 같이 줄바꿈을 포함해서 보내줘. 일기 내용: "${content}"`,
                                },
                            ],
                        },
                    ],
                }),
            }
        );

        const data = await geminiResponse.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        // 5. AI 답변 추출
        const aiMessage = data.candidates[0].content.parts[0].text;

        // 6. 결과 반환
        return response.status(200).json({
            success: true,
            analysis: aiMessage,
        });
    } catch (error) {
        console.error('Serverless Function Error:', error);
        return response.status(500).json({
            error: 'AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        });
    }
}
