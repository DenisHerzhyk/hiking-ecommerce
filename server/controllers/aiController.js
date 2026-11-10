import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../config/db.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const suggestGear = async (req, res) => {
  const { trailName, difficulty, date, weather } = req.body;

  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        gender: true,
      },
    });

    const productList = products
      .map(
        (p) =>
          `- ${p.title} (${p.category}, ${p.gender ?? "unisex"}, /product/${p.id})`,
      )
      .join("\n");

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: `You are a hiking gear advisor. You MUST only recommend products from the inventory list.
Respond ONLY with a raw JSON object. No markdown, no backticks, no explanation. Just the JSON.`,
      messages: [
        {
          role: "user",
          content: `            
          Trail: ${trailName}
          Difficulty: ${difficulty}
          Temperature: ${weather.temp}°C
          Precipitation: ${weather.precipitation}mm
          Wind: ${weather.wind}km/h

          Available products:
          ${productList}

          Respond with this exact JSON structure:
          {
            "male": {
              "top": { "id": 1, "title": "product name" },
              "bottom": { "id": 2, "title": "product name" }
            },
            "female": {
              "top": { "id": 3, "title": "product name" },
              "bottom": { "id": 4, "title": "product name" }
            },
            "reason": "one sentence weather reasoning"
          }
          `,
        },
      ],
    });

    console.log("AI response:", message.content[0].text);

    const suggestion = JSON.parse(
      message.content[0].text.replace(/```json\n?|```/g, "").trim(),
    );

    if (
      !suggestion.male?.top ||
      !suggestion.male?.bottom ||
      !suggestion.female?.top ||
      !suggestion.female?.bottom
    ) {
      return res
        .status(500)
        .json({ error: "Invalid suggestion structure from AI" });
    }

    return res.status(200).json({ suggestion });
  } catch (err) {
    return res
      .status(500)
      .json({ error: `Failed to generate suggestion: ${err}` });
  }
};
