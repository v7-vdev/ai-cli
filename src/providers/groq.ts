import dotenv from "dotenv";

dotenv.config();

export async function chatWithAI(prompt: string) {
    try {
        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                }),
            }
        );

        const data = await response.json();


        if (!response.ok) {
            return `API Error: ${data.error?.message}`;
        }

        return data.choices[0].message.content;
    } catch (error) {
        console.log(error);

        return "Something went wrong";
    }
}