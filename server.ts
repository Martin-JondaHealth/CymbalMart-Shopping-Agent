import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy / Safe Gemini initialization
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// API: Generate Event Plan & Curated Shopping List
app.post('/api/generate-plan', async (req, res) => {
  try {
    const {
      partyType = 'Birthday Party',
      theme = 'Celebration',
      targetBudget = 200,
      guestCount = 12,
      adultCount = 12,
      childCount = 0,
      venueType = 'indoor',
      dietaryPreferences = [],
      specialRequests = '',
    } = req.body;

    const ai = getGeminiClient();

    if (!ai) {
      // Return a smart fallback response if no key is configured
      return res.json({
        success: true,
        source: 'fallback',
        plan: {
          title: `${theme} ${partyType}`,
          vibeDescription: `A festive ${theme.toLowerCase()} designed for ${guestCount} guests with a budget goal of $${targetBudget}.`,
          items: generateFallbackItems(partyType, theme, Number(targetBudget), Number(guestCount), dietaryPreferences),
        },
      });
    }

    const prompt = `You are the chief event planner and budget shopping expert at CymbalMart grocery and general store.
Plan a comprehensive, budget-conscious party shopping list for:
- Event: ${partyType}
- Theme/Vibe: ${theme}
- Target Budget: $${targetBudget} (Aim for the total sum of item prices * quantities to be roughly between $${Math.round(targetBudget * 0.85)} and $${Math.round(targetBudget * 1.02)})
- Guests: ${guestCount} total (${adultCount} adults, ${childCount} children)
- Venue: ${venueType}
- Dietary requirements: ${dietaryPreferences.length > 0 ? dietaryPreferences.join(', ') : 'Standard / No restrictions'}
- Special notes: ${specialRequests || 'None'}

Return a structured JSON list of shopping items available at CymbalMart.
For each item include:
- name: specific product name
- brand: CymbalMart brand (e.g., 'Cymbal Butcher Reserve', 'Cymbal Everyday', 'Cymbal EcoChoice', 'Cymbal Bakery Fresh', 'Cymbal Pantry Select', 'Cymbal Refresh', 'Cymbal Party Essentials', 'Cymbal Market Fresh')
- category: one of 'food', 'beverage', 'decor', 'tableware', 'activities'
- subcategory: e.g. 'Mains', 'Sides', 'Dessert', 'Mixers', 'Lighting', 'Plates', 'Games'
- unitPrice: realistic decimal number (e.g. 5.99)
- quantity: integer (sufficient for ${guestCount} guests)
- unit: string ('pack', 'bag', 'bottle', 'box', 'set', 'tub', 'lb')
- isChecked: boolean (true)
- aisle: realistic store location like 'Aisle 3 - Bakery', 'Meat & Seafood Case', 'Aisle 7 - Party Goods', 'Produce Station'
- tier: 'budget', 'standard', or 'premium'
- notes: short explanation of portion or host tip
- dietaryTags: array of relevant tags e.g. ['Gluten-Free', 'Vegetarian', 'Nut-Free'] if applicable
- alternatives: 1 or 2 alternative options with { tier, name, brand, unitPrice } for budget or premium swaps

Also provide:
- title: concise punchy event title
- vibeDescription: 1-2 sentence description of the party experience and host prep advice.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            vibeDescription: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  brand: { type: Type.STRING },
                  category: {
                    type: Type.STRING,
                    enum: ['food', 'beverage', 'decor', 'tableware', 'activities'],
                  },
                  subcategory: { type: Type.STRING },
                  unitPrice: { type: Type.NUMBER },
                  quantity: { type: Type.INTEGER },
                  unit: { type: Type.STRING },
                  isChecked: { type: Type.BOOLEAN },
                  aisle: { type: Type.STRING },
                  tier: {
                    type: Type.STRING,
                    enum: ['budget', 'standard', 'premium'],
                  },
                  notes: { type: Type.STRING },
                  dietaryTags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  alternatives: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        tier: { type: Type.STRING, enum: ['budget', 'standard', 'premium'] },
                        name: { type: Type.STRING },
                        brand: { type: Type.STRING },
                        unitPrice: { type: Type.NUMBER },
                      },
                      required: ['tier', 'name', 'brand', 'unitPrice'],
                    },
                  },
                },
                required: ['name', 'brand', 'category', 'unitPrice', 'quantity', 'unit', 'aisle', 'tier'],
              },
            },
          },
          required: ['title', 'vibeDescription', 'items'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    // Ensure all items have IDs
    if (Array.isArray(parsed.items)) {
      parsed.items = parsed.items.map((item: any, idx: number) => ({
        ...item,
        id: `ai-item-${Date.now()}-${idx}`,
        isChecked: item.isChecked !== false,
      }));
    }

    res.json({
      success: true,
      source: 'gemini',
      plan: parsed,
    });
  } catch (error: any) {
    console.error('Error generating party plan:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate party plan',
    });
  }
});

// API: Interactive CymbalMart Assistant Chatbot
app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      conversationHistory = [],
      currentEvent = {},
      currentItems = [],
      metrics = {},
    } = req.body;

    const ai = getGeminiClient();

    if (!ai) {
      // Smart offline response
      const fallbackResponse = handleOfflineChat(message, currentItems, metrics, currentEvent);
      return res.json({
        success: true,
        text: fallbackResponse.text,
        proposedActions: fallbackResponse.proposedActions,
      });
    }

    const itemsSummary = currentItems.map((it: any) => ({
      id: it.id,
      name: it.name,
      brand: it.brand,
      category: it.category,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
      tier: it.tier,
      isChecked: it.isChecked,
    }));

    const systemInstruction = `You are "CymbalMart Assistant", a friendly, knowledgeable, and efficient party planning and grocery shopping expert for CymbalMart.
You help busy hosts finalize their event menus, portion quantities accurately, resolve dietary restrictions, suggest decor/games, and keep their shopping list within budget.

Current Event Context:
- Party Type: ${currentEvent.partyType || 'Event'}
- Theme: ${currentEvent.theme || 'Party'}
- Guest Count: ${currentEvent.guestCount || 12}
- Target Budget: $${currentEvent.targetBudget || 200}
- Current Subtotal: $${metrics.subtotal || 0}
- Current Total with tax: $${metrics.finalTotal || 0}
- Remaining Budget: $${metrics.remainingBudget || 0} (${metrics.isOverBudget ? 'OVER BUDGET' : 'UNDER BUDGET'})
- Dietary Requests: ${(currentEvent.dietaryPreferences || []).join(', ') || 'None specified'}
- Current Shopping List Items (${itemsSummary.length} items):
${JSON.stringify(itemsSummary, null, 2)}

You can answer user questions, explain recipes, provide portion guides (e.g. 1/3 lb meat per guest, 2 drinks per guest per hour), and recommend budget cuts.

IMPORTANT: When the user asks to modify the shopping list (add item, remove item, swap brands, cut budget, double quantities, add vegan options, etc.), you must propose concrete structured actions in the "proposedActions" field.
Possible action types:
- 'add_item': provide item object { name, brand, category, subcategory, unitPrice, quantity, unit, aisle, tier, notes }
- 'remove_item': provide targetItemId matching one of the item IDs above.
- 'update_qty': provide targetItemId and newQty.
- 'swap_item': provide targetItemId and item object containing replacement details.
- 'budget_cut': provide description and savingsAmount.
- 'navigate_checkout': when user asks to checkout, check out, review cart, or place order, provide description 'Proceed to Checkout & Review Order'.

Always speak in a concise, warm, helpful manner. Avoid robotic repetition. Return your response in structured JSON.`;

    const contents = [
      ...conversationHistory.slice(-6).map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: contents as any,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: 'The conversational response to the customer.',
            },
            proposedActions: {
              type: Type.ARRAY,
              description: 'List of shopping list modifications requested or suggested by the assistant.',
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    enum: ['add_item', 'remove_item', 'update_qty', 'swap_item', 'budget_cut', 'navigate_checkout'],
                  },
                  description: { type: Type.STRING },
                  targetItemId: { type: Type.STRING },
                  newQty: { type: Type.INTEGER },
                  savingsAmount: { type: Type.NUMBER },
                  item: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      brand: { type: Type.STRING },
                      category: {
                        type: Type.STRING,
                        enum: ['food', 'beverage', 'decor', 'tableware', 'activities'],
                      },
                      subcategory: { type: Type.STRING },
                      unitPrice: { type: Type.NUMBER },
                      quantity: { type: Type.INTEGER },
                      unit: { type: Type.STRING },
                      aisle: { type: Type.STRING },
                      tier: { type: Type.STRING, enum: ['budget', 'standard', 'premium'] },
                      notes: { type: Type.STRING },
                    },
                  },
                },
                required: ['type', 'description'],
              },
            },
          },
          required: ['text'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    // Add unique IDs to any added items
    if (Array.isArray(parsed.proposedActions)) {
      parsed.proposedActions = parsed.proposedActions.map((action: any, idx: number) => {
        if (action.item) {
          action.item.id = `chat-add-${Date.now()}-${idx}`;
          action.item.isChecked = true;
          if (!action.item.unit) action.item.unit = 'pack';
          if (!action.item.quantity) action.item.quantity = 1;
        }
        return action;
      });
    }

    res.json({
      success: true,
      text: parsed.text || 'I can help adjust your shopping list or answer questions about your event planning!',
      proposedActions: parsed.proposedActions || [],
    });
  } catch (error: any) {
    console.error('Error in chatbot:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Chatbot service error',
    });
  }
});

// API: Process Voice Command Hands-Free
app.post('/api/voice-command', async (req, res) => {
  try {
    const {
      transcript = '',
      currentEvent = {},
      currentItems = [],
      metrics = {},
      currentView = 'list',
    } = req.body;

    const lower = transcript.toLowerCase().trim();
    const ai = getGeminiClient();

    if (!ai) {
      // Smart offline voice parser
      const fallbackResult = handleOfflineVoiceCommand(lower, currentEvent, currentItems, metrics, currentView);
      return res.json({
        success: true,
        source: 'fallback',
        ...fallbackResult,
      });
    }

    const itemsSummary = currentItems.map((it: any) => ({
      id: it.id,
      name: it.name,
      brand: it.brand,
      category: it.category,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
      tier: it.tier,
      isChecked: it.isChecked,
    }));

    const prompt = `You are the Voice Control Agent for CymbalMart Party Planner.
The customer spoke this voice command: "${transcript}"

Current context:
- View: ${currentView} (options: 'wizard', 'list', 'portions', 'checkout')
- Event: ${currentEvent.partyType || 'Party'} | Theme: ${currentEvent.theme || 'Celebration'} | Guests: ${currentEvent.guestCount || 12} | Budget: $${currentEvent.targetBudget || 200}
- Current Total: $${metrics.finalTotal || 0} (${metrics.isOverBudget ? 'OVER BUDGET' : 'UNDER BUDGET'})
- Items in cart (${itemsSummary.length} items):
${JSON.stringify(itemsSummary, null, 2)}

Analyze the customer's intent and return a JSON object with:
1. "speechResponse": A concise, natural, warm audio confirmation sentence suitable to be spoken aloud via text-to-speech (keep it under 25 words).
2. "actionType": One of:
   - 'NAVIGATE_VIEW': parameters { view: 'wizard' | 'list' | 'portions' | 'checkout' }
   - 'UPDATE_EVENT': parameters { guestCount?, targetBudget?, partyType?, theme?, venueType?, dietaryPreferences? }
   - 'GENERATE_PLAN': parameters { partyType?, theme?, targetBudget?, guestCount? }
   - 'LOAD_PRESET': parameters { presetId: string }
   - 'ADD_ITEM': parameters { item: { name, brand, category, unitPrice, quantity, unit, aisle, tier, notes } }
   - 'REMOVE_ITEM': parameters { targetItemId: string, targetName: string }
   - 'UPDATE_QTY': parameters { targetItemId: string, targetName: string, newQty: number, delta?: number }
   - 'SWAP_TIER': parameters { tier: 'budget' | 'standard' | 'premium', targetItemId?: string }
   - 'OPTIMIZE_BUDGET': parameters {}
   - 'FILTER_CATEGORY': parameters { category: 'all' | 'food' | 'beverage' | 'tableware' | 'decor' | 'activities' }
   - 'SEARCH_ITEMS': parameters { query: string }
   - 'CHECK_ALL': parameters { checked: boolean }
   - 'TOGGLE_ITEM': parameters { targetItemId: string, isChecked: boolean }
   - 'SET_FULFILLMENT': parameters { fulfillmentType: 'pickup' | 'delivery' }
   - 'PLACE_ORDER': parameters {}
   - 'READ_CART': parameters { text: string }
   - 'GENERAL_QA': parameters { answer: string }
3. "parameters": object containing specific action fields matching the actionType above.

If the user asks a question about food portions, suggestions, or party advice, set actionType to 'GENERAL_QA' and put the spoken answer in speechResponse.
Return structured JSON only.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            speechResponse: { type: Type.STRING },
            actionType: {
              type: Type.STRING,
              enum: [
                'NAVIGATE_VIEW',
                'UPDATE_EVENT',
                'GENERATE_PLAN',
                'LOAD_PRESET',
                'ADD_ITEM',
                'REMOVE_ITEM',
                'UPDATE_QTY',
                'SWAP_TIER',
                'OPTIMIZE_BUDGET',
                'FILTER_CATEGORY',
                'SEARCH_ITEMS',
                'CHECK_ALL',
                'TOGGLE_ITEM',
                'SET_FULFILLMENT',
                'PLACE_ORDER',
                'READ_CART',
                'GENERAL_QA',
              ],
            },
            parameters: {
              type: Type.OBJECT,
              properties: {
                view: { type: Type.STRING },
                presetId: { type: Type.STRING },
                targetItemId: { type: Type.STRING },
                targetName: { type: Type.STRING },
                newQty: { type: Type.INTEGER },
                delta: { type: Type.INTEGER },
                tier: { type: Type.STRING },
                category: { type: Type.STRING },
                query: { type: Type.STRING },
                checked: { type: Type.BOOLEAN },
                isChecked: { type: Type.BOOLEAN },
                fulfillmentType: { type: Type.STRING },
                guestCount: { type: Type.INTEGER },
                targetBudget: { type: Type.NUMBER },
                partyType: { type: Type.STRING },
                theme: { type: Type.STRING },
                venueType: { type: Type.STRING },
                dietaryPreferences: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                item: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    brand: { type: Type.STRING },
                    category: { type: Type.STRING },
                    subcategory: { type: Type.STRING },
                    unitPrice: { type: Type.NUMBER },
                    quantity: { type: Type.INTEGER },
                    unit: { type: Type.STRING },
                    aisle: { type: Type.STRING },
                    tier: { type: Type.STRING },
                    notes: { type: Type.STRING },
                  },
                },
              },
            },
          },
          required: ['speechResponse', 'actionType'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    // If item was created, assign unique id
    if (parsed.parameters?.item) {
      parsed.parameters.item.id = `voice-item-${Date.now()}`;
      parsed.parameters.item.isChecked = true;
    }

    res.json({
      success: true,
      source: 'gemini',
      speechResponse: parsed.speechResponse,
      actionType: parsed.actionType,
      parameters: parsed.parameters || {},
    });
  } catch (error: any) {
    console.error('Error processing voice command with Gemini:', error);
    // Fallback to offline rule-based handler
    const fallback = handleOfflineVoiceCommand(
      (req.body.transcript || '').toLowerCase().trim(),
      req.body.currentEvent || {},
      req.body.currentItems || [],
      req.body.metrics || {},
      req.body.currentView || 'list'
    );
    res.json({
      success: true,
      source: 'fallback',
      ...fallback,
    });
  }
});

// Offline Voice Command Rule Parser
function handleOfflineVoiceCommand(
  transcript: string,
  currentEvent: any,
  currentItems: any[],
  metrics: any,
  currentView: string
) {
  const raw = transcript.toLowerCase();
  // Normalize punctuation and variations
  const t = raw.replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Checkout / Place Order / Navigate Checkout
  if (
    t.includes('place order') ||
    t.includes('confirm order') ||
    t.includes('buy now') ||
    t.includes('finalize order') ||
    t.includes('submit order') ||
    t.includes('complete order')
  ) {
    return {
      speechResponse: `Order confirmed! We're preparing your party cart for ${currentEvent.guestCount || 12} guests.`,
      actionType: 'PLACE_ORDER',
      parameters: {},
    };
  }

  if (
    t.includes('check out') ||
    t.includes('checkout') ||
    t.includes('take me to check out') ||
    t.includes('take me to checkout') ||
    t.includes('go to check out') ||
    t.includes('go to checkout') ||
    t.includes('open check out') ||
    t.includes('open checkout') ||
    t.includes('proceed to check out') ||
    t.includes('proceed to checkout') ||
    t.includes('review order') ||
    t.includes('view cart') ||
    t.includes('show cart') ||
    t.includes('open cart') ||
    t.includes('pay now') ||
    t.includes('to checkout') ||
    t.includes('to check out') ||
    t.includes('ready to order') ||
    t.includes('ready to pay')
  ) {
    return {
      speechResponse: `Opening checkout now. Your current total is $${(metrics.finalTotal || 0).toFixed(2)}.`,
      actionType: 'NAVIGATE_VIEW',
      parameters: { view: 'checkout' },
    };
  }

  // 2. Portion Guide
  if (
    t.includes('portion') ||
    t.includes('how much food') ||
    t.includes('estimator') ||
    t.includes('open portion') ||
    t.includes('portion guide') ||
    t.includes('show portions') ||
    t.includes('calculate portions') ||
    t.includes('take me to portion')
  ) {
    return {
      speechResponse: `Opening the portion guide for ${currentEvent.guestCount || 12} guests.`,
      actionType: 'NAVIGATE_VIEW',
      parameters: { view: 'portions' },
    };
  }

  // 3. New Event / Edit Event
  if (
    t.includes('new event') ||
    t.includes('new party') ||
    t.includes('edit event') ||
    t.includes('change event') ||
    t.includes('wizard') ||
    t.includes('event setup') ||
    t.includes('start over') ||
    t.includes('change budget') ||
    t.includes('change guests')
  ) {
    return {
      speechResponse: 'Opening event setup. Tell me your party theme, guest count, or budget.',
      actionType: 'NAVIGATE_VIEW',
      parameters: { view: 'wizard' },
    };
  }

  // 4. Return to Shopping List
  if (
    t.includes('show list') ||
    t.includes('shopping list') ||
    t.includes('back to list') ||
    t.includes('view items') ||
    t.includes('close checkout') ||
    t.includes('close portions')
  ) {
    return {
      speechResponse: 'Showing your CymbalMart shopping list.',
      actionType: 'NAVIGATE_VIEW',
      parameters: { view: 'list' },
    };
  }

  // 4. Generate Shopping List / Plan
  if (t.includes('generate') || t.includes('create list') || t.includes('plan party') || t.includes('make shopping list')) {
    return {
      speechResponse: 'Generating your custom CymbalMart shopping list now!',
      actionType: 'GENERATE_PLAN',
      parameters: {},
    };
  }

  // 5. Presets
  if (t.includes('bbq') || t.includes('cookout')) {
    return {
      speechResponse: 'Loaded the Sizzling Backyard BBQ party pack with burgers, sides, and yard games!',
      actionType: 'LOAD_PRESET',
      parameters: { presetId: 'preset-bbq' },
    };
  }
  if (t.includes('birthday') || t.includes('kid')) {
    return {
      speechResponse: 'Loaded the Kids Birthday Adventure party pack with pizza bagels, cupcakes, and party favors!',
      actionType: 'LOAD_PRESET',
      parameters: { presetId: 'preset-birthday' },
    };
  }
  if (t.includes('cocktail') || t.includes('tapas') || t.includes('wine')) {
    return {
      speechResponse: 'Loaded the Chic Cocktail & Tapas Soiree pack with charcuterie and botanical mixers!',
      actionType: 'LOAD_PRESET',
      parameters: { presetId: 'preset-cocktail' },
    };
  }
  if (t.includes('taco') || t.includes('fiesta') || t.includes('margarita')) {
    return {
      speechResponse: 'Loaded the Fiesta Taco Night pack with seasoned meats, tortillas, and salsa!',
      actionType: 'LOAD_PRESET',
      parameters: { presetId: 'preset-taco' },
    };
  }

  // 6. Optimize Budget / Value Brand
  if (t.includes('optimize') || t.includes('trim') || t.includes('save money') || t.includes('cut budget')) {
    return {
      speechResponse: 'Optimized your budget by swapping to Cymbal Everyday value brands and trimming excess items.',
      actionType: 'OPTIMIZE_BUDGET',
      parameters: {},
    };
  }
  if (t.includes('value brand') || t.includes('cheaper') || t.includes('budget tier') || t.includes('everyday brand')) {
    return {
      speechResponse: 'Switched items to Cymbal Everyday value tier for maximum savings.',
      actionType: 'SWAP_TIER',
      parameters: { tier: 'budget' },
    };
  }
  if (t.includes('premium') || t.includes('gold reserve') || t.includes('upgrade')) {
    return {
      speechResponse: 'Upgraded your shopping items to Cymbal Gold Reserve premium quality.',
      actionType: 'SWAP_TIER',
      parameters: { tier: 'premium' },
    };
  }

  // 7. Filter category
  if (t.includes('filter food') || t.includes('show food') || t.includes('show mains')) {
    return {
      speechResponse: 'Showing Food & Mains items.',
      actionType: 'FILTER_CATEGORY',
      parameters: { category: 'food' },
    };
  }
  if (t.includes('filter drink') || t.includes('show drink') || t.includes('show beverage')) {
    return {
      speechResponse: 'Showing Drinks & Ice items.',
      actionType: 'FILTER_CATEGORY',
      parameters: { category: 'beverage' },
    };
  }
  if (t.includes('tableware') || t.includes('plates') || t.includes('napkins')) {
    return {
      speechResponse: 'Showing Tableware and party essentials.',
      actionType: 'FILTER_CATEGORY',
      parameters: { category: 'tableware' },
    };
  }
  if (t.includes('decor') || t.includes('balloons')) {
    return {
      speechResponse: 'Showing Party Decorations.',
      actionType: 'FILTER_CATEGORY',
      parameters: { category: 'decor' },
    };
  }
  if (t.includes('games') || t.includes('activities')) {
    return {
      speechResponse: 'Showing Party Games and Activities.',
      actionType: 'FILTER_CATEGORY',
      parameters: { category: 'activities' },
    };
  }
  if (t.includes('show all') || t.includes('all items') || t.includes('clear filter')) {
    return {
      speechResponse: 'Showing all shopping list items.',
      actionType: 'FILTER_CATEGORY',
      parameters: { category: 'all' },
    };
  }

  // 8. Add Item
  if (t.startsWith('add ') || t.includes('add to cart') || t.includes('add ')) {
    const cleanItemName = t.replace('add to cart', '').replace('add', '').replace('packs of', '').replace('pack of', '').replace('bags of', '').replace('bag of', '').trim();
    return {
      speechResponse: `Added ${cleanItemName || 'item'} to your CymbalMart shopping list.`,
      actionType: 'ADD_ITEM',
      parameters: {
        item: {
          id: `voice-${Date.now()}`,
          name: cleanItemName.charAt(0).toUpperCase() + cleanItemName.slice(1) || 'Party Snack Special',
          brand: 'Cymbal Pantry Select',
          category: 'food',
          unitPrice: 5.99,
          quantity: 1,
          unit: 'pack',
          aisle: 'Aisle 3 - Grocery',
          tier: 'standard',
          isChecked: true,
          notes: 'Added via Voice Control',
        },
      },
    };
  }

  // 9. Remove Item
  if (t.startsWith('remove ') || t.startsWith('delete ')) {
    const targetName = t.replace('remove', '').replace('delete', '').trim();
    const matched = currentItems.find((i) => i.name.toLowerCase().includes(targetName));
    return {
      speechResponse: matched ? `Removed ${matched.name} from your cart.` : `Removed ${targetName} from your cart.`,
      actionType: 'REMOVE_ITEM',
      parameters: {
        targetItemId: matched?.id || '',
        targetName,
      },
    };
  }

  // 10. Check/Uncheck all
  if (t.includes('select all') || t.includes('check all')) {
    return {
      speechResponse: 'Selected all items in your shopping list.',
      actionType: 'CHECK_ALL',
      parameters: { checked: true },
    };
  }
  if (t.includes('uncheck all') || t.includes('deselect all')) {
    return {
      speechResponse: 'Deselected all items in your shopping list.',
      actionType: 'CHECK_ALL',
      parameters: { checked: false },
    };
  }

  // 11. Guest count & budget adjustments
  const guestMatch = t.match(/(\d+)\s*(guests|people|persons)/i) || t.match(/set guests to (\d+)/i);
  if (guestMatch) {
    const num = parseInt(guestMatch[1], 10);
    return {
      speechResponse: `Updated guest count to ${num} guests.`,
      actionType: 'UPDATE_EVENT',
      parameters: { guestCount: num },
    };
  }

  const budgetMatch = t.match(/(\d+)\s*(dollars|dollar|\$)/i) || t.match(/budget (?:to|of)\s*\$?(\d+)/i);
  if (budgetMatch) {
    const amt = parseFloat(budgetMatch[1] || budgetMatch[2]);
    return {
      speechResponse: `Updated target event budget to $${amt}.`,
      actionType: 'UPDATE_EVENT',
      parameters: { targetBudget: amt },
    };
  }

  // 12. Query total / Cart summary
  if (t.includes('total') || t.includes('cart') || t.includes('how much') || t.includes('budget left')) {
    return {
      speechResponse: `Your cart has ${currentItems.filter((i) => i.isChecked).length} items totaling $${(metrics.finalTotal || 0).toFixed(2)}. You are ${metrics.isOverBudget ? 'over' : 'under'} your $${currentEvent.targetBudget} budget.`,
      actionType: 'READ_CART',
      parameters: {},
    };
  }

  // Default QA
  return {
    speechResponse: `I heard "${transcript}". You can ask me to add items, change quantities, swap to value brands, filter categories, or proceed to checkout hands-free!`,
    actionType: 'GENERAL_QA',
    parameters: {},
  };
}

function generateFallbackItems(partyType: string, theme: string, budget: number, guestCount: number, dietary: string[]) {
  const isKid = partyType.toLowerCase().includes('kid') || theme.toLowerCase().includes('kid');
  const isCocktail = partyType.toLowerCase().includes('cocktail') || theme.toLowerCase().includes('tapas');
  const isBBQ = partyType.toLowerCase().includes('bbq') || theme.toLowerCase().includes('bbq');

  const items = [
    {
      id: `fb-${Date.now()}-1`,
      name: isBBQ ? 'Cymbal Angus Beef Burger Patties (8ct)' : isCocktail ? 'Artisan Charcuterie & Cheese Tasting Board' : isKid ? 'Mini Pizza Bagels (36ct)' : 'Gourmet Party Sandwich Platter (12ct)',
      brand: 'Cymbal Butcher & Deli Reserve',
      category: 'food',
      subcategory: 'Mains',
      unitPrice: isCocktail ? 16.99 : 14.49,
      quantity: Math.max(1, Math.ceil(guestCount / 6)),
      unit: 'pack',
      isChecked: true,
      aisle: 'Meat & Deli Case',
      tier: 'standard',
      notes: `Main food course portioned for ${guestCount} guests`,
      alternatives: [
        { tier: 'budget', name: 'Cymbal Everyday Value Pack', brand: 'Cymbal Everyday', unitPrice: 9.99 },
        { tier: 'premium', name: 'Cymbal Chef Selection Deluxe', brand: 'Cymbal Gold Reserve', unitPrice: 21.99 },
      ],
    },
    {
      id: `fb-${Date.now()}-2`,
      name: 'Fresh Garden Salad Bowl with House Vinaigrette',
      brand: 'Cymbal Market Fresh',
      category: 'food',
      subcategory: 'Sides',
      unitPrice: 8.99,
      quantity: Math.max(1, Math.ceil(guestCount / 10)),
      unit: 'bowl',
      isChecked: true,
      aisle: 'Produce - Ready Salads',
      tier: 'standard',
    },
    {
      id: `fb-${Date.now()}-3`,
      name: 'Artisan Potato & Tortilla Chips with Guacamole Duo',
      brand: 'Cymbal Kitchens',
      category: 'food',
      subcategory: 'Snacks',
      unitPrice: 6.49,
      quantity: Math.max(1, Math.ceil(guestCount / 8)),
      unit: 'set',
      isChecked: true,
      aisle: 'Aisle 6 - Snacks & Dips',
      tier: 'standard',
    },
    {
      id: `fb-${Date.now()}-4`,
      name: 'Bakery Fresh Sweet Treat Platter (Cupcakes & Brownie Bites)',
      brand: 'Cymbal Bakery Fresh',
      category: 'food',
      subcategory: 'Dessert',
      unitPrice: 12.99,
      quantity: Math.max(1, Math.ceil(guestCount / 12)),
      unit: 'platter',
      isChecked: true,
      aisle: 'Aisle 2 - Bakery',
      tier: 'standard',
    },
    {
      id: `fb-${Date.now()}-5`,
      name: isCocktail ? 'Sparkling Botanical Mixers & Craft Tonic (8-pack)' : 'Sparkling Citrus Refreshers & Craft Sodas (12-pack)',
      brand: 'Cymbal Refresh',
      category: 'beverage',
      subcategory: 'Beverages',
      unitPrice: 7.99,
      quantity: Math.max(2, Math.ceil(guestCount / 6)),
      unit: 'pack',
      isChecked: true,
      aisle: 'Aisle 4 - Cold Drinks',
      tier: 'standard',
    },
    {
      id: `fb-${Date.now()}-6`,
      name: 'Crystal Purified Party Ice Bag (10 lbs)',
      brand: 'Cymbal Arctic',
      category: 'beverage',
      subcategory: 'Essentials',
      unitPrice: 2.99,
      quantity: 2,
      unit: 'bag',
      isChecked: true,
      aisle: 'Front Ice Coolers',
      tier: 'budget',
    },
    {
      id: `fb-${Date.now()}-7`,
      name: 'Eco-Friendly Heavy-Duty Dinner Plates (50ct)',
      brand: 'Cymbal EcoChoice',
      category: 'tableware',
      subcategory: 'Plates',
      unitPrice: 8.99,
      quantity: 1,
      unit: 'pack',
      isChecked: true,
      aisle: 'Aisle 7 - Party & Tableware',
      tier: 'standard',
    },
    {
      id: `fb-${Date.now()}-8`,
      name: 'Compostable Cutlery & Soft 3-Ply Napkins Set (50ct)',
      brand: 'Cymbal Everyday',
      category: 'tableware',
      subcategory: 'Essentials',
      unitPrice: 6.49,
      quantity: 1,
      unit: 'set',
      isChecked: true,
      aisle: 'Aisle 7 - Party Goods',
      tier: 'budget',
    },
    {
      id: `fb-${Date.now()}-9`,
      name: `${theme} Festive Color Accent Table Runner & Balloons`,
      brand: 'Cymbal Party Glow',
      category: 'decor',
      subcategory: 'Decorations',
      unitPrice: 11.99,
      quantity: 1,
      unit: 'kit',
      isChecked: true,
      aisle: 'Aisle 7 - Seasonal Decor',
      tier: 'standard',
    },
    {
      id: `fb-${Date.now()}-10`,
      name: 'Party Game & Conversation Icebreaker Cards',
      brand: 'Cymbal Fun & Games',
      category: 'activities',
      subcategory: 'Games',
      unitPrice: 9.99,
      quantity: 1,
      unit: 'box',
      isChecked: true,
      aisle: 'Toy & Activity Aisle',
      tier: 'standard',
    },
  ];

  return items;
}

function handleOfflineChat(message: string, currentItems: any[], metrics: any, currentEvent: any) {
  const lower = message.toLowerCase();

  if (lower.includes('vegan') || lower.includes('plant')) {
    return {
      text: 'I found a great plant-based option in our deli aisle! I can add our popular Cymbal Organic Plant-Based Protein Platter and dairy-free dips for your guests.',
      proposedActions: [
        {
          type: 'add_item',
          description: 'Add Cymbal Organic Plant-Based Protein & Veggie Platter',
          item: {
            id: `chat-vegan-${Date.now()}`,
            name: 'Cymbal Organic Plant-Based Protein & Veggie Platter',
            brand: 'Cymbal Organics',
            category: 'food',
            subcategory: 'Plant-Based',
            unitPrice: 13.99,
            quantity: 1,
            unit: 'platter',
            aisle: 'Produce & Organic Deli',
            tier: 'standard',
            notes: '100% Vegan & Dairy-Free certified',
          },
        },
      ],
    };
  }

  if (lower.includes('save') || lower.includes('budget') || lower.includes('cheaper') || lower.includes('trim')) {
    return {
      text: `To help you stay within your $${currentEvent.targetBudget || 200} budget, I recommend switching to Cymbal Everyday value brand for tableware and snacks, which will trim around $14 from your total.`,
      proposedActions: [
        {
          type: 'budget_cut',
          description: 'Swap premium tableware & bulk snacks to Cymbal Everyday brand',
          savingsAmount: 14.5,
        },
      ],
    };
  }

  if (
    lower.includes('checkout') ||
    lower.includes('check out') ||
    lower.includes('take me to check out') ||
    lower.includes('take me to checkout') ||
    lower.includes('pay') ||
    lower.includes('place order') ||
    lower.includes('cart') ||
    lower.includes('review order')
  ) {
    const total = metrics.finalTotal ? metrics.finalTotal.toFixed(2) : '0.00';
    return {
      text: `Taking you to checkout! Your current total is $${total} with ${currentItems.filter((i) => i.isChecked).length} items selected for pickup or delivery. Click below or say "Place Order" to finalize!`,
      proposedActions: [
        {
          type: 'navigate_checkout',
          description: 'Proceed to Checkout & Review Order',
        },
      ],
    };
  }

  if (lower.includes('portion') || lower.includes('how much') || lower.includes('guests')) {
    const guests = currentEvent.guestCount || 12;
    return {
      text: `For ${guests} guests, standard host rules of thumb:\n• Protein: 1/3 lb to 1/2 lb per adult\n• Appetizers: 4-6 pieces per guest for a 2-3 hour event\n• Beverages: 2 drinks per guest for the first hour, 1 per hour after\n• Ice: 1 to 1.5 lbs of ice per person\n\nYour current cart has sufficient portions for ${guests} guests!`,
      proposedActions: [],
    };
  }

  return {
    text: `As your CymbalMart Assistant, I can help you add items, adjust quantities, swap to budget-friendly brands, or calculate exact portions for your ${currentEvent.partyType || 'event'}. What would you like to tweak?`,
    proposedActions: [],
  };
}

// Vite middleware / production serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CymbalMart Party Planner server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
