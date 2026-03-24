export async function parseNaturalQueryAI(query) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY

  if (!apiKey) {
    throw new Error('VITE_GROQ_API_KEY is missing in frontend/.env')
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a strict real estate search query parser. Extract filters from the user's natural language string.
Return EXACTLY and ONLY a valid JSON object. No markdown, no explanations, no wrappers.
Possible fields:
- maxPrice (number)
- minPrice (number)
- rooms (string: '1','2','3','4','5') — minimum number of bedrooms
- bathrooms (string: '1','2','3','4') — minimum number of bathrooms
- category (string: 'apartment', 'condo', 'single-family', 'townhouse', 'multi-family', 'manufactured', 'lot')
- state (2-letter abbreviation, e.g. 'TX', 'NY', 'CA')
- city (string)
- county (string — county name, e.g. 'Los Angeles', 'Cook')
- minArea (number — minimum living area in sqft)
- maxArea (number — maximum living area in sqft)
- yearBuiltMin (number — earliest year built, e.g. 2000)
- yearBuiltMax (number — latest year built, e.g. 2020)
- homeStatus (string: 'FOR_SALE', 'RECENTLY_SOLD', 'FOR_RENT') — listing status
- minValueScore (number 0-100 — minimum quality/value score; use 70+ for "good deal", 85+ for "great deal")
- sort (string: 'price_asc', 'price_desc', 'new', 'value_score') — sort order; use 'value_score' for "best value", 'new' for "newest"
- q (string — remaining freeform keywords like 'pool', 'lake view', 'garage', 'corner lot')

Inference rules:
- "cheap"/"affordable"/"budget" → set maxPrice conservatively AND sort='price_asc'
- "luxury"/"upscale"/"premium" → set minPrice high
- "new"/"newly built"/"modern construction" → yearBuiltMin=2010 (or appropriate year)
- "old"/"historic"/"vintage"/"character" → yearBuiltMax=1970
- "spacious"/"large"/"big" → minArea=1500
- "small"/"cozy"/"compact" → maxArea=900
- "for sale"/"available"/"on market" → homeStatus='FOR_SALE'
- "recently sold"/"sold" → homeStatus='RECENTLY_SOLD'
- "best value"/"great deal"/"high value score" → minValueScore=80, sort='value_score'
- "newest listings"/"recently listed"/"just listed" → sort='new'
- If a county is explicitly mentioned (e.g. "in Cook County"), extract it as county
- Only include fields that are clearly present in the query. Do NOT guess.

Example input: "cheap 2 bed apartment in austin tx with pool"
Example JSON: {"category": "apartment", "state": "TX", "city": "Austin", "rooms": "2", "maxPrice": 300000, "sort": "price_asc", "q": "pool"}

Example input: "spacious 3 bedroom house built after 2010 in Los Angeles County CA"
Example JSON: {"rooms": "3", "category": "single-family", "state": "CA", "county": "Los Angeles", "yearBuiltMin": 2010, "minArea": 1500}

Example input: "best value condos in New York"
Example JSON: {"category": "condo", "city": "New York", "minValueScore": 80, "sort": "value_score"}`
        },
        { role: 'user', content: query },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Groq API Error: ${text.slice(0, 100)}`)
  }

  const data = await res.json()
  const content = data.choices[0].message.content
  return JSON.parse(content)
}
