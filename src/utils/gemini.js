/**
 * Sourced mock facts to fall back to when the Gemini API is not configured or fails.
 */
export function getMockFact(mode, distance, co2, persona) {
  const kidFacts = {
    car: `Vroom! That car ride made ${co2} kg of CO2 gas. Did you know a tree has to work for weeks to clean up that air? Next time, let's see if we can bike instead!`,
    bus: `Awesome job taking the bus! By sharing a ride with others, you saved a bunch of carbon bubbles. You're a green travel hero!`,
    train: `Choo choo! Riding the train is like a carbon superpower—it's super fast and keeps the air clean. You produced only ${co2} kg of CO2!`,
    flight: `Whoa, flying high! Planes use a lot of fuel and created ${co2} kg of CO2. Maybe we can plant a seedling to say thank you to the Earth!`,
    bike: `Wow! Pedaling your bike produced exactly 0 kg of CO2! You're using leg power to save the planet, one spin at a time!`,
    walk: `Step by step, you saved the day! Walking created 0 kg of CO2. Your body got a great workout and the Earth stays clean!`,
  };

  const friendFacts = {
    car: `That car trip emitted about ${co2} kg of CO2. Cars are convenient, but they're the biggest source of transport emissions. Maybe carpool next time to split the carbon bill!`,
    bus: `Nice choice taking the bus! Public transit keeps tons of single-occupancy cars off the road, cutting overall emissions by up to 80%. Let's keep it up.`,
    train: `Rail travel is incredibly efficient! Emitting just ${co2} kg of CO2 for this distance is a huge win compared to driving. Thanks for choosing the tracks!`,
    flight: `Flights have a massive climate impact, creating ${co2} kg of CO2. Consider offsetting this trip or looking into train alternatives for shorter routes.`,
    bike: `Zero emissions! Biking is the ultimate way to travel. You saved a significant amount of carbon today, got some fresh air, and beat the traffic!`,
    walk: `No emissions, just steps! Walking is the cleanest transit method. You saved carbon and got your steps in. Win-win!`,
  };

  const elderFacts = {
    car: `A car journey of this distance yields ${co2} kg of carbon dioxide. We must be mindful of our vehicle reliance; even small steps like combined trips help reduce this footprint.`,
    bus: `Utilizing the bus system is a highly responsible choice, resulting in a modest ${co2} kg of CO2. Collective transit remains a pillar of sustainable community living.`,
    train: `Traveling by train is a commendable and efficient method, emitting only ${co2} kg of carbon. It represents a respectful footprint on our shared environment.`,
    flight: `Air travel carries a heavy ecological cost, contributing ${co2} kg of CO2. We must reflect on the necessity of these flights and seek terrestrial travel when feasible.`,
    bike: `By choosing to bicycle, you have traveled with zero emissions. This gentle, active approach is a wonderful way to preserve the world for generations to come.`,
    walk: `Walking is the most ancient and respectful way to traverse our Earth, creating no carbon emissions whatsoever. It is a peaceful choice for both body and nature.`,
  };

  const personaMap = {
    kid: kidFacts,
    friend: friendFacts,
    elder: elderFacts,
  };

  const normalizedPersona = (persona || 'friend').toLowerCase();
  const normalizedMode = (mode || 'car').toLowerCase();
  
  const facts = personaMap[normalizedPersona] || friendFacts;
  return (
    facts[normalizedMode] || 
    `Traveling ${distance} km by ${mode} released ${co2} kg of CO2. Selecting active travel or shared transit is an effective way to lower your carbon footprint.`
  );
}

/**
 * Generates an educational fact card using Gemini 1.5 Flash client-side.
 * Falls back to local mock generation on failure or if credentials are missing.
 * 
 * @param {string} mode - Mode of transport
 * @param {number} distance - Distance in km
 * @param {number} co2 - CO2 footprint in kg
 * @param {string} persona - User persona (kid / friend / elder)
 * @returns {Promise<string>} The fact card text
 */
export async function generateGeminiFact(mode, distance, co2, persona) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    console.info('Gemini API key is not set. Falling back to local mock fact.');
    return getMockFact(mode, distance, co2, persona);
  }

  const prompt = `Write a short, engaging, educational carbon footprint fact card for a person who just traveled ${distance} km by ${mode}, resulting in ${co2} kg of CO2 emissions. 
Tailor the tone specifically for a ${persona} persona (kid: fun, simple, exciting; friend: casual, encouraging, conversational; elder: polite, informative, reflective).
Keep the response very short, maximum 2 to 3 sentences. Focus on the environmental impact and a tip or alternative. Do not add markdown formatting, lists, or headings; output only the plain text of the fact card.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || text.trim() === '') {
      throw new Error('No content returned in Gemini candidates');
    }

    return text.trim();
  } catch (error) {
    console.error('Gemini API call failed. Falling back to mock fact. Error:', error);
    return getMockFact(mode, distance, co2, persona);
  }
}
